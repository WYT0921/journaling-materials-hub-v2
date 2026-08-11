import 'dart:convert';

enum AuraRatio { square, landscape, story }

extension AuraRatioValue on AuraRatio {
  String get value => switch (this) {
    AuraRatio.square => '1:1',
    AuraRatio.landscape => '4:3',
    AuraRatio.story => '9:16',
  };
  double get aspectRatio => switch (this) {
    AuraRatio.square => 1,
    AuraRatio.landscape => 4 / 3,
    AuraRatio.story => 9 / 16,
  };
  (int, int) get exportSize => switch (this) {
    AuraRatio.square => (1080, 1080),
    AuraRatio.landscape => (1440, 1080),
    AuraRatio.story => (1080, 1920),
  };
  static AuraRatio parse(String value) => AuraRatio.values.firstWhere(
    (item) => item.value == value,
    orElse: () => AuraRatio.landscape,
  );
}

class AuraMusicInfo {
  const AuraMusicInfo({
    this.songName = '',
    this.artist = '',
    this.album = '',
    this.quote = '',
    this.currentTime = '0:00',
    this.totalTime = '3:30',
    this.coverPath,
  });
  final String songName, artist, album, quote, currentTime, totalTime;
  final String? coverPath;
  Map<String, Object?> toJson() => {
    'songName': songName,
    'artist': artist,
    'album': album,
    'quote': quote,
    'currentTime': currentTime,
    'totalTime': totalTime,
    'coverPath': coverPath,
  };
  factory AuraMusicInfo.fromJson(Map<String, dynamic> json) => AuraMusicInfo(
    songName: json['songName'] ?? '',
    artist: json['artist'] ?? '',
    album: json['album'] ?? '',
    quote: json['quote'] ?? '',
    currentTime: json['currentTime'] ?? '0:00',
    totalTime: json['totalTime'] ?? '3:30',
    coverPath: json['coverPath'],
  );
}

class AuraAdjustments {
  const AuraAdjustments({
    this.background = 'gradient',
    this.photoScale = 1,
    this.photoOffsetX = 0,
    this.photoOffsetY = 0,
    this.decorationDensity = 5,
    this.paletteIndex = 0,
    this.fontStyle = 'sans',
  });
  final String background, fontStyle;
  final double photoScale, photoOffsetX, photoOffsetY;
  final int decorationDensity, paletteIndex;
  AuraAdjustments copyWith({
    String? background,
    String? fontStyle,
    double? photoScale,
    double? photoOffsetX,
    double? photoOffsetY,
    int? decorationDensity,
    int? paletteIndex,
  }) => AuraAdjustments(
    background: background ?? this.background,
    fontStyle: fontStyle ?? this.fontStyle,
    photoScale: photoScale ?? this.photoScale,
    photoOffsetX: photoOffsetX ?? this.photoOffsetX,
    photoOffsetY: photoOffsetY ?? this.photoOffsetY,
    decorationDensity: decorationDensity ?? this.decorationDensity,
    paletteIndex: paletteIndex ?? this.paletteIndex,
  );
  Map<String, Object> toJson() => {
    'background': background,
    'fontStyle': fontStyle,
    'photoScale': photoScale,
    'photoOffsetX': photoOffsetX,
    'photoOffsetY': photoOffsetY,
    'decorationDensity': decorationDensity,
    'paletteIndex': paletteIndex,
  };
  factory AuraAdjustments.fromJson(Map<String, dynamic> json) =>
      AuraAdjustments(
        background: json['background'] ?? 'gradient',
        fontStyle: json['fontStyle'] ?? 'sans',
        photoScale: (json['photoScale'] ?? 1).toDouble(),
        photoOffsetX: (json['photoOffsetX'] ?? 0).toDouble(),
        photoOffsetY: (json['photoOffsetY'] ?? 0).toDouble(),
        decorationDensity: json['decorationDensity'] ?? 5,
        paletteIndex: json['paletteIndex'] ?? 0,
      );
}

