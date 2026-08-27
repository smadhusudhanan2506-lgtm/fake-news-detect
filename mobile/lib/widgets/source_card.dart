import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/text_styles.dart';
import '../models/analysis_model.dart';

class SourceCard extends StatelessWidget {
  final SourceItemModel source;

  const SourceCard({super.key, required this.source});

  Future<void> _launchUrl() async {
    try {
      final uri = Uri.parse(source.url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final reliabilityPercent = (source.reliabilityScore * 100).toInt();

    return InkWell(
      onTap: _launchUrl,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: source.isGovernment
                    ? AppColors.primary.withOpacity(0.15)
                    : (source.isFactChecker
                        ? AppColors.verifiedGreen.withOpacity(0.15)
                        : Colors.grey.withOpacity(0.15)),
                shape: BoxShape.circle,
              ),
              child: Icon(
                source.isGovernment
                    ? Icons.account_balance_rounded
                    : (source.isFactChecker
                        ? Icons.verified_rounded
                        : Icons.language_rounded),
                size: 18,
                color: source.isGovernment
                    ? AppColors.primary
                    : (source.isFactChecker ? AppColors.verifiedGreen : Colors.grey),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossContent: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          source.name,
                          style: AppTextStyles.labelLarge(isDark).copyWith(fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (source.isGovernment)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'GOV',
                            style: AppTextStyles.labelSmall(isDark).copyWith(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        'Reliability: $reliabilityPercent%',
                        style: AppTextStyles.labelSmall(isDark).copyWith(
                          color: reliabilityPercent >= 80
                              ? AppColors.verifiedGreen
                              : (reliabilityPercent >= 50
                                  ? AppColors.misleadingYellow
                                  : AppColors.falseRed),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        'View Source ↗',
                        style: AppTextStyles.labelSmall(isDark).copyWith(
                          color: AppColors.primary,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
