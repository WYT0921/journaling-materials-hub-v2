import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../models/aura_models.dart';
import '../rendering/aura_card_painter.dart';

class AuraCardPreview extends StatefulWidget {
  const AuraCardPreview({
    super.key,
    required this.project,
    required this.template,
    this.fit = BoxFit.contain,
    this.fontFamily,
  });
  final AuraProject project;
  final AuraTemplate template;
  final BoxFit fit;
  final String? fontFamily;

  @override
  State<AuraCardPreview> createState() => _AuraCardPreviewState();
}

class _AuraCardPreviewState extends State<AuraCardPreview> {
  ui.Image? image;
  ui.Image? cover;
  int generation = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant AuraCardPreview oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.project.sourcePhotoPath != widget.project.sourcePhotoPath ||
        oldWidget.project.music.coverPath != widget.project.music.coverPath)
      _load();
  }

  Future<void> _load() async {
    final current = ++generation;
    final sourceImage = await _decode(widget.project.sourcePhotoPath);
    final coverImage = await _decode(widget.project.music.coverPath);
    if (mounted && current == generation)
      setState(() {
        image = sourceImage;
        cover = coverImage;
      });
  }

  Future<ui.Image?> _decode(String? path) async {
    if (path == null || !await File(path).exists()) return null;
    final codec = await ui.instantiateImageCodec(
      await File(path).readAsBytes(),
    );
    return (await codec.getNextFrame()).image;
  }

  @override
  Widget build(BuildContext context) => AspectRatio(
    aspectRatio: widget.project.ratio.aspectRatio,
    child: CustomPaint(
      painter: AuraCardPainter(
        project: widget.project,
        template: widget.template,
        photo: image,
        cover: cover,
        fontFamily: widget.fontFamily,
      ),
      size: Size.infinite,
    ),
  );
}