class AuraProject {
  const AuraProject({
    required this.id,
    required this.title,
    required this.updatedAt,
    this.schemaVersion = 1,
    this.ratio = AuraRatio.landscape,
    this.sourcePhotoPath,
    this.music = const AuraMusicInfo(),
    this.palette = const [
      0xffdce8d7,
      0xffa9c7a1,
      0xffe8e2d6,
      0xff7b6b4f,
      0xff3d2e1e,
    ],
    this.templateKey = 'fresh-rounded',
    this.adjustments = const AuraAdjustments(),
    this.previewPath,
    this.step = 0,
  });
  final int schemaVersion, step;
  final String id, title, templateKey;
  final DateTime updatedAt;
  final AuraRatio ratio;
  final String? sourcePhotoPath, previewPath;
  final AuraMusicInfo music;
  final List<int> palette;
  final AuraAdjustments adjustments;
  AuraProject copyWith({
    String? title,
    DateTime? updatedAt,
    AuraRatio? ratio,
    String? sourcePhotoPath,
    AuraMusicInfo? music,
    List<int>? palette,
    String? templateKey,
    AuraAdjustments? adjustments,
    String? previewPath,
    int? step,
  }) => AuraProject(
    id: id,
    title: title ?? this.title,
    updatedAt: updatedAt ?? this.updatedAt,
    schemaVersion: schemaVersion,
    ratio: ratio ?? this.ratio,
    sourcePhotoPath: sourcePhotoPath ?? this.sourcePhotoPath,
    music: music ?? this.music,
    palette: palette ?? this.palette,
    templateKey: templateKey ?? this.templateKey,
    adjustments: adjustments ?? this.adjustments,
    previewPath: previewPath ?? this.previewPath,
    step: step ?? this.step,
  );
  Map<String, Object?> toJson() => {
    'schemaVersion': schemaVersion,
    'id': id,
    'title': title,
    'updatedAt': updatedAt.toIso8601String(),
    'ratio': ratio.value,
    'sourcePhotoPath': sourcePhotoPath,
    'music': music.toJson(),
    'palette': palette,
    'templateKey': templateKey,
    'adjustments': adjustments.toJson(),
    'previewPath': previewPath,
    'step': step,
  };
  factory AuraProject.fromJson(Map<String, dynamic> json) => AuraProject(
    id: json['id'],
    title: json['title'] ?? '未命名卡片',
    updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    schemaVersion: json['schemaVersion'] ?? 1,
    ratio: AuraRatioValue.parse(json['ratio'] ?? '4:3'),
    sourcePhotoPath: json['sourcePhotoPath'],
    music: AuraMusicInfo.fromJson(
      Map<String, dynamic>.from(json['music'] ?? {}),
    ),
    palette:
        (json['palette'] as List? ??
                const [
                  0xffdce8d7,
                  0xffa9c7a1,
                  0xffe8e2d6,
                  0xff7b6b4f,
                  0xff3d2e1e,
                ])
            .map((item) => item as int)
            .toList(),
    templateKey: json['templateKey'] ?? 'fresh-rounded',
    adjustments: AuraAdjustments.fromJson(
      Map<String, dynamic>.from(json['adjustments'] ?? {}),
    ),
    previewPath: json['previewPath'],
    step: json['step'] ?? 0,
  );
  String encode() => jsonEncode(toJson());
}

class AuraTemplate {
  const AuraTemplate({
    required this.key,
    required this.name,
    required this.style,
    required this.supportedRatios,
    required this.config,
    this.previewUrl,
    this.configVersion = 1,
  });
  final String key, name, style;
  final String? previewUrl;
  final List<String> supportedRatios;
  final int configVersion;
  final Map<String, dynamic> config;
  factory AuraTemplate.fromJson(Map<String, dynamic> json) => AuraTemplate(
    key: json['key'],
    name: json['name'],
    style: json['style'],
    previewUrl: json['previewUrl'],
    supportedRatios: List<String>.from(json['supportedRatios'] ?? const []),
    configVersion: json['configVersion'] ?? 1,
    config: Map<String, dynamic>.from(json['config'] ?? {}),
  );
}

class AuraAsset {
  const AuraAsset({
    required this.key,
    required this.name,
    required this.type,
    required this.fileUrl,
    required this.sha256,
    required this.resourceVersion,
    required this.metadata,
    this.previewUrl,
  });
  final String key, name, type, fileUrl, sha256;
  final String? previewUrl;
  final int resourceVersion;
  final Map<String, dynamic> metadata;
  factory AuraAsset.fromJson(Map<String, dynamic> json) => AuraAsset(
    key: json['key'],
    name: json['name'],
    type: json['type'],
    fileUrl: json['fileUrl'],
    previewUrl: json['previewUrl'],
    sha256: json['sha256'],
    resourceVersion: json['resourceVersion'] ?? 1,
    metadata: Map<String, dynamic>.from(json['metadata'] ?? {}),
  );
}

class AuraCatalog {
  const AuraCatalog({
    required this.schemaVersion,
    required this.catalogVersion,
    required this.templates,
    required this.assets,
  });
  final int schemaVersion;
  final String catalogVersion;
  final List<AuraTemplate> templates;
  final List<AuraAsset> assets;
  factory AuraCatalog.fromJson(Map<String, dynamic> json) {
    if (json['schemaVersion'] != 1) throw const FormatException('不支持的目录版本');
    return AuraCatalog(
      schemaVersion: 1,
      catalogVersion: json['catalogVersion'] ?? 'unknown',
      templates: (json['templates'] as List? ?? const [])
          .map((item) => AuraTemplate.fromJson(Map<String, dynamic>.from(item)))
          .toList(),
      assets: (json['assets'] as List? ?? const [])
          .map((item) => AuraAsset.fromJson(Map<String, dynamic>.from(item)))
          .toList(),
    );
  }
  AuraTemplate template(String key) => templates.firstWhere(
    (item) => item.key == key,
    orElse: () => templates.first,
  );
}
