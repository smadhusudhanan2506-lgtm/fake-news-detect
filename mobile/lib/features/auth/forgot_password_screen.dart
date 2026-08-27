import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Forgot Your Password?', style: AppTextStyles.displayLarge(isDark).copyWith(fontSize: 24)),
              const SizedBox(height: 8),
              Text('Enter your registered email address and we will send you password reset instructions.', style: AppTextStyles.bodyMedium(isDark)),
              const SizedBox(height: 24),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email Address', prefixIcon: Icon(Icons.email_outlined)),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() => _submitted = true);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Reset link sent to ${_emailController.text.isEmpty ? "your email" : _emailController.text}'),
                        backgroundColor: AppColors.verifiedGreen,
                      ),
                    );
                  },
                  child: const Text('Send Reset Link', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              if (_submitted) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.verifiedGreenBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.verifiedGreen.withOpacity(0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle_outline_rounded, color: AppColors.verifiedGreen),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Instructions dispatched! Please check your spam folder if you do not see it within 2 minutes.',
                          style: TextStyle(color: Color(0xFF064E3B), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
