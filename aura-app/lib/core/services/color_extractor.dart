import 'dart:io';
import 'dart:math';

import 'package:image/image.dart' as img;

class ColorExtractor {
  Future<List<int>> extract(File file, {int count = 5}) async {
    final decoded = img.decodeImage(await file.readAsBytes());
    if (decoded == null) throw const FormatException('无法解析照片');
    final sample = img.copyResize(
      decoded,
      width: 64,
      height: 64,
      interpolation: img.Interpolation.average,
    );
    final pixels = <List<double>>[];
    for (var y = 0; y < sample.height; y += 2) {
      for (var x = 0; x < sample.width; x += 2) {
        final pixel = sample.getPixel(x, y);
        if (pixel.a < 180) continue;
        final rgb = [
          pixel.r.toDouble(),
          pixel.g.toDouble(),
          pixel.b.toDouble(),
        ];
        final brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
        if (brightness > 248 || brightness < 8) continue;
        pixels.add(rgb);
      }
    }
    if (pixels.isEmpty)
      return const [0xffeadfd3, 0xffd7e3d0, 0xfff4d9de, 0xffa99a86, 0xff4b4138];
    final centers = List.generate(
      count,
      (index) => List<double>.from(
        pixels[(index * pixels.length / count).floor().clamp(
          0,
          pixels.length - 1,
        )],
      ),
    );
    final groups = List.generate(count, (_) => <List<double>>[]);
    for (var iteration = 0; iteration < 12; iteration++) {
      for (final group in groups) group.clear();
      for (final pixel in pixels) {
        var best = 0, distance = double.infinity;
        for (var i = 0; i < centers.length; i++) {
          final value =
              pow(pixel[0] - centers[i][0], 2) +
              pow(pixel[1] - centers[i][1], 2) +
              pow(pixel[2] - centers[i][2], 2);
          if (value < distance) {
            distance = value.toDouble();
            best = i;
          }
        }
        groups[best].add(pixel);
      }
      for (var i = 0; i < count; i++) {
        if (groups[i].isEmpty) continue;
        for (var channel = 0; channel < 3; channel++)
          centers[i][channel] =
              groups[i].map((p) => p[channel]).reduce((a, b) => a + b) /
              groups[i].length;
      }
    }
    final order = List.generate(count, (index) => index)
      ..sort((a, b) => groups[b].length.compareTo(groups[a].length));
    return order
        .map(
          (index) =>
              0xff000000 |
              centers[index][0].round() << 16 |
              centers[index][1].round() << 8 |
              centers[index][2].round(),
        )
        .toList();
  }
}
