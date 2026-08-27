import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../models/analysis_model.dart';
import '../../providers/history_provider.dart';
import '../../widgets/verdict_badge.dart';
import '../../widgets/empty_state_view.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final historyState = ref.watch(historyProvider);

    final filters = [
      {'key': 'all', 'label': 'All'},
      {'key': 'verified', 'label': 'Verified'},
      {'key': 'false', 'label': 'False'},
      {'key': 'misleading', 'label': 'Misleading'},
      {'key': 'unverifiable', 'label': 'Unverifiable'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verification History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.read(historyProvider.notifier).loadHistory(),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Search past verifications...',
                  prefixIcon: Icon(Icons.search_rounded),
                ),
                onChanged: (val) => ref.read(historyProvider.notifier).search(val),
              ),
            ),

            // Filter Chips
            SizedBox(
              height: 46,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: filters.length,
                itemBuilder: (context, index) {
                  final filter = filters[index];
                  final isSelected = historyState.activeFilter == filter['key'];

                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter['label']!),
                      selected: isSelected,
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      onSelected: (_) => ref.read(historyProvider.notifier).setFilter(filter['key']!),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),

            // History List
            Expanded(
              child: historyState.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : (historyState.items.isEmpty
                      ? EmptyStateView(
                          icon: Icons.history_rounded,
                          title: 'No verifications yet.',
                          message: 'Verify a news claim, WhatsApp message, or URL to see it here.',
                          actionLabel: 'Verify Something Now',
                          onAction: () => context.push('/verify'),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: historyState.items.length,
                          itemBuilder: (context, index) {
                            final item = historyState.items[index];
                            return _buildHistoryTile(context, ref, item, isDark);
                          },
                        )),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTile(BuildContext context, WidgetRef ref, AnalysisModel item, bool isDark) {
    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.falseRed,
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white),
      ),
      onDismissed: (_) {
        ref.read(historyProvider.notifier).deleteItem(item.id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification deleted from history.')),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        ),
        child: ListTile(
          onTap: () => context.push('/result', extra: item),
          contentPadding: const EdgeInsets.all(12),
          leading: VerdictBadge(verdict: item.verdict),
          title: Text(
            item.originalContent,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelLarge(isDark).copyWith(fontSize: 14),
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Row(
              children: [
                Text(
                  '${item.inputType.toUpperCase()} • ${item.confidence}% confidence',
                  style: AppTextStyles.labelSmall(isDark),
                ),
                if (item.isCachedResult) ...[
                  const SizedBox(width: 6),
                  const Icon(Icons.bolt_rounded, size: 14, color: AppColors.misleadingYellow),
                ],
              ],
            ),
          ),
          trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
        ),
      ),
    );
  }
}
