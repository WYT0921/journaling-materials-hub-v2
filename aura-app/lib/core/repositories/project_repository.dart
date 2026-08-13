import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

import '../models/aura_models.dart';

class ProjectRepository {
  Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    final root = await getApplicationDocumentsDirectory();
    final dbPath = p.join(root.path, 'aura.db');
    _database = await openDatabase(
      dbPath,
      version: 1,
      onCreate: (db, _) async {
        await db.execute(
          'CREATE TABLE projects (id TEXT PRIMARY KEY, updated_at INTEGER NOT NULL, json TEXT NOT NULL, preview_path TEXT)',
        );
      },
    );
    return _database!;
  }

  Future<List<AuraProject>> list() async {
    final rows = await (await database).query(
      'projects',
      orderBy: 'updated_at DESC',
    );
    return rows
        .map((row) => AuraProject.fromJson(jsonDecode(row['json'] as String)))
        .toList();
  }

  Future<void> save(AuraProject project) async {
    await (await database).insert('projects', {
      'id': project.id,
      'updated_at': project.updatedAt.millisecondsSinceEpoch,
      'json': project.encode(),
      'preview_path': project.previewPath,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> delete(AuraProject project) async {
    await (await database).delete(
      'projects',
      where: 'id = ?',
      whereArgs: [project.id],
    );
    final directory = await projectDirectory(project.id);
    if (await directory.exists()) await directory.delete(recursive: true);
  }

  Future<Directory> projectDirectory(String projectId) async {
    final root = await getApplicationDocumentsDirectory();
    final directory = Directory(p.join(root.path, 'projects', projectId));
    await directory.create(recursive: true);
    return directory;
  }

  Future<String> persistFile(
    String projectId,
    File source,
    String basename,
  ) async {
    final directory = await projectDirectory(projectId);
    final extension = p.extension(source.path).toLowerCase();
    final target = File(
      p.join(
        directory.path,
        '$basename${extension.isEmpty ? '.jpg' : extension}',
      ),
    );
    if (source.path != target.path) await source.copy(target.path);
    return target.path;
  }

  Future<String> exportPath(String projectId) async =>
      p.join((await projectDirectory(projectId)).path, 'export.png');
}
