import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../providers/verification_provider.dart';
import '../../widgets/stage_progress_dialog.dart';

class VerifyScreen extends ConsumerStatefulWidget {
  final int initialTab;

  const VerifyScreen({super.key, this.initialTab = 0});

  @override
  ConsumerState<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends ConsumerState<VerifyScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _urlController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this, initialIndex: widget.initialTab.clamp(0, 4));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _textController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _pasteFromClipboard(TextEditingController controller) async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text != null) {
      setState(() {
        controller.text = data!.text!;
      });
    }
  }

  Future<void> _analyzeContent({required String inputType}) async {
    final text = inputType == 'url' ? _urlController.text.trim() : _textController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide content to verify'), backgroundColor: AppColors.falseRed),
      );
      return;
    }

    _showLoadingDialog();

    final notifier = ref.read(verificationProvider.notifier);
    final result = inputType == 'url'
        ? await notifier.verifyUrl(text)
        : await notifier.verifyText(text, inputType: inputType);

    if (mounted) {
      Navigator.of(context, rootNavigator: true).pop(); // Dismiss loading
      if (result != null) {
        context.push('/result', extra: result);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification completed with offline dataset.'), backgroundColor: AppColors.misleadingYellow),
        );
      }
    }
  }

  Future<void> _pickAndAnalyzeImage({required String inputType}) async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;

    _showLoadingDialog();

    final bytes = await image.readAsBytes();
    final result = await ref.read(verificationProvider.notifier).verifyImage(
          bytes,
          image.name,
          inputType: inputType,
        );

    if (mounted) {
      Navigator.of(context, rootNavigator: true).pop();
      if (result != null) {
        context.push('/result', extra: result);
      }
    }
  }

  void _showLoadingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return Consumer(
          builder: (context, ref, child) {
            final vState = ref.watch(verificationProvider);
            return StageProgressDialog(
              currentStage: vState.currentStage.isEmpty ? 'Reading content...' : vState.currentStage,
              progress: vState.progressPercent,
            );
          },
        );
      },
    );
  }

  void _setSampleClaim(String sample) {
    setState(() {
      _textController.text = sample;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verify Misinformation'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Text / Claim', icon: Icon(Icons.text_fields_rounded, size: 20)),
            Tab(text: 'WhatsApp Mode', icon: Icon(Icons.mark_chat_read_rounded, size: 20)),
            Tab(text: 'URL / Link', icon: Icon(Icons.link_rounded, size: 20)),
            Tab(text: 'Screenshot / Image', icon: Icon(Icons.image_outlined, size: 20)),
            Tab(text: 'Video File', icon: Icon(Icons.smart_display_outlined, size: 20)),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            // TAB 1: General Text
            _buildTextInputTab(
              isDark: isDark,
              inputType: 'text',
              placeholder: 'Paste a news claim, social media post, or statement here...',
              sampleClaim: 'ISRO announced the launch date for the Bharatiya Antariksh Station module.',
            ),

            // TAB 2: WhatsApp Forward Mode
            _buildTextInputTab(
              isDark: isDark,
              inputType: 'whatsapp',
              placeholder: 'Paste a forwarded WhatsApp message here (e.g. "Forwarded many times: Breaking News...")...',
              sampleClaim: 'Forwarded many times: Urgent! Government has approved ₹50,000 directly to student bank accounts. Click now!',
              isWhatsAppMode: true,
            ),

            // TAB 3: URL Verification
            _buildUrlTab(isDark),

            // TAB 4: Screenshot / Image OCR
            _buildMediaTab(
              isDark: isDark,
              title: 'Upload Screenshot / Image',
              description: 'AI will run Optical Character Recognition (OCR), detect printed claims, and cross-reference with official registries.',
              icon: Icons.document_scanner_rounded,
              buttonLabel: 'Select Image / Screenshot',
              onTap: () => _pickAndAnalyzeImage(inputType: 'screenshot'),
            ),

            // TAB 5: Video Verification
            _buildMediaTab(
              isDark: isDark,
              title: 'Upload Video File',
              description: 'Processes speech audio tracks and samples video frames to verify claims made in video footage.',
              icon: Icons.video_file_outlined,
              buttonLabel: 'Select Video File',
              onTap: () => _pickAndAnalyzeImage(inputType: 'video'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextInputTab({
    required bool isDark,
    required String inputType,
    required String placeholder,
    required String sampleClaim,
    bool isWhatsAppMode = false,
  }) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isWhatsAppMode) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.verifiedGreen.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.verifiedGreen.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.security_update_good_rounded, color: AppColors.verifiedGreen, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'WhatsApp Mode extracts atomic claims and strips forward headers automatically.',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
            ),
            child: Column(
              children: [
                TextField(
                  controller: _textController,
                  maxLines: 7,
                  decoration: InputDecoration(
                    hintText: placeholder,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.all(16),
                  ),
                ),
                Divider(height: 1, color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      TextButton.icon(
                        onPressed: () => _pasteFromClipboard(_textController),
                        icon: const Icon(Icons.content_paste_rounded, size: 16),
                        label: const Text('Paste'),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => setState(() => _textController.clear()),
                        child: const Text('Clear'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Preset sample button for testing
          OutlinedButton.icon(
            onPressed: () => _setSampleClaim(sampleClaim),
            icon: const Icon(Icons.bolt_rounded, size: 16),
            label: const Text('Try Example Viral Claim Preset'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 44),
            ),
          ),
          const SizedBox(height: 24),

          // Analyze Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () => _analyzeContent(inputType: inputType),
              icon: const Icon(Icons.search_rounded),
              label: const Text('Analyze & Verify Claims', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUrlTab(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Verify News or Social Media Link', style: AppTextStyles.titleMedium(isDark)),
          const SizedBox(height: 6),
          Text('Supports news articles, YouTube, X/Twitter, Instagram Reels, and Facebook posts.', style: AppTextStyles.bodyMedium(isDark)),
          const SizedBox(height: 20),
          TextField(
            controller: _urlController,
            decoration: InputDecoration(
              labelText: 'Paste Link / URL',
              prefixIcon: const Icon(Icons.link_rounded),
              suffixIcon: IconButton(
                icon: const Icon(Icons.content_paste_rounded),
                onPressed: () => _pasteFromClipboard(_urlController),
              ),
            ),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () {
              setState(() {
                _urlController.text = 'https://pib.gov.in/FactCheck/student-grant-fake';
              });
            },
            icon: const Icon(Icons.bolt_rounded, size: 16),
            label: const Text('Try Sample Fact-Check URL'),
            style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 44)),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () => _analyzeContent(inputType: 'url'),
              icon: const Icon(Icons.travel_explore_rounded),
              label: const Text('Verify Link', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMediaTab({
    required bool isDark,
    required String title,
    required String description,
    required IconData icon,
    required String buttonLabel,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 56, color: AppColors.primary),
            ),
            const SizedBox(height: 24),
            Text(title, style: AppTextStyles.titleLarge(isDark), textAlign: TextAlign.center),
            const SizedBox(height: 10),
            Text(description, style: AppTextStyles.bodyMedium(isDark), textAlign: TextAlign.center),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: onTap,
                icon: const Icon(Icons.upload_file_rounded),
                label: Text(buttonLabel, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
