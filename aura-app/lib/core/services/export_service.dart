import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/services.dart';
import 'package:gal/gal.dart';
import 'package:share_plus/share_plus.dart';

import '../models/aura_models.dart';
import '../rendering/aura_card_painter.dart';
import '../repositories/project_repository.dart';

class ExportService {
  ExportService(this._projects, {this.fontFamilies = const {}});
  final ProjectRepository _projects;
  final Map<String, String> fontFamilies;

  Future<File> export(AuraProject project, AuraTemplate template) async {
    final size = project.ratio.exportSize;
    final recorder = ui.PictureRecorder();
    final canvas = ui.Canvas(recorder);
    ui.Image? photo;
    if (project.sourcePhotoPath != null &&
        await File(project.sourcePhotoPath!).exists()) {
      final codec = await ui.instantiateImageCodec(
        await File(project.sourcePhotoPath!).readAsBytes(),
      );
      photo = (await codec.getNextFrame()).image;
    }
    ui.Image? cover;
    if (project.music.coverPath != null &&
        await File(project.music.coverPath!).exists()) {
      final codec = await ui.instantiateImageCodec(
        await File(project.music.coverPath!).readAsBytes(),
      );
      cover = (await codec.getNextFrame()).image;
    }
    paintCard(
      canvas,
      ui.Size(size.$1.toDouble(), size.$2.toDouble()),
      project,
      template,
      photo,
      cover: cover,
      fontFamily: fontFamilies[project.adjustments.fontStyle],
    );
    final image = await recorder.endRecording().toImage(size.$1, size.$2);
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    if (data == null) throw const FileSystemException('PNG 编码失败');
    final file = File(await _projects.exportPath(project.id));
    await file.writeAsBytes(data.buffer.asUint8List(), flush: true);
    return file;
  }

  Future<void> saveToGallery(File file) async {
    if (!await Gal.hasAccess()) await Gal.requestAccess();
    await Gal.putImage(file.path, album: 'AURA Music');
  }

  Future<void> share(File file) async {
    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(file.path, mimeType: 'image/png')],
        text: 'AURA Music · 把喜欢的歌变成分享卡片',
      ),
    );
  }
}
