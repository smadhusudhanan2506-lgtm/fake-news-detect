import 'package:flutter/material.dart';

class AppColors {
  // Primary Brand & Accents
  static const Color primary = Color(0xFF4F46E5); // Indigo 600
  static const Color primaryDark = Color(0xFF4338CA);
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color secondary = Color(0xFF0EA5E9); // Sky 500
  static const Color accent = Color(0xFF8B5CF6); // Purple 500

  // Verdict Colors (Accessibility & High Contrast)
  static const Color verifiedGreen = Color(0xFF10B981); // Emerald 500
  static const Color verifiedGreenBg = Color(0xFFECFDF5);
  static const Color falseRed = Color(0xFFEF4444); // Red 500
  static const Color falseRedBg = Color(0xFFFEF2F2);
  static const Color misleadingYellow = Color(0xFFF59E0B); // Amber 500
  static const Color misleadingYellowBg = Color(0xFFFFFBEB);
  static const Color unverifiableOrange = Color(0xFFF97316); // Orange 500
  static const Color unverifiableOrangeBg = Color(0xFFFFF7ED);
  static const Color analyzingBlue = Color(0xFF3B82F6); // Blue 500

  // Dark Mode Verdict Backgrounds
  static const Color verifiedGreenDarkBg = Color(0xFF064E3B);
  static const Color falseRedDarkBg = Color(0xFF7F1D1D);
  static const Color misleadingYellowDarkBg = Color(0xFF78350F);
  static const Color unverifiableOrangeDarkBg = Color(0xFF7C2D12);

  // Background & Surface
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceVariant = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);

  static const Color darkBg = Color(0xFF0B0F19);
  static const Color darkSurface = Color(0xFF111827);
  static const Color darkSurfaceVariant = Color(0xFF1F2937);
  static const Color darkBorder = Color(0xFF374151);

  // Text Colors
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color textTertiaryLight = Color(0xFF94A3B8);

  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);
  static const Color textTertiaryDark = Color(0xFF64748B);

  // Helper method for verdict color
  static Color getVerdictColor(String verdict) {
    switch (verdict.toLowerCase()) {
      case 'verified':
        return verifiedGreen;
      case 'false':
        return falseRed;
      case 'misleading':
        return misleadingYellow;
      case 'unverifiable':
        return unverifiableOrange;
      default:
        return analyzingBlue;
    }
  }

  static Color getVerdictBgColor(String verdict, bool isDark) {
    switch (verdict.toLowerCase()) {
      case 'verified':
        return isDark ? verifiedGreenDarkBg : verifiedGreenBg;
      case 'false':
        return isDark ? falseRedDarkBg : falseRedBg;
      case 'misleading':
        return isDark ? misleadingYellowDarkBg : misleadingYellowBg;
      case 'unverifiable':
        return isDark ? unverifiableOrangeDarkBg : unverifiableOrangeBg;
      default:
        return isDark ? darkSurfaceVariant : lightSurfaceVariant;
    }
  }
}
