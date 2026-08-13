import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../models/aura_models.dart';

class CatalogRepository {
  CatalogRepository({http.Client? client, String? baseUrl})
    : _client = client ?? http.Client(),
      _baseUrl =
          baseUrl ??
          const String.fromEnvironment(
            'AURA_API_BASE_URL',
            defaultValue: 'http://10.0.2.2:8080',
          );
  final http.Client _client;
  final String _baseUrl;

  Future<AuraCatalog> load() async {
    final support = await getApplicationSupportDirectory();
    final cache = File(p.join(support.path, 'aura_catalog.json'));
    final etagFile = File(p.join(support.path, 'aura_catalog.etag'));
    final bundled = await _bundled();
    try {
      final headers = <String, String>{};
      if (await etagFile.exists())
        headers['If-None-Match'] = await etagFile.readAsString();
      final response = await _client
          .get(Uri.parse('$_baseUrl/api/v2/aura/catalog'), headers: headers)
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 304 && await cache.exists())
        return AuraCatalog.fromJson(jsonDecode(await cache.readAsString()));
      if (response.statusCode != 200)
        throw HttpException('目录请求失败 ${response.statusCode}');
      final envelope =
          jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      final data = Map<String, dynamic>.from(envelope['data']);
      final parsed = AuraCatalog.fromJson(data);
      await cache.writeAsString(jsonEncode(data), flush: true);
      final etag = response.headers['etag'];
      if (etag != null) await etagFile.writeAsString(etag, flush: true);
      return parsed.templates.isEmpty ? bundled : parsed;
    } catch (_) {
      if (await cache.exists()) {
        try {
          return AuraCatalog.fromJson(jsonDecode(await cache.readAsString()));
        } catch (_) {}
      }
      return bundled;
    }
  }

  Future<File> ensureAsset(AuraAsset asset) async {
    final support = await getApplicationSupportDirectory();
    final directory = Directory(p.join(support.path, 'aura-assets'))
      ..createSync(recursive: true);
    final extension = p.extension(Uri.parse(asset.fileUrl).path);
    final target = File(
      p.join(directory.path, '${asset.key}-${asset.resourceVersion}$extension'),
    );
    if (await target.exists() &&
        sha256.convert(await target.readAsBytes()).toString() == asset.sha256)
      return target;
    final response = await _client
        .get(Uri.parse(asset.fileUrl))
        .timeout(const Duration(seconds: 20));
    if (response.statusCode != 200 ||
        sha256.convert(response.bodyBytes).toString() != asset.sha256)
      throw const FormatException('资源校验失败');
    await target.writeAsBytes(response.bodyBytes, flush: true);
    return target;
  }

  Future<Map<String, String>> loadFonts(AuraCatalog catalog) async {
    final loaded = <String, String>{};
    for (final asset in catalog.assets.where((item) => item.type == 'font')) {
      final family = asset.metadata['family']?.toString();
      final styleKey = asset.metadata['styleKey']?.toString();
      if (family == null ||
          family.isEmpty ||
          styleKey == null ||
          styleKey.isEmpty)
        continue;
      try {
        final file = await ensureAsset(asset);
        final loader = FontLoader(family)
          ..addFont(file.readAsBytes().then(ByteData.sublistView));
        await loader.load();
        loaded[styleKey] = family;
      } catch (_) {
        // A remote font must never block bundled templates or export.
      }
    }
    return loaded;
  }

  Future<AuraCatalog> _bundled() async => AuraCatalog.fromJson(
    jsonDecode(
      await rootBundle.loadString('assets/catalog/starter_catalog.json'),
    ),
  );
}
