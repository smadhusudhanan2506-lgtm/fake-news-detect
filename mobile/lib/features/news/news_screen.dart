import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../models/news_model.dart';
import '../../providers/news_provider.dart';

class NewsScreen extends ConsumerStatefulWidget {
  const NewsScreen({super.key});

  @override
  ConsumerState<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends ConsumerState<NewsScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showStoryDetails(BuildContext context, NewsModel item, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          expand: false,
          builder: (ctx, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(color: Colors.grey[400], borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.verifiedGreenBg, borderRadius: BorderRadius.circular(6)),
                        child: const Text('VERIFIED NEWS', style: TextStyle(color: AppColors.verifiedGreen, fontWeight: FontWeight.bold, fontSize: 11)),
                      ),
                      const SizedBox(width: 8),
                      Text(item.category, style: AppTextStyles.labelSmall(isDark)),
                      const Spacer(),
                      Text('${(item.reliabilityScore * 100).toInt()}% Trust', style: const TextStyle(color: AppColors.verifiedGreen, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(item.title, style: AppTextStyles.titleLarge(isDark)),
                  const SizedBox(height: 8),
                  Text('Source: ${item.source}', style: AppTextStyles.labelSmall(isDark)),
                  const SizedBox(height: 16),
                  if (item.summaryBulletPoints.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Key Takeaways:', style: AppTextStyles.labelLarge(isDark)),
                          const SizedBox(height: 8),
                          ...item.summaryBulletPoints.map((point) => Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                                    Expanded(child: Text(point, style: AppTextStyles.bodyMedium(isDark))),
                                  ],
                                ),
                              )),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Text(item.content, style: AppTextStyles.bodyLarge(isDark)),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final uri = Uri.parse(item.sourceUrl);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        }
                      },
                      icon: const Icon(Icons.launch_rounded, size: 18),
                      label: const Text('Read Original Article'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final newsState = ref.watch(newsProvider);

    final categories = ['All', ...AppConstants.newsCategories];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verified News Hub'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.read(newsProvider.notifier).loadAll(),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Box
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search verified news topics...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded),
                          onPressed: () {
                            _searchController.clear();
                            ref.read(newsProvider.notifier).loadAll();
                          },
                        )
                      : null,
                ),
                onSubmitted: (query) {
                  ref.read(newsServiceProvider).getNews(search: query);
                },
              ),
            ),

            // Category Chips Bar
            SizedBox(
              height: 48,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: categories.length,
                itemBuilder: (context, index) {
                  final cat = categories[index];
                  final isSelected = newsState.selectedCategory == cat;

                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSelected,
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      onSelected: (_) => ref.read(newsProvider.notifier).selectCategory(cat),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),

            // News List
            Expanded(
              child: newsState.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : (newsState.newsList.isEmpty
                      ? Center(child: Text('No verified news articles found.', style: AppTextStyles.bodyMedium(isDark)))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: newsState.newsList.length,
                          itemBuilder: (context, index) {
                            final item = newsState.newsList[index];
                            return _buildNewsCard(item, isDark);
                          },
                        )),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNewsCard(NewsModel item, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
      ),
      child: InkWell(
        onTap: () => _showStoryDetails(context, item, isDark),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.verifiedGreenBg,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('VERIFIED', style: TextStyle(color: AppColors.verifiedGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  Text(item.category, style: AppTextStyles.labelSmall(isDark)),
                  const Spacer(),
                  Text(
                    '${(item.reliabilityScore * 100).toInt()}% trust',
                    style: const TextStyle(color: AppColors.verifiedGreen, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(item.title, style: AppTextStyles.titleMedium(isDark).copyWith(fontSize: 16)),
              const SizedBox(height: 6),
              Text(
                item.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.bodyMedium(isDark),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text(item.source, style: AppTextStyles.labelSmall(isDark)),
                  const Spacer(),
                  Text('Read Story ↗', style: AppTextStyles.labelSmall(isDark).copyWith(color: AppColors.primary, fontWeight: FontWeight.w600)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
