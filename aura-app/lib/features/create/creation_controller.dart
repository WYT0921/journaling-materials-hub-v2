import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

import '../../app/app_controller.dart';
import '../../core/models/aura_models.dart';
import '../../core/services/color_extractor.dart';
import '../../core/services/export_service.dart';
import '../../core/services/photo_service.dart';

class CreationController extends ChangeNotifier {
  CreationController(this.app, AuraProject initial)
    : project = initial,
      photos = PhotoService(app.projects),
      exporter = ExportService(app.projects, fontFamilies: app.fontFamilies);
  final AppController app;
  late final PhotoService photos;
  late final ExportService exporter;
  final ColorExtractor colors = ColorExtractor();
  AuraProject project;
  bool busy = false;
  String? message;

  AuraTemplate get template => app.catalog!.template(project.templateKey);

  Future<void> choosePhoto(ImageSource source) async {
    await _run(() async {
      final path = await photos.choose(project.id, source);
      if (path == null) return;
      final palette = await colors.extract(File(path));
      project = project.copyWith(
        sourcePhotoPath: path,
        palette: palette,
        updatedAt: DateTime.now(),
      );
      await autosave();
    });
  }

  Future<void> chooseCover() async {
    await _run(() async {
      final path = await photos.choose(
        project.id,
        ImageSource.gallery,
        basename: 'cover',
      );
      if (path != null) {
        updateMusic(
          AuraMusicInfo(
            songName: project.music.songName,
            artist: project.music.artist,
            album: project.music.album,
            quote: project.music.quote,
            currentTime: project.music.currentTime,
            totalTime: project.music.totalTime,
            coverPath: path,
          ),
        );
        await autosave();
      }
    });
  }

  Future<void> recoverLostPhoto() async {
    final path = await photos.recoverLost(project.id);
    if (path != null) {
      project = project.copyWith(
        sourcePhotoPath: path,
        palette: await colors.extract(File(path)),
      );
      await autosave();
    }
  }

  void updateMusic(AuraMusicInfo value) {
    project = project.copyWith(
      music: value,
      title: value.songName.trim().isEmpty
          ? project.title
          : value.songName.trim(),
      updatedAt: DateTime.now(),
    );
    notifyListeners();
  }

  void selectTemplate(String key) {
    project = project.copyWith(templateKey: key, updatedAt: DateTime.now());
    notifyListeners();
  }

  void setRatio(AuraRatio ratio) {
    project = project.copyWith(ratio: ratio, updatedAt: DateTime.now());
    notifyListeners();
  }

  void setAdjustments(AuraAdjustments value) {
    project = project.copyWith(adjustments: value, updatedAt: DateTime.now());
    notifyListeners();
  }

  void setStep(int step) {
    project = project.copyWith(
      step: step.clamp(0, 4),
      updatedAt: DateTime.now(),
    );
    notifyListeners();
    autosave();
  }

  Future<void> autosave() => app.save(project);

  Future<File?> export() async {
    File? result;
    await _run(() async {
      result = await exporter.export(project, template);
      project = project.copyWith(
        previewPath: result!.path,
        updatedAt: DateTime.now(),
      );
      await autosave();
    });
    return result;
  }

  Future<void> _run(Future<void> Function() action) async {
    busy = true;
    message = null;
    notifyListeners();
    try {
      await action();
    } catch (error) {
      message = error.toString().replaceFirst('Exception: ', '');
    }
    busy = false;
    notifyListeners();
  }
}
