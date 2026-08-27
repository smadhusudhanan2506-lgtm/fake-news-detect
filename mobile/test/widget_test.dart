import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:factcheck_ai/main.dart';

void main() {
  testWidgets('FactCheck AI App Smoke Test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: FactCheckAiApp(),
      ),
    );

    expect(find.byType(FactCheckAiApp), findsOneWidget);
  });
}
