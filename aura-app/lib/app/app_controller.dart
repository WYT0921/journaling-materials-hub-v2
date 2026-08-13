import 'package:flutter/foundation.dart';

import '../core/models/aura_models.dart';
import '../core/repositories/catalog_repository.dart';
import '../core/repositories/project_repository.dart';

class AppController extends ChangeNotifier {
  AppController({ProjectRepository? projects, CatalogRepository? catalogs})
    : projects = projects ?? ProjectRepository(),
      catalogs = catalogs ?? CatalogRepository();
  final ProjectRepository projects;
  final CatalogRepository catalogs;
  AuraCatalog? catalog;
  Map<String, String> fontFamilies = const {
    'serif': 'serif',
    'handwriting': 'cursive',
  };
  List<AuraProject> recent = [];
  bool loading = true;
  String? notice;

  Future<void> initialize() async {
    loading = true;
    notifyListeners();
    try {
      final results = await Future.wait([catalogs.load(), projects.list()]);
      catalog = results[0] as AuraCatalog;
      recent = results[1] as List<AuraProject>;
      fontFamilies = {...fontFamilies, ...await catalogs.loadFonts(catalog!)};
    } catch (error) {
      notice = '本地数据加载失败：$error';
    }
    loading = false;
    notifyListeners();
  }

  AuraProject create({String templateKey = 'fresh-rounded'}) {
    final now = DateTime.now();
    return AuraProject(
      id: 'aura-${now.microsecondsSinceEpoch}',
      title: '我的音乐卡片',
      updatedAt: now,
      templateKey: templateKey,
    );
  }

  Future<void> save(AuraProject project) async {
    await projects.save(project);
    recent = await projects.list();
    notifyListeners();
  }

  Future<void> delete(AuraProject project) async {
    await projects.delete(project);
    recent = await projects.list();
    notifyListeners();
  }
}
