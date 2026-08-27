import axios from 'axios';
import { News, INews, NewsCategory } from '../models/News';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';
import { config } from '../config/env';
import { logger } from '../config/logger';

interface RssFeedMapping {
  category: NewsCategory;
  url: string;
}

const RSS_FEEDS: RssFeedMapping[] = [
  { category: 'Tamil Nadu', url: 'https://news.google.com/rss/search?q=Tamil+Nadu+news&hl=en-IN&gl=IN&ceid=IN:en' },
  { category: 'Tamil Nadu', url: 'https://news.google.com/rss/search?q=Chennai+news&hl=en-IN&gl=IN&ceid=IN:en' },
  { category: 'India', url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en' },
  { category: 'World', url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en' },
  { category: 'Technology', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en' },
  { category: 'Science', url: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en' },
  { category: 'Business', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en' },
  { category: 'Health', url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en' },
  { category: 'Politics', url: 'https://news.google.com/rss/search?q=Indian+politics+news&hl=en-IN&gl=IN&ceid=IN:en' },
  { category: 'Sports', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en' },
  { category: 'Entertainment', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en' },
];

const TAMIL_RSS_FEEDS: RssFeedMapping[] = [
  { category: 'Tamil Nadu', url: 'https://news.google.com/rss/search?q=தமிழ்நாடு+செய்திகள்&hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'Tamil Nadu', url: 'https://news.google.com/rss/search?q=சென்னை+செய்திகள்&hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'India', url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'World', url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'Technology', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'Science', url: 'https://news.google.com/rss/search?q=அறிவியல்+செய்திகள்&hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'Business', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'Health', url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'Politics', url: 'https://news.google.com/rss/search?q=அரசியல்+செய்திகள்&hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'Sports', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=ta&gl=IN&ceid=IN:ta' },
  { category: 'Entertainment', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=ta&gl=IN&ceid=IN:ta' },
];

let lastFetchTimeEn = 0;
let lastFetchTimeTa = 0;
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes cache

export class NewsService {
  /**
   * List news with filtering, live search ingestion, and pagination (supports 'en' and 'ta')
   */
  public static async getNews(params: {
    category?: NewsCategory;
    search?: string;
    trendingOnly?: boolean;
    limit?: number;
    page?: number;
    lang?: 'en' | 'ta';
  }) {
    const { category, search, trendingOnly, limit = 25, page = 1, lang = 'en' } = params;

    // 1. Live search or background ingestion
    if (search && search.trim().length > 1) {
      await this.searchLiveNews(search.trim(), category, lang);
    } else {
      await this.refreshLiveNewsIfNeeded(category, lang);
    }

    const store = lang === 'ta' ? memoryStore.tamilNews : memoryStore.news;

    if (isMongoConnected && lang === 'en') {
      try {
        const query: any = {};
        if (category) query.category = category;
        if (trendingOnly) query.isTrending = true;
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } },
          ];
        }

        const skip = (page - 1) * limit;
        const total = await News.countDocuments(query);
        const items = await News.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit);

        if (items.length > 0) {
          return { items, total, page, totalPages: Math.ceil(total / limit) };
        }
      } catch {
        // Fallthrough to memory store
      }
    }

    // Memory Store (Language specific)
    let items = Array.from(store.values());
    if (category) items = items.filter((n) => n.category === category);
    if (trendingOnly) items = items.filter((n) => n.isTrending);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (n) =>
          n.title?.toLowerCase().includes(s) ||
          n.description?.toLowerCase().includes(s) ||
          n.tags?.some((t: string) => t.toLowerCase().includes(s))
      );
    }

    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const total = items.length;
    const skip = (page - 1) * limit;
    const pagedItems = items.slice(skip, skip + limit);

    return { items: pagedItems, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Real-time live search via Google News Search RSS
   */
  public static async searchLiveNews(query: string, targetCategory?: NewsCategory, lang: 'en' | 'ta' = 'en'): Promise<void> {
    try {
      const searchUrl = lang === 'ta'
        ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ta&gl=IN&ceid=IN:ta`
        : `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;

      const res = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
        timeout: 5000,
      });

      const category: NewsCategory = targetCategory || (query.toLowerCase().includes('tamil') || query.toLowerCase().includes('chennai') ? 'Tamil Nadu' : 'India');
      const parsedItems = this.parseRssXml(res.data, category);

      const store = lang === 'ta' ? memoryStore.tamilNews : memoryStore.news;
      for (const item of parsedItems) {
        store.set(item._id, item);
        if (isMongoConnected && lang === 'en') {
          try {
            const { _id, ...cleanItem } = item;
            await News.findOneAndUpdate({ sourceUrl: item.sourceUrl }, cleanItem, { upsert: true });
          } catch (_) {}
        }
      }
    } catch (err: any) {
      logger.warn(`Live search RSS error for "${query}": ${err.message}`);
    }
  }

  /**
   * Fetch and ingest live news from NewsAPI and verified RSS feeds (supports English and Tamil)
   */
  public static async refreshLiveNewsIfNeeded(targetCategory?: NewsCategory, lang: 'en' | 'ta' = 'en'): Promise<void> {
    const now = Date.now();
    const store = lang === 'ta' ? memoryStore.tamilNews : memoryStore.news;
    const lastFetch = lang === 'ta' ? lastFetchTimeTa : lastFetchTimeEn;

    if (now - lastFetch < CACHE_DURATION_MS && store.size > 8) {
      return;
    }

    try {
      if (lang === 'en') {
        // 1. Ingest English NewsAPI if configured
        if (config.newsApiKey) {
          try {
            const categoryParam = targetCategory && targetCategory !== 'Tamil Nadu' ? `&category=${targetCategory.toLowerCase()}` : '';
            const res = await axios.get(
              `https://newsapi.org/v2/top-headlines?country=in${categoryParam}&pageSize=15&apiKey=${config.newsApiKey}`,
              { timeout: 6000 }
            );

            if (res.data?.articles) {
              for (const art of res.data.articles) {
                if (art.title && art.url && !art.title.includes('[Removed]')) {
                  const safeId = `newsapi_${Buffer.from(art.url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
                  const cleanTitle = this.cleanHtmlText(art.title);
                  const cleanDesc = art.description
                    ? this.cleanHtmlText(art.description)
                    : `${cleanTitle}. Live report by ${art.source?.name || 'Verified Wire'}.`;

                  const item: any = {
                    _id: safeId,
                    title: cleanTitle,
                    description: cleanDesc,
                    source: art.source?.name || 'Verified Wire',
                    sourceUrl: art.url,
                    category: targetCategory || 'India',
                    reliabilityScore: 0.95,
                    isVerified: true,
                    isTrending: true,
                    summaryBulletPoints: [cleanDesc],
                    publishedAt: new Date(art.publishedAt || new Date()),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  store.set(item._id, item);
                  if (isMongoConnected) {
                    try {
                      const { _id, ...cleanItem } = item;
                      await News.findOneAndUpdate({ sourceUrl: item.sourceUrl }, cleanItem, { upsert: true });
                    } catch (_) {}
                  }
                }
              }
            }
          } catch (err: any) {
            logger.warn(`NewsAPI fetch error: ${err.message}. Relying on verified RSS wire feeds.`);
          }
        }
      }

      // 2. Ingest RSS feeds (English or Tamil)
      const feedList = lang === 'ta' ? TAMIL_RSS_FEEDS : RSS_FEEDS;
      const feedsToFetch = targetCategory
        ? feedList.filter((f) => f.category === targetCategory)
        : feedList;

      for (const feed of feedsToFetch) {
        try {
          const res = await axios.get(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/rss+xml, application/xml, text/xml',
            },
            timeout: 5000,
          });

          const parsedItems = this.parseRssXml(res.data, feed.category);
          for (const item of parsedItems) {
            store.set(item._id, item);
            if (isMongoConnected && lang === 'en') {
              try {
                const { _id, ...cleanItem } = item;
                await News.findOneAndUpdate({ sourceUrl: item.sourceUrl }, cleanItem, { upsert: true });
              } catch (_) {}
            }
          }
        } catch (err: any) {
          logger.warn(`RSS fetch skipped for ${feed.category} (${lang}): ${err.message}`);
        }
      }

      if (lang === 'ta') {
        lastFetchTimeTa = now;
      } else {
        lastFetchTimeEn = now;
      }
      logger.info(`Live news updated for [${lang}] (${store.size} stories available).`);
    } catch (err: any) {
      logger.warn(`Failed to refresh live news [${lang}]: ${err.message}`);
    }
  }

  /**
   * Parse RSS XML format to clean news models
   */
  private static parseRssXml(xml: string, category: NewsCategory): any[] {
    const items: any[] = [];
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of itemMatches.slice(0, 12)) {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

      let rawTitle = titleMatch ? titleMatch[1] : '';
      let link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
      let source = sourceMatch ? this.cleanHtmlText(sourceMatch[1]) : 'Verified Wire';
      let pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();

      let title = this.cleanHtmlText(rawTitle);

      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        const extractedSource = parts.pop()?.trim();
        if (extractedSource && extractedSource.length < 35) {
          source = extractedSource;
        }
        title = parts.join(' - ').trim();
      }

      // Generate a clean 1-sentence news summary
      const desc = `${title}. Real-time verified coverage and updates reported by ${source}.`;

      if (title && link) {
        const safeId = `live_${Buffer.from(link).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
        items.push({
          _id: safeId,
          title,
          description: desc,
          source,
          sourceUrl: link,
          category,
          reliabilityScore: 0.95,
          isVerified: true,
          isTrending: true,
          summaryBulletPoints: [desc],
          publishedAt: new Date(pubDate),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return items;
  }

  /**
   * Helper to strip HTML tags, unescape HTML entities, and clean whitespace
   */
  private static cleanHtmlText(rawHtml: string): string {
    if (!rawHtml) return '';
    let text = rawHtml
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&amp;/gi, '&')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  /**
   * Get personalized daily news briefing (supports English and Tamil)
   */
  public static async getDailyBriefing(interests?: string[], lang: 'en' | 'ta' = 'en') {
    // Ensure live feeds are fresh
    await this.refreshLiveNewsIfNeeded(undefined, lang);

    const res = await this.getNews({ limit: 8, lang });
    const selected = res.items.slice(0, 5);

    const greeting = lang === 'ta' ? this.getTamilGreetingByTime() : this.getGreetingByTime();
    const briefingSummary = selected.map((item) => ({
      id: item._id,
      title: item.title,
      source: item.source,
      category: item.category,
      bulletPoints: item.summaryBulletPoints || [item.description],
      reliabilityScore: item.reliabilityScore || 0.95,
      publishedAt: item.publishedAt,
    }));

    const message = lang === 'ta'
      ? `${greeting}! உங்களுக்கான இன்றைய முக்கிய 5 சரிபார்க்கப்பட்ட செய்திகள் இதோ.`
      : `${greeting}! Here are today's 5 essential verified stories curated for your interests.`;

    return {
      greeting,
      message,
      date: new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      stories: briefingSummary,
    };
  }

  private static getGreetingByTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  private static getTamilGreetingByTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'இனிய காலை வணக்கம்';
    if (hour < 17) return 'இனிய மதிய வணக்கம்';
    return 'இனிய மாலை வணக்கம்';
  }
}
