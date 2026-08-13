import 'dart:math';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../models/aura_models.dart';

class AuraCardPainter extends CustomPainter {
  AuraCardPainter({
    required this.project,
    required this.template,
    this.photo,
    this.cover,
    this.fontFamily,
  });
  final AuraProject project;
  final AuraTemplate template;
  final ui.Image? photo;
  final ui.Image? cover;
  final String? fontFamily;

  @override
  void paint(Canvas canvas, Size size) => paintCard(
    canvas,
    size,
    project,
    template,
    photo,
    cover: cover,
    fontFamily: fontFamily,
  );

  @override
  bool shouldRepaint(covariant AuraCardPainter oldDelegate) =>
      oldDelegate.project != project ||
      oldDelegate.template != template ||
      oldDelegate.photo != photo ||
      oldDelegate.cover != cover ||
      oldDelegate.fontFamily != fontFamily;
}

void paintCard(
  Canvas canvas,
  Size size,
  AuraProject project,
  AuraTemplate template,
  ui.Image? photo, {
  ui.Image? cover,
  String? fontFamily,
}) {
  final palette = project.palette.isEmpty
      ? const [0xffdce8d7]
      : project.palette;
  final primary = Color(
    palette[project.adjustments.paletteIndex.clamp(0, palette.length - 1)],
  );
  final background = project.adjustments.background;
  final rect = Offset.zero & size;
  if (background == 'solid') {
    canvas.drawRect(rect, Paint()..color = primary);
  } else if (background == 'paper') {
    canvas.drawRect(
      rect,
      Paint()..color = Color.lerp(primary, const Color(0xfffffbf4), .72)!,
    );
    final grain = Paint()
      ..color = const Color(0x18000000)
      ..strokeWidth = max(1, size.width / 700);
    for (var i = 0; i < 70; i++) {
      final x = ((i * 47) % 101) / 101 * size.width;
      final y = ((i * 83) % 103) / 103 * size.height;
      canvas.drawCircle(Offset(x, y), (i % 3 + 1) * size.width / 1200, grain);
    }
  } else {
    canvas.drawRect(
      rect,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color.lerp(primary, Colors.white, .35)!,
            const Color(0xfffff8f1),
            Color.lerp(primary, const Color(0xffffdce7), .35)!,
          ],
        ).createShader(rect),
    );
  }

  final layers = (template.config['layers'] as List? ?? const []).cast<Map>();
  Rect layerRect(String type, Rect fallback) {
    final matches = layers.cast<Map<String, dynamic>>().where(
      (item) => item['type'] == type,
    );
    final layer = matches.isEmpty ? null : matches.first;
    if (layer == null) return fallback;
    return Rect.fromLTWH(
      (layer['x'] as num? ?? 0).toDouble() * size.width,
      (layer['y'] as num? ?? 0).toDouble() * size.height,
      (layer['width'] as num? ?? 1).toDouble() * size.width,
      (layer['height'] as num? ?? 1).toDouble() * size.height,
    );
  }

  final photoRect = layerRect(
    'photo',
    Rect.fromLTWH(
      size.width * .05,
      size.height * .42,
      size.width * .9,
      size.height * .53,
    ),
  );
  _drawPhoto(canvas, photoRect, photo, project.adjustments, primary);
  final playerRect = layerRect(
    'player',
    Rect.fromLTWH(
      size.width * .08,
      size.height * .08,
      size.width * .84,
      size.height * .28,
    ),
  );
  _drawPlayer(
    canvas,
    playerRect,
    project.music,
    template.style,
    primary,
    cover ?? photo,
    fontFamily,
  );
  _drawDecorations(
    canvas,
    size,
    project.adjustments.decorationDensity,
    primary,
    template.style,
  );
  if (project.music.quote.isNotEmpty)
    _drawText(
      canvas,
      project.music.quote,
      Offset(
        photoRect.left + photoRect.width * .04,
        photoRect.bottom - photoRect.height * .08,
      ),
      photoRect.width * .7,
      photoRect.width * .045,
      template.style == 'vinyl' ? Colors.white : const Color(0xff3d352f),
      italic: true,
      fontFamily: fontFamily,
    );
}

