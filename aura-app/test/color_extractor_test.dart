import 'dart:io';

import 'package:aura/core/services/color_extractor.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;

void main() {
  test('extracts five deterministic dominant colors locally', () async {
    final image = img.Image(width: 64, height: 64);
    for (var y = 0; y < 64; y++) {
      for (var x = 0; x < 64; x++)
        image.setPixelRgba(
          x,
          y,
          x < 40 ? 210 : 80,
          y < 32 ? 160 : 210,
          x < 32 ? 140 : 95,
          255,
        );
    }
    final directory = await Directory.systemTemp.createTemp('aura-colors');
    final file = File('${directory.path}/sample.png')
      ..writeAsBytesSync(img.encodePng(image));
    final first = await ColorExtractor().extract(file);
    final second = await ColorExtractor().extract(file);
    expect(first, hasLength(5));
    expect(second, first);
    await directory.delete(recursive: true);
  });
}
