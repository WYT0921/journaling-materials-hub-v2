import 'package:aura/core/models/aura_models.dart';
import 'package:aura/core/widgets/aura_card_preview.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final template = AuraTemplate(
    key: 'fresh-rounded',
    name: '清新圆角',
    style: 'fresh',
    supportedRatios: const ['1:1', '4:3', '9:16'],
    config: const {
      'layers': [
        {
          'id': 'background-main',
          'type': 'background',
          'x': 0,
          'y': 0,
          'width': 1,
          'height': 1,
        },
        {
          'id': 'photo-main',
          'type': 'photo',
          'x': .05,
          'y': .42,
          'width': .9,
          'height': .53,
        },
        {
          'id': 'player-main',
          'type': 'player',
          'x': .08,
          'y': .08,
          'width': .84,
          'height': .28,
        },
      ],
    },
  );

  for (final ratio in AuraRatio.values) {
    testWidgets('renders ${ratio.value} preview without a source photo', (
      tester,
    ) async {
      final project = AuraProject(
        id: 'p',
        title: 'Card',
        updatedAt: DateTime(2026),
        ratio: ratio,
        music: const AuraMusicInfo(
          songName: '一首很长很长的歌',
          artist: 'AURA',
          quote: 'take your time',
        ),
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Center(
            child: SizedBox(
              width: 300,
              child: AuraCardPreview(project: project, template: template),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.byType(CustomPaint), findsWidgets);
    });
  }
}
