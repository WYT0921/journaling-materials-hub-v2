import 'dart:io';

import 'package:image_picker/image_picker.dart';

import '../repositories/project_repository.dart';

class PhotoService {
  PhotoService(this._projects, {ImagePicker? picker})
    : _picker = picker ?? ImagePicker();
  final ProjectRepository _projects;
  final ImagePicker _picker;

  Future<String?> choose(
    String projectId,
    ImageSource source, {
    String basename = 'source',
  }) async {
    final result = await _picker.pickImage(
      source: source,
      imageQuality: 95,
      requestFullMetadata: false,
    );
    if (result == null) return null;
    return _projects.persistFile(projectId, File(result.path), basename);
  }

  Future<String?> recoverLost(String projectId) async {
    final response = await _picker.retrieveLostData();
    final files = response.files;
    final file = files == null || files.isEmpty ? null : files.first;
    return file == null
        ? null
        : _projects.persistFile(projectId, File(file.path), 'source');
  }
}