void _drawPhoto(
  Canvas canvas,
  Rect target,
  ui.Image? image,
  AuraAdjustments adjustments,
  Color primary,
) {
  final radius = Radius.circular(target.shortestSide * .04);
  canvas.save();
  canvas.clipRRect(RRect.fromRectAndRadius(target, radius));
  if (image == null) {
    canvas.drawRect(
      target,
      Paint()..color = Color.lerp(primary, Colors.white, .4)!,
    );
    final icon = TextPainter(
      text: TextSpan(
        text: 'PHOTO',
        style: TextStyle(
          color: Colors.white.withValues(alpha: .8),
          fontSize: target.width * .08,
          fontWeight: FontWeight.w700,
          letterSpacing: 4,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    icon.paint(canvas, target.center - Offset(icon.width / 2, icon.height / 2));
  } else {
    final imageRatio = image.width / image.height,
        targetRatio = target.width / target.height;
    double sourceWidth = image.width.toDouble(),
        sourceHeight = image.height.toDouble();
    if (imageRatio > targetRatio)
      sourceWidth = sourceHeight * targetRatio;
    else
      sourceHeight = sourceWidth / targetRatio;
    sourceWidth /= adjustments.photoScale;
    sourceHeight /= adjustments.photoScale;
    final maxX = image.width - sourceWidth, maxY = image.height - sourceHeight;
    final left = (maxX / 2 + adjustments.photoOffsetX * maxX / 2)
        .clamp(0, maxX)
        .toDouble();
    final top = (maxY / 2 + adjustments.photoOffsetY * maxY / 2)
        .clamp(0, maxY)
        .toDouble();
    canvas.drawImageRect(
      image,
      Rect.fromLTWH(left, top, sourceWidth, sourceHeight),
      target,
      Paint()..filterQuality = FilterQuality.high,
    );
  }
  canvas.restore();
}

void _drawPlayer(
  Canvas canvas,
  Rect rect,
  AuraMusicInfo music,
  String style,
  Color primary,
  ui.Image? photo,
  String? fontFamily,
) {
  final dark = style == 'vinyl';
  final cardColor = dark
      ? const Color(0xdd181714)
      : style == 'cute'
      ? const Color(0xeefce3ea)
      : Color.lerp(primary, Colors.white, .78)!.withValues(alpha: .92);
  canvas.drawRRect(
    RRect.fromRectAndRadius(rect, Radius.circular(rect.height * .16)),
    Paint()..color = cardColor,
  );
  if (style == 'vintage')
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, Radius.circular(rect.height * .16)),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = rect.width * .008
        ..color = const Color(0x55715f43),
    );
  final ink = dark ? const Color(0xfff3eadc) : const Color(0xff302d29);
  final cover = Rect.fromLTWH(
    rect.left + rect.width * .05,
    rect.top + rect.height * .14,
    rect.height * .72,
    rect.height * .72,
  );
  if (style == 'vinyl') {
    canvas.drawCircle(
      cover.center,
      cover.width / 2,
      Paint()..color = const Color(0xff080808),
    );
    canvas.drawCircle(
      cover.center,
      cover.width * .16,
      Paint()..color = primary,
    );
    canvas.drawCircle(
      cover.center,
      cover.width * .03,
      Paint()..color = const Color(0xffece5d8),
    );
  } else if (photo != null) {
    _drawPhoto(canvas, cover, photo, const AuraAdjustments(), primary);
  } else {
    canvas.drawRRect(
      RRect.fromRectAndRadius(cover, Radius.circular(cover.width * .18)),
      Paint()..color = primary.withValues(alpha: .6),
    );
  }
  final textLeft = cover.right + rect.width * .045;
  _drawText(
    canvas,
    music.songName.isEmpty ? 'Your Song' : music.songName,
    Offset(textLeft, rect.top + rect.height * .18),
    rect.right - textLeft - rect.width * .04,
    rect.height * .15,
    ink,
    bold: true,
    fontFamily: fontFamily,
  );
  _drawText(
    canvas,
    music.artist.isEmpty ? 'Artist' : music.artist,
    Offset(textLeft, rect.top + rect.height * .38),
    rect.right - textLeft,
    rect.height * .09,
    ink.withValues(alpha: .68),
    fontFamily: fontFamily,
  );
  final lineY = rect.top + rect.height * .66;
  if (style == 'waveform') {
    final wave = Paint()
      ..color = primary
      ..strokeWidth = max(1, rect.width * .005)
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < 34; i++) {
      final x = textLeft + (rect.right - textLeft - rect.width * .05) * i / 33;
      final height = rect.height * (.03 + ((i * 17) % 9) / 90);
      canvas.drawLine(
        Offset(x, lineY - height),
        Offset(x, lineY + height),
        wave,
      );
    }
  } else {
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          textLeft,
          lineY,
          rect.right - textLeft - rect.width * .06,
          rect.height * .025,
        ),
        const Radius.circular(20),
      ),
      Paint()..color = ink.withValues(alpha: .16),
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          textLeft,
          lineY,
          (rect.right - textLeft - rect.width * .06) * .42,
          rect.height * .025,
        ),
        const Radius.circular(20),
      ),
      Paint()..color = primary,
    );
  }
  _drawText(
    canvas,
    music.currentTime,
    Offset(textLeft, lineY + rect.height * .07),
    rect.width * .2,
    rect.height * .07,
    ink.withValues(alpha: .55),
  );
  _drawText(
    canvas,
    music.totalTime,
    Offset(rect.right - rect.width * .17, lineY + rect.height * .07),
    rect.width * .13,
    rect.height * .07,
    ink.withValues(alpha: .55),
  );
}

void _drawDecorations(
  Canvas canvas,
  Size size,
  int count,
  Color color,
  String style,
) {
  final paint = Paint()
    ..color = style == 'vinyl'
        ? const Color(0xaaffffff)
        : color.withValues(alpha: .72)
    ..style = PaintingStyle.stroke
    ..strokeWidth = max(1.2, size.width * .004);
  for (var i = 0; i < count; i++) {
    final x = (.08 + ((i * 37) % 81) / 100) * size.width,
        y = (.05 + ((i * 53) % 88) / 100) * size.height,
        r = size.shortestSide * (.012 + (i % 3) * .006);
    canvas.drawLine(Offset(x - r, y), Offset(x + r, y), paint);
    canvas.drawLine(Offset(x, y - r), Offset(x, y + r), paint);
    canvas.drawCircle(Offset(x, y), r * .32, paint);
  }
}

void _drawText(
  Canvas canvas,
  String value,
  Offset offset,
  double maxWidth,
  double fontSize,
  Color color, {
  bool bold = false,
  bool italic = false,
  String? fontFamily,
}) {
  final painter = TextPainter(
    maxLines: 2,
    ellipsis: '…',
    text: TextSpan(
      text: value,
      style: TextStyle(
        color: color,
        fontSize: fontSize,
        height: 1.15,
        fontFamily: fontFamily,
        fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
        fontStyle: italic ? FontStyle.italic : FontStyle.normal,
      ),
    ),
    textDirection: TextDirection.ltr,
  )..layout(maxWidth: maxWidth);
  painter.paint(canvas, offset);
}
