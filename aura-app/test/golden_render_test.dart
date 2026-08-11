import 'dart:convert';
import 'dart:io';

import 'package:aura/core/models/aura_models.dart';
import 'package:aura/core/widgets/aura_card_preview.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final binding = TestWidgetsFlutterBinding.ensureInitialized();
  late AuraCatalog catalog;

  setUpAll(() async {
    final data = jsonDecode(
      await File('assets/catalog/starter_catalog.json').readAsString(),
    );
    catalog = AuraCatalog.fromJson(Map<String, dynamic>.from(data));
  });

  for (final templateKey in const [
    'fresh-rounded',
    'cute-pink',
    'vintage-paper',
    'vinyl-record',
    'waveform-line',
  ]) {
    for (final ratio in AuraRatio.values) {
      testWidgets('$templateKey ${ratio.value} golden', (tester) async {
        final logicalSize = switch (ratio) {
          AuraRatio.square => const Size(360, 360),
          AuraRatio.landscape => const Size(360, 270),
          AuraRatio.story => const Size(360, 640),
        };
        await binding.setSurfaceSize(Size(420, logicalSize.height + 60));
        addTearDown(() => binding.setSurfaceSize(null));
        final boundaryKey = ValueKey('$templateKey-${ratio.value}');
        final project = AuraProject(
          id: 'golden-$templateKey-${ratio.value}',
          title: 'AURA',
          updatedAt: DateTime.utc(2026, 8, 11),
          ratio: ratio,
          templateKey: templateKey,
          palette: const [
            0xfffff8ed,
            0xffffdce5,
            0xffb8cfb0,
            0xff9f7f65,
            0xff302c2a,
          ],
          music: const AuraMusicInfo(
            songName: '夏夜晚风 Summer Breeze',
            artist: 'AURA · 治愈音乐计划',
            album: 'Soft Memories',
            quote: '把此刻收藏成一张会发光的卡片。',
            currentTime: '1:28',
            totalTime: '4:12',
          ),
        );
        await tester.pumpWidget(
          MaterialApp(
            debugShowCheckedModeBanner: false,
            home: Scaffold(
              body: Center(
                child: RepaintBoundary(
                  key: boundaryKey,
                  child: SizedBox(
                    width: logicalSize.width,
                    height: logicalSize.height,
                    child: AuraCardPreview(
                      project: project,
                      template: catalog.template(templateKey),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        expect(
          find.byKey(boundaryKey),
          matchesGoldenFile(
            'goldens/${templateKey}_${ratio.value.replaceAll(':', 'x')}.png',
          ),
        );
      });
    }
  }
}
