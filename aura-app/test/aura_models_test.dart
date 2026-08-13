import 'dart:convert';

import 'package:aura/core/models/aura_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('all output ratios use the required PNG dimensions', () {
    expect(AuraRatio.square.exportSize, (1080, 1080));
    expect(AuraRatio.landscape.exportSize, (1440, 1080));
    expect(AuraRatio.story.exportSize, (1080, 1920));
  });

  test('project JSON preserves local-only creation state', () {
    final project = AuraProject(
      id: 'p1',
      title: 'Lucky Day',
      updatedAt: DateTime.utc(2026, 8, 10),
      sourcePhotoPath: '/local/photo.jpg',
      ratio: AuraRatio.story,
      music: const AuraMusicInfo(songName: 'Lucky Day', artist: 'AURA'),
      palette: const [0xff112233, 0xff445566],
      templateKey: 'cute-pink',
      adjustments: const AuraAdjustments(
        photoScale: 1.8,
        decorationDensity: 12,
      ),
      step: 3,
    );
    final decoded = AuraProject.fromJson(jsonDecode(project.encode()));
    expect(decoded.id, 'p1');
    expect(decoded.ratio, AuraRatio.story);
    expect(decoded.music.artist, 'AURA');
    expect(decoded.adjustments.photoScale, 1.8);
    expect(decoded.sourcePhotoPath, '/local/photo.jpg');
    expect(decoded.step, 3);
  });

  test('catalog rejects unknown schema versions', () {
    expect(
      () => AuraCatalog.fromJson({'schemaVersion': 2}),
      throwsFormatException,
    );
  });
}
