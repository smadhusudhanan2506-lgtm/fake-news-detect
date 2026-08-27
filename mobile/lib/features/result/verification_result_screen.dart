import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../models/analysis_model.dart';
import '../../providers/moderation_provider.dart';
import '../../widgets/confidence_gauge.dart';
import '../../widgets/verdict_badge.dart';
import '../../widgets/source_card.dart';

class VerificationResultScreen extends ConsumerWidget {
  final AnalysisModel analysis;

  const VerificationResultScreen({super.key, required this.analysis});

  void _shareResult(BuildContext context) {
    Share.share(
      'FactCheck AI Verification Result:\n\n'
      'Verdict: ${analysis.verdict.toUpperCase()}\n'
      'Confidence: ${analysis.confidence}%\n'
      'Claim: "${analysis.originalContent}"\n\n'
      'Explanation: ${analysis.explanation}\n\n'
      'Verified via FactCheck AI — "Verify Before You Believe."',
    );
  }

  void _showReportDialog(BuildContext context, WidgetRef ref) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Report to Moderator'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'If you believe this verification verdict is inaccurate or requires manual expert review, submit it to our human moderation team.',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Reason for reporting...',
                hintText: 'e.g. New official notification released today',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (reasonController.text.trim().isNotEmpty) {
                await ref.read(moderationServiceProvider).submitReport(
                      analysisId: analysis.id,
                      claimText: analysis.originalContent,
                      originalContent: analysis.originalContent,
                      aiVerdict: analysis.verdict,
                      aiConfidence: analysis.confidence,
                      reason: reasonController.text.trim(),
                    );
                if (context.mounted) {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Report submitted to moderation queue.'),
                      backgroundColor: AppColors.verifiedGreen,
                    ),
                  );
                }
              }
            },
            child: const Text('Submit Report'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final verdictColor = AppColors.getVerdictColor(analysis.verdict);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verification Result'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flag_outlined),
            tooltip: 'Report to Moderator',
            onPressed: () => _showReportDialog(context, ref),
          ),
          IconButton(
            icon: const Icon(Icons.share_rounded),
            tooltip: 'Share Result',
            onPressed: () => _shareResult(context),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Verdict Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.getVerdictBgColor(analysis.verdict, isDark),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: verdictColor.withOpacity(0.5), width: 1.5),
                ),
                child: Column(
                  children: [
                    VerdictBadge(verdict: analysis.verdict, isLarge: true),
                    const SizedBox(height: 16),
                    ConfidenceGauge(confidence: analysis.confidence, verdict: analysis.verdict),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Analyzed Claim Card
              Text('ANALYZED CLAIM', style: AppTextStyles.labelSmall(isDark).copyWith(letterSpacing: 0.8, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
                child: Text(
                  '"${analysis.originalContent}"',
                  style: AppTextStyles.bodyLarge(isDark).copyWith(fontWeight: FontWeight.w600, fontStyle: FontStyle.italic),
                ),
              ),
              const SizedBox(height: 24),

              // WHY? Key Reasons Breakdown
              Text('WHY THIS VERDICT?', style: AppTextStyles.labelSmall(isDark).copyWith(letterSpacing: 0.8, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      analysis.explanation,
                      style: AppTextStyles.bodyMedium(isDark).copyWith(fontWeight: FontWeight.w500),
                    ),
                    if (analysis.whyPoints.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      ...analysis.whyPoints.map((point) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.check_circle_outline_rounded, size: 16, color: verdictColor),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(point, style: AppTextStyles.bodyMedium(isDark)),
                                ),
                              ],
                            ),
                          )),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Verified Source Citations
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('SOURCES & EVIDENCE', style: AppTextStyles.labelSmall(isDark).copyWith(letterSpacing: 0.8, fontWeight: FontWeight.bold)),
                  Text('${analysis.sources.length} Verified Sources', style: AppTextStyles.labelSmall(isDark)),
                ],
              ),
              const SizedBox(height: 8),
              if (analysis.sources.isEmpty)
                Text('Primary evidence referenced from official database records.', style: AppTextStyles.bodyMedium(isDark))
              else
                ...analysis.sources.map((src) => SourceCard(source: src)),
              const SizedBox(height: 28),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => context.go('/chat'),
                      icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                      label: const Text('Ask AI About This'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _shareResult(context),
                      icon: const Icon(Icons.share_rounded, size: 18),
                      label: const Text('Share Result'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
