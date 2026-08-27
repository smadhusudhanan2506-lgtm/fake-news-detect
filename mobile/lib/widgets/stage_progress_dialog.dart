import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/text_styles.dart';

class StageProgressDialog extends StatelessWidget {
  final String currentStage;
  final double progress;

  const StageProgressDialog({
    super.key,
    required this.currentStage,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final stages = [
      'Reading content...',
      'Extracting claims...',
      'Searching fact-check sources...',
      'Comparing evidence & AI reasoning...',
      'Verification complete.',
    ];

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 3),
                ),
                const SizedBox(width: 14),
                Text(
                  'FactCheck Engine',
                  style: AppTextStyles.titleMedium(isDark),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 8,
                backgroundColor: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
            const SizedBox(height: 20),
            ...stages.map((stage) {
              final isDone = stages.indexOf(stage) < stages.indexOf(currentStage) || stage == currentStage;
              final isCurrent = stage == currentStage;

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Icon(
                      isDone
                          ? Icons.check_circle_rounded
                          : Icons.radio_button_unchecked_rounded,
                      size: 16,
                      color: isCurrent
                          ? AppColors.primary
                          : (isDone ? AppColors.verifiedGreen : Colors.grey),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      stage,
                      style: AppTextStyles.bodyMedium(isDark).copyWith(
                        fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                        color: isCurrent
                            ? (isDark ? Colors.white : AppColors.primary)
                            : (isDone
                                ? (isDark ? Colors.white70 : Colors.black87)
                                : Colors.grey),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
