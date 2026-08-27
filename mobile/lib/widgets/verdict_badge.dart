import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/text_styles.dart';

class VerdictBadge extends StatelessWidget {
  final String verdict;
  final bool isLarge;

  const VerdictBadge({
    super.key,
    required this.verdict,
    this.isLarge = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = AppColors.getVerdictColor(verdict);
    final bgColor = AppColors.getVerdictBgColor(verdict, isDark);

    IconData icon;
    String label;

    switch (verdict.toLowerCase()) {
      case 'verified':
        icon = Icons.check_circle_rounded;
        label = 'VERIFIED';
        break;
      case 'false':
        icon = Icons.cancel_rounded;
        label = 'FALSE';
        break;
      case 'misleading':
        icon = Icons.warning_rounded;
        label = 'MISLEADING';
        break;
      case 'unverifiable':
        icon = Icons.help_outline_rounded;
        label = 'UNVERIFIABLE';
        break;
      default:
        icon = Icons.hourglass_top_rounded;
        label = 'ANALYZING';
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isLarge ? 14 : 10,
        vertical: isLarge ? 8 : 4,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: color.withOpacity(0.4), width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: isLarge ? 20 : 16),
          const SizedBox(width: 6),
          Text(
            label,
            style: isLarge
                ? AppTextStyles.titleMedium(isDark).copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  )
                : AppTextStyles.labelSmall(isDark).copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                  ),
          ),
        ],
      ),
    );
  }
}
