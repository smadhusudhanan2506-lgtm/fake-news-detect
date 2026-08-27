import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/text_styles.dart';

class ConfidenceGauge extends StatelessWidget {
  final int confidence;
  final String verdict;

  const ConfidenceGauge({
    super.key,
    required this.confidence,
    required this.verdict,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = AppColors.getVerdictColor(verdict);

    return Column(
      children: [
        SizedBox(
          width: 110,
          height: 110,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: confidence / 100.0,
                strokeWidth: 9,
                backgroundColor: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                valueColor: AlwaysStoppedAnimation<Color>(color),
                strokeCap: StrokeCap.round,
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$confidence%',
                    style: AppTextStyles.titleLarge(isDark).copyWith(
                      fontWeight: FontWeight.w800,
                      color: color,
                    ),
                  ),
                  Text(
                    'Confidence',
                    style: AppTextStyles.labelSmall(isDark).copyWith(
                      fontSize: 11,
                      color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Confidence reflects the strength and agreement of available evidence, not mathematical certainty.',
          textAlign: TextAlign.center,
          style: AppTextStyles.labelSmall(isDark).copyWith(
            fontSize: 12,
            fontStyle: FontStyle.italic,
            color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
          ),
        ),
      ],
    );
  }
}
