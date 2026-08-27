import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../models/moderation_model.dart';
import '../../providers/moderation_provider.dart';
import '../../widgets/verdict_badge.dart';

class ModeratorDashboardScreen extends ConsumerStatefulWidget {
  const ModeratorDashboardScreen({super.key});

  @override
  ConsumerState<ModeratorDashboardScreen> createState() => _ModeratorDashboardScreenState();
}

class _ModeratorDashboardScreenState extends ConsumerState<ModeratorDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showReviewDialog(BuildContext context, ModerationItemModel item) {
    final notesController = TextEditingController();
    String selectedVerdict = item.aiVerdict;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Review Moderation Item'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('FLAGGED CLAIM:', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                    const SizedBox(height: 4),
                    Text('"${item.claimText}"', style: const TextStyle(fontStyle: FontStyle.italic)),
                    const SizedBox(height: 12),
                    Text('REPORTER REASON:', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                    Text(item.reason, style: const TextStyle(fontSize: 13)),
                    const SizedBox(height: 14),
                    const Text('DECISION VERDICT:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: selectedVerdict,
                      decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                      items: const [
                        DropdownMenuItem(value: 'verified', child: Text('VERIFIED (True)')),
                        DropdownMenuItem(value: 'false', child: Text('FALSE (Debunked)')),
                        DropdownMenuItem(value: 'misleading', child: Text('MISLEADING (Partial)')),
                        DropdownMenuItem(value: 'unverifiable', child: Text('UNVERIFIABLE')),
                      ],
                      onChanged: (v) {
                        if (v != null) setDialogState(() => selectedVerdict = v);
                      },
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: notesController,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Moderator Notes & Evidence Link...'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    await ref.read(moderationProvider.notifier).reviewItem(
                          item.id,
                          action: 'approve',
                          notes: notesController.text.trim(),
                          finalVerdict: selectedVerdict,
                        );
                    if (context.mounted) {
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Moderation decision submitted successfully.'), backgroundColor: AppColors.verifiedGreen),
                      );
                    }
                  },
                  child: const Text('Submit Decision'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final modState = ref.watch(moderationProvider);
    final stats = modState.stats;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Moderator Command Center'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Review Queue', icon: Icon(Icons.rate_review_outlined, size: 20)),
            Tab(text: 'Domain Reliability', icon: Icon(Icons.domain_verification_rounded, size: 20)),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            // TAB 1: Moderation Queue & Stats
            SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stats Grid
                  Row(
                    children: [
                      _buildStatCard('Pending', '${stats["pending"] ?? 1}', AppColors.unverifiableOrange, isDark),
                      const SizedBox(width: 10),
                      _buildStatCard('Reviewed', '${stats["approved"] ?? 0}', AppColors.verifiedGreen, isDark),
                      const SizedBox(width: 10),
                      _buildStatCard('Reports Today', '${stats["reportsToday"] ?? 1}', AppColors.primary, isDark),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Queue Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Flagged Content Queue', style: AppTextStyles.titleMedium(isDark)),
                      Text('${modState.queue.length} items', style: AppTextStyles.labelSmall(isDark)),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (modState.isLoading)
                    const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
                  else if (modState.queue.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text('Moderation queue is clean. No pending reports.', style: AppTextStyles.bodyMedium(isDark)),
                    )
                  else
                    ...modState.queue.map((item) => _buildQueueItemCard(context, item, isDark)),
                ],
              ),
            ),

            // TAB 2: Source Reliability Manager
            ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: modState.sources.length,
              itemBuilder: (context, index) {
                final src = modState.sources[index];
                final score = ((src['reliabilityScore'] ?? 0.8) * 100).toInt();

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
                      Icon(
                        src['isGovernment'] == true
                            ? Icons.account_balance_rounded
                            : (src['isFactChecker'] == true ? Icons.verified_rounded : Icons.language_rounded),
                        color: src['isGovernment'] == true ? AppColors.primary : AppColors.verifiedGreen,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(src['name'] ?? src['domain'], style: AppTextStyles.labelLarge(isDark)),
                            Text(src['domain'] ?? '', style: AppTextStyles.labelSmall(isDark)),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: score >= 80 ? AppColors.verifiedGreenBg : AppColors.misleadingYellowBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '$score% Trust',
                          style: TextStyle(
                            color: score >= 80 ? AppColors.verifiedGreen : AppColors.misleadingYellow,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 4),
            Text(label, style: AppTextStyles.labelSmall(isDark).copyWith(fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _buildQueueItemCard(BuildContext context, ModerationItemModel item, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              VerdictBadge(verdict: item.aiVerdict),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.falseRed.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  item.priority.toUpperCase(),
                  style: const TextStyle(color: AppColors.falseRed, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
              const Spacer(),
              Text('By: ${item.reportedBy}', style: AppTextStyles.labelSmall(isDark)),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '"${item.claimText}"',
            style: AppTextStyles.bodyMedium(isDark).copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          Text(
            'Report Reason: ${item.reason}',
            style: AppTextStyles.labelSmall(isDark).copyWith(fontStyle: FontStyle.italic),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 40,
            child: ElevatedButton.icon(
              onPressed: () => _showReviewDialog(context, item),
              icon: const Icon(Icons.rate_review_rounded, size: 16),
              label: const Text('Review & Adjudicate'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
