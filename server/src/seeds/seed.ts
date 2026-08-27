import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { News } from '../models/News';
import { FactCheck } from '../models/FactCheck';
import { Analysis } from '../models/Analysis';
import { ModerationQueue } from '../models/ModerationQueue';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';
import { logger } from '../config/logger';

export const seedInitialData = async () => {
  logger.info('🌱 Seeding initial sample data (DEMO DATA)...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Users
  const sampleUsers = [
    {
      _id: 'user_regular_1',
      name: 'Aditi Sharma',
      email: 'aditi@example.com',
      password: hashedPassword,
      role: 'user' as const,
      preferences: {
        categories: ['India', 'Technology', 'Science', 'Health'],
        location: { country: 'India', city: 'Bengaluru' },
        notificationsEnabled: true,
        dailyBriefingTime: '08:00',
        language: 'en',
      },
      settings: {
        theme: 'system' as const,
        fontSize: 'medium' as const,
        ttsAutoPlay: false,
        haptics: true,
        dataRetentionDays: 90,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'user_mod_1',
      name: 'Vikram Mehta (Moderator)',
      email: 'moderator@factcheck.ai',
      password: hashedPassword,
      role: 'moderator' as const,
      preferences: {
        categories: ['India', 'World', 'Politics', 'Business'],
        location: { country: 'India', city: 'New Delhi' },
        notificationsEnabled: true,
        dailyBriefingTime: '07:30',
        language: 'en',
      },
      settings: {
        theme: 'dark' as const,
        fontSize: 'medium' as const,
        ttsAutoPlay: false,
        haptics: true,
        dataRetentionDays: 180,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 2. Verified News
  const sampleNews = [
    {
      _id: 'news_1',
      title: 'ISRO Announces Next-Generation Space Station Module Test Flight',
      description: 'The Indian Space Research Organisation has scheduled uncrewed docking maneuvers for the upcoming Bharatiya Antariksh Station.',
      content: 'ISRO officials confirmed that preliminary integration of the environmental control and life support systems has been finalized at the Vikram Sarabhai Space Centre.',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800',
      source: 'The Hindu Science Desk',
      sourceUrl: 'https://thehindu.com/sci-tech/isro-station-2026',
      category: 'Science' as const,
      country: 'India',
      language: 'en',
      publishedAt: new Date(Date.now() - 2 * 3600 * 1000),
      reliabilityScore: 0.94,
      tags: ['ISRO', 'Space', 'India', 'Science'],
      isVerified: true,
      isTrending: true,
      summaryBulletPoints: [
        'ISRO finalized orbital docking protocols for BAS module.',
        'Launch window targeted for late 2026 aboard LVM3.',
        'Primary life support integration completed successfully.',
      ],
    },
    {
      _id: 'news_2',
      title: 'Global Renewable Energy Deployment Reaches Record High in Q1',
      description: 'International Energy Agency reports solar and wind installations outpaced fossil generation additions worldwide.',
      content: 'Rapid expansion of grid-scale battery storage and decreased solar photovoltaic module costs drove accelerated deployment across Asia and Europe.',
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=800',
      source: 'Reuters Energy',
      sourceUrl: 'https://reuters.com/business/energy/renewables-record-2026',
      category: 'World' as const,
      country: 'Global',
      language: 'en',
      publishedAt: new Date(Date.now() - 5 * 3600 * 1000),
      reliabilityScore: 0.93,
      tags: ['Renewables', 'Energy', 'Environment', 'World'],
      isVerified: true,
      isTrending: true,
      summaryBulletPoints: [
        'Solar and wind capacity added over 120 GW globally in Q1.',
        'Grid storage battery costs fell by 14% year-over-year.',
      ],
    },
    {
      _id: 'news_3',
      title: 'Digital Personal Data Protection Rules Implemented Nationwide',
      description: 'Regulatory framework mandates strict consent mechanisms and rapid breach reporting within 72 hours.',
      content: 'The Ministry of Electronics and IT issued final operational guidelines for digital platforms, providing robust user data controls.',
      imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800',
      source: 'Press Information Bureau (PIB)',
      sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=DPDP2026',
      category: 'Technology' as const,
      country: 'India',
      language: 'en',
      publishedAt: new Date(Date.now() - 10 * 3600 * 1000),
      reliabilityScore: 0.98,
      tags: ['Privacy', 'Tech', 'India', 'Law'],
      isVerified: true,
      isTrending: false,
      summaryBulletPoints: [
        'Mandatory explicit consent for sensitive personal data processing.',
        '72-hour notification timeline for data fiduciary breaches.',
      ],
    },
    {
      _id: 'news_4',
      title: 'Medical Researchers Develop Targeted Nanotherapy for Drug-Resistant Pathogens',
      description: 'Peer-reviewed clinical trials demonstrate 92% efficacy in neutralizing resistant bacterial strains without harming healthy cells.',
      content: 'The clinical breakthrough combines engineered peptides with localized ultrasound activation, bypassing traditional antimicrobial resistance.',
      imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=800',
      source: 'Nature Medicine Journal',
      sourceUrl: 'https://nature.com/articles/nanomed-breakthrough-2026',
      category: 'Health' as const,
      country: 'Global',
      language: 'en',
      publishedAt: new Date(Date.now() - 14 * 3600 * 1000),
      reliabilityScore: 0.96,
      tags: ['Health', 'Medicine', 'Science'],
      isVerified: true,
      isTrending: true,
      summaryBulletPoints: [
        '92% neutralization of resistant bacterial cultures in phase II trials.',
        'Ultra-low toxicity observed in patient safety cohorts.',
      ],
    },
  ];

  // 3. Fact Checks
  const sampleFactChecks = [
    {
      _id: 'fc_1',
      claim: 'Government of India announces ₹50,000 cash grant for every student from next month.',
      normalizedClaim: 'government of india announces 50 000 cash grant for every student',
      publisher: 'PIB Fact Check',
      rating: 'False',
      verdict: 'false' as const,
      url: 'https://pib.gov.in/FactCheck',
      publishedDate: '2026-02-12',
      sourceReliability: 0.98,
      claimant: 'Viral WhatsApp Forward',
      retrievedAt: new Date(),
    },
    {
      _id: 'fc_2',
      claim: 'Class 10 and 12 Board Exams scrapped entirely nationwide under new education guidelines.',
      normalizedClaim: 'class 10 and 12 board exams scrapped entirely nationwide',
      publisher: 'Alt News Fact Check',
      rating: 'Misleading',
      verdict: 'misleading' as const,
      url: 'https://altnews.in/fact-check-board-exams',
      publishedDate: '2026-01-20',
      sourceReliability: 0.95,
      claimant: 'Social Media Posts',
      retrievedAt: new Date(),
    },
  ];

  // 4. Sample Analyses in History
  const sampleAnalyses = [
    {
      _id: 'analysis_demo_1',
      userId: 'user_regular_1',
      inputType: 'whatsapp' as const,
      originalContent: 'Forwarded many times: Urgent! Government has approved ₹50,000 directly to student bank accounts. Click bit.ly/claim50k now!',
      claims: [
        {
          claimText: 'Government has approved ₹50,000 directly to student bank accounts.',
          normalizedClaim: 'government has approved 50 000 directly to student bank accounts',
          verdict: 'false' as const,
          confidence: 96,
          explanation: 'Debunked by PIB Fact Check. No such direct cash distribution scheme exists.',
          evidence: [
            {
              sourceName: 'PIB Fact Check',
              sourceUrl: 'https://pib.gov.in/FactCheck',
              snippet: 'PIB Fact Check confirmed this viral message is completely fraudulent and a phishing link.',
              reliabilityScore: 0.98,
              type: 'government' as const,
            },
          ],
        },
      ],
      verdict: 'false' as const,
      confidence: 96,
      evidence: [
        {
          sourceName: 'PIB Fact Check (Government of India)',
          sourceUrl: 'https://pib.gov.in/FactCheck',
          snippet: 'Official fact-check confirms viral claim is fake. Ministry of Education has announced no such disbursement.',
          reliabilityScore: 0.98,
          type: 'government' as const,
        },
      ],
      explanation: 'This claim is FALSE. Official government fact-checkers confirmed that no ₹50,000 scholarship or cash disbursement exists. The link provided is a known credential-harvesting scam.',
      whyPoints: [
        'Officially debunked by Press Information Bureau (PIB Fact Check).',
        'No Ministry of Education circular or budgetary allocation exists.',
        'Includes known phishing domain pattern and urgent forwarding headers.',
      ],
      sources: [
        {
          name: 'PIB Fact Check',
          url: 'https://pib.gov.in/FactCheck',
          reliabilityScore: 0.98,
          isGovernment: true,
          isFactChecker: false,
        },
      ],
      processingTimeMs: 420,
      stagesCompleted: ['Reading content...', 'Extracting claims...', 'Searching fact-check sources...', 'Verification complete.'],
      createdAt: new Date(Date.now() - 3600 * 1000 * 3),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 3),
    },
  ];

  // 5. Moderation Queue Items
  const sampleModeration = [
    {
      _id: 'mod_queue_1',
      analysisId: 'analysis_demo_1',
      claimText: 'Government has approved ₹50,000 directly to student bank accounts.',
      originalContent: 'Forwarded message with fake circular screenshot claiming scholarship scheme.',
      aiVerdict: 'false',
      aiConfidence: 96,
      reportedBy: 'Aditi Sharma',
      reason: 'Viral scam circulating in university WhatsApp groups requesting bank details.',
      priority: 'high' as const,
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 2),
    },
  ];

  // Seed into MemoryStore
  sampleUsers.forEach((u) => memoryStore.users.set(u._id, u));
  sampleNews.forEach((n) => memoryStore.news.set(n._id, n));
  sampleFactChecks.forEach((f) => memoryStore.factChecks.set(f._id, f));
  sampleAnalyses.forEach((a) => memoryStore.analyses.set(a._id, a));
  sampleModeration.forEach((m) => memoryStore.moderationQueue.set(m._id, m));

  // Seed into MongoDB if connected
  if (isMongoConnected) {
    try {
      for (const u of sampleUsers) {
        const { _id, ...cleanU } = u;
        await User.findOneAndUpdate({ email: u.email }, cleanU, { upsert: true });
      }
      for (const n of sampleNews) {
        const { _id, ...cleanN } = n;
        await News.findOneAndUpdate({ sourceUrl: n.sourceUrl }, cleanN, { upsert: true });
      }
      for (const f of sampleFactChecks) {
        const { _id, ...cleanF } = f;
        await FactCheck.findOneAndUpdate({ url: f.url }, cleanF, { upsert: true });
      }
      for (const a of sampleAnalyses) {
        const { _id, ...cleanA } = a;
        await Analysis.findOneAndUpdate({ originalContent: a.originalContent }, cleanA, { upsert: true });
      }
      for (const m of sampleModeration) {
        const { _id, ...cleanM } = m;
        await ModerationQueue.findOneAndUpdate({ claimText: m.claimText }, cleanM, { upsert: true });
      }
      logger.info(' MongoDB seeded successfully with sample collections.');
    } catch (err: any) {
      logger.warn(`Failed to seed MongoDB (${err.message}). Memory store initialized.`);
    }
  }

  logger.info(' Sample data loaded: 2 Users, 4 Verified News, 2 Fact Checks, 1 Analysis, 1 Moderation item.');
};
