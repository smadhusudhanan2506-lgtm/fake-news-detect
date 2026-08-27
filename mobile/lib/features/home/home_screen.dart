import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../providers/auth_provider.dart';
import '../../providers/news_provider.dart';
import '../../providers/history_provider.dart';
import '../../widgets/verdict_badge.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);
    final newsState = ref.watch(newsProvider);
    final historyState = ref.watch(historyProvider);

    final userName = authState.user?.name ?? 'Fact Checker';

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await ref.read(newsProvider.notifier).loadAll();
            await ref.read(historyProvider.notifier).loadHistory();
          },
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header: Greeting & Role Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Good Day,',
                          style: AppTextStyles.bodyMedium(isDark).copyWith(
                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          ),
                        ),
                        Text(
                          userName,
                          style: AppTextStyles.titleLarge(isDark).copyWith(fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        if (authState.user?.isModerator == true)
                          ActionChip(
                            avatar: const Icon(Icons.admin_panel_settings_rounded, size: 16, color: Colors.white),
                            label: const Text('MOD DASHBOARD', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                            backgroundColor: AppColors.primary,
                            onPressed: () => context.push('/moderator'),
                          ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.notifications_none_rounded),
                          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("You're all caught up on notifications.")),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Fast Search / Verify Box
                InkWell(
                  onTap: () => context.push('/verify'),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search_rounded, color: AppColors.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Paste a WhatsApp forward, URL, or claim...',
                            style: AppTextStyles.bodyMedium(isDark).copyWith(
                              color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('Verify', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Quick Actions Grid
                Text('Quick Verification', style: AppTextStyles.titleMedium(isDark)),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.1,
                  children: [
                    _buildQuickActionTile(context, Icons.paste_rounded, 'Paste Text', AppColors.primary, isDark, () => context.push('/verify?tab=0')),
                    _buildQuickActionTile(context, Icons.mark_chat_read_rounded, 'WhatsApp', AppColors.verifiedGreen, isDark, () => context.push('/verify?tab=1')),
                    _buildQuickActionTile(context, Icons.link_rounded, 'Verify URL', AppColors.secondary, isDark, () => context.push('/verify?tab=2')),
                    _buildQuickActionTile(context, Icons.document_scanner_rounded, 'Screenshot', AppColors.accent, isDark, () => context.push('/verify?tab=3')),
                    _buildQuickActionTile(context, Icons.image_outlined, 'Image', AppColors.misleadingYellow, isDark, () => context.push('/verify?tab=3')),
                    _buildQuickActionTile(context, Icons.smart_display_rounded, 'Video', AppColors.falseRed, isDark, () => context.push('/verify?tab=4')),
                  ],
                ),
                const SizedBox(height: 24),

                // Daily Briefing Card
                if (newsState.dailyBriefing != null) ...[
                  _buildDailyBriefingBanner(context, newsState.dailyBriefing!, isDark),
                  const SizedBox(height: 24),
                ],

                // Trending Misinformation & Fact Checks
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Verified Fact-Checks', style: AppTextStyles.titleMedium(isDark)),
                    TextButton(
                      onPressed: () => context.go('/news'),
                      child: const Text('View All'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (newsState.trendingList.isEmpty)
                  const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                else
                  SizedBox(
                    height: 175,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: newsState.trendingList.length,
                      itemBuilder: (context, idx) {
                        final item = newsState.trendingList[idx];
                        return Container(
                          width: 260,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.verifiedGreenBg,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'VERIFIED NEWS',
                                      style: TextStyle(color: AppColors.verifiedGreen, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(item.category, style: AppTextStyles.labelSmall(isDark)),
                                ],
                              ),
                              Text(
                                item.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: AppTextStyles.titleMedium(isDark).copyWith(fontSize: 14),
                              ),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(item.source, style: AppTextStyles.labelSmall(isDark)),
                                  Text('${(item.reliabilityScore * 100).toInt()}% trust',
                                      style: const TextStyle(color: AppColors.verifiedGreen, fontSize: 11, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 24),

                // Recent Verifications
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Recent Analyses', style: AppTextStyles.titleMedium(isDark)),
                    TextButton(
                      onPressed: () => context.go('/history'),
                      child: const Text('All History'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (historyState.items.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    ),
                    child: Text('No verifications yet. Check your first piece of news.', style: AppTextStyles.bodyMedium(isDark)),
                  )
                else
                  ...historyState.items.take(3).map((item) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                      ),
                      child: Row(
                        children: [
                          VerdictBadge(verdict: item.verdict),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.originalContent,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppTextStyles.labelLarge(isDark),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Confidence: ${item.confidence}%',
                                  style: AppTextStyles.labelSmall(isDark),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                            onPressed: () => context.push('/result', extra: item),
                          ),
                        ],
                      ),
                    );
                  }),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/verify'),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.fact_check_rounded, color: Colors.white),
        label: const Text('Verify Now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildQuickActionTile(BuildContext context, IconData icon, String label, Color color, bool isDark, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: AppTextStyles.labelSmall(isDark).copyWith(fontSize: 11, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDailyBriefingBanner(BuildContext context, Map<String, dynamic> briefing, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.wb_sunny_rounded, color: Colors.amberAccent, size: 20),
              const SizedBox(width: 8),
              Text(
                'DAILY NEWS BRIEFING',
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
              ),
              const Spacer(),
              Text(
                briefing['date'] ?? '',
                style: const TextStyle(color: Colors.white70, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            briefing['message'] ?? 'Here are today\'s verified top stories.',
            style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600, height: 1.3),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () => context.go('/news'),
            icon: const Icon(Icons.menu_book_rounded, size: 16, color: AppColors.primary),
            label: const Text('Read Full Briefing', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            ),
          ),
        ],
      ),
    );
  }
}
