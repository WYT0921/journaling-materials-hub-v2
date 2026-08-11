import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/models/aura_models.dart';
import '../../core/widgets/aura_card_preview.dart';
import 'creation_controller.dart';

class CreateScreen extends StatefulWidget {
  const CreateScreen({super.key, required this.controller});
  final CreationController controller;
  @override
  State<CreateScreen> createState() => _CreateScreenState();
}

class _CreateScreenState extends State<CreateScreen>
    with WidgetsBindingObserver {
  static const labels = ['选择照片', '音乐信息', '选择模板', '编辑设计', '导出分享'];
  File? exported;
  CreationController get c => widget.controller;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    c.recoverLostPhoto();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    c.autosave();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive)
      c.autosave();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: c,
    builder: (_, __) => SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 14, 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'AURA CREATE',
                        style: TextStyle(
                          fontSize: 11,
                          letterSpacing: 3,
                          color: Color(0xff6f8b70),
                        ),
                      ),
                      Text(
                        labels[c.project.step],
                        style: const TextStyle(
                          fontFamily: 'serif',
                          fontSize: 27,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '${c.project.step + 1} / 5',
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
          _Progress(step: c.project.step),
          if (c.message != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(20, 10, 20, 0),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xffffe5e5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                c.message!,
                style: const TextStyle(color: Color(0xff9b3737)),
              ),
            ),
          Expanded(
            child: AbsorbPointer(
              absorbing: c.busy,
              child: IndexedStack(
                index: c.project.step,
                children: [
                  _PhotoStep(c: c),
                  _MusicStep(c: c),
                  _TemplateStep(c: c),
                  _EditorStep(c: c),
                  _ExportStep(
                    c: c,
                    exported: exported,
                    onExported: (file) => setState(() => exported = file),
                  ),
                ],
              ),
            ),
          ),
          _Navigation(c: c),
        ],
      ),
    ),
  );
}

class _Progress extends StatelessWidget {
  const _Progress({required this.step});
  final int step;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 20),
    child: Row(
      children: List.generate(
        5,
        (index) => Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            height: 4,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: BoxDecoration(
              color: index <= step
                  ? const Color(0xff729378)
                  : const Color(0xffe4ded5),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
      ),
    ),
  );
}

class _PhotoStep extends StatelessWidget {
  const _PhotoStep({required this.c});
  final CreationController c;
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      Container(
        height: 350,
        decoration: BoxDecoration(
          color: const Color(0xffe3ecdf),
          borderRadius: BorderRadius.circular(28),
          image: c.project.sourcePhotoPath == null
              ? null
              : DecorationImage(
                  image: FileImage(File(c.project.sourcePhotoPath!)),
                  fit: BoxFit.cover,
                ),
        ),
        child: c.project.sourcePhotoPath == null
            ? const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add_photo_alternate_outlined,
                    size: 56,
                    color: Color(0xff759176),
                  ),
                  SizedBox(height: 14),
                  Text('选择一个想和歌曲一起记住的瞬间'),
                ],
              )
            : null,
      ),
      const SizedBox(height: 18),
      Row(
        children: [
          Expanded(
            child: FilledButton.icon(
              onPressed: () => c.choosePhoto(ImageSource.gallery),
              icon: const Icon(Icons.photo_library_outlined),
              label: const Text('从相册选择'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => c.choosePhoto(ImageSource.camera),
              icon: const Icon(Icons.camera_alt_outlined),
              label: const Text('拍摄'),
              style: OutlinedButton.styleFrom(minimumSize: const Size(40, 50)),
            ),
          ),
        ],
      ),
      if (c.project.sourcePhotoPath != null) ...[
        const SizedBox(height: 24),
        const Text('照片色卡', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        Row(
          children: c.project.palette
              .map(
                (value) => Expanded(
                  child: Container(
                    height: 50,
                    decoration: BoxDecoration(
                      color: Color(value),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    margin: const EdgeInsets.only(right: 7),
                  ),
                ),
              )
              .toList(),
        ),
      ],
      const SizedBox(height: 18),
      const Text(
        '颜色在设备本地提取，照片不会上传。',
        style: TextStyle(fontSize: 12, color: Colors.grey),
        textAlign: TextAlign.center,
      ),
    ],
  );
}

class _MusicStep extends StatefulWidget {
  const _MusicStep({required this.c});
  final CreationController c;
  @override
  State<_MusicStep> createState() => _MusicStepState();
}

class _MusicStepState extends State<_MusicStep> {
  late final fields = [
    TextEditingController(text: widget.c.project.music.songName),
    TextEditingController(text: widget.c.project.music.artist),
    TextEditingController(text: widget.c.project.music.album),
    TextEditingController(text: widget.c.project.music.quote),
    TextEditingController(text: widget.c.project.music.currentTime),
    TextEditingController(text: widget.c.project.music.totalTime),
  ];
  void sync() => widget.c.updateMusic(
    AuraMusicInfo(
      songName: fields[0].text,
      artist: fields[1].text,
      album: fields[2].text,
      quote: fields[3].text,
      currentTime: fields[4].text,
      totalTime: fields[5].text,
      coverPath: widget.c.project.music.coverPath,
    ),
  );
  @override
  void dispose() {
    for (final item in fields) item.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      for (var i = 0; i < 4; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 13),
          child: TextField(
            controller: fields[i],
            onChanged: (_) => sync(),
            maxLength: i == 3 ? 80 : 40,
            decoration: InputDecoration(
              labelText: ['歌曲名 *', '歌手 *', '专辑（可选）', '想写下的话'][i],
              counterText: '',
            ),
          ),
        ),
      Row(
        children: [
          Expanded(
            child: TextField(
              controller: fields[4],
              onChanged: (_) => sync(),
              decoration: const InputDecoration(
                labelText: '当前时间',
                hintText: '1:24',
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: Text('/'),
          ),
          Expanded(
            child: TextField(
              controller: fields[5],
              onChanged: (_) => sync(),
              decoration: const InputDecoration(
                labelText: '总时长',
                hintText: '3:38',
              ),
            ),
          ),
        ],
      ),
      const SizedBox(height: 18),
      OutlinedButton.icon(
        onPressed: widget.c.chooseCover,
        icon: const Icon(Icons.album_outlined),
        label: Text(
          widget.c.project.music.coverPath == null
              ? '选择独立封面（默认使用照片）'
              : '已选择独立封面，点击更换',
        ),
        style: OutlinedButton.styleFrom(minimumSize: const Size(40, 50)),
      ),
      const SizedBox(height: 16),
      const Text(
        '音乐信息仅用于视觉展示，App 不搜索或播放音乐。',
        style: TextStyle(fontSize: 12, color: Colors.grey),
        textAlign: TextAlign.center,
      ),
    ],
  );
}

class _TemplateStep extends StatelessWidget {
  const _TemplateStep({required this.c});
  final CreationController c;
  @override
  Widget build(BuildContext context) => GridView.builder(
    padding: const EdgeInsets.all(20),
    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: 2,
      childAspectRatio: .7,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
    ),
    itemCount: c.app.catalog!.templates.length,
    itemBuilder: (_, index) {
      final template = c.app.catalog!.templates[index];
      final selected = template.key == c.project.templateKey;
      return InkWell(
        onTap: () => c.selectTemplate(template.key),
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected ? const Color(0xff668a6c) : Colors.transparent,
              width: 3,
            ),
          ),
          child: Column(
            children: [
              Expanded(
                child: AuraCardPreview(
                  project: c.project.copyWith(templateKey: template.key),
                  template: template,
                  fontFamily:
                      c.app.fontFamilies[c.project.adjustments.fontStyle],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        template.name,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    if (selected)
                      const Icon(Icons.check_circle, color: Color(0xff668a6c)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

class _EditorStep extends StatelessWidget {
  const _EditorStep({required this.c});
  final CreationController c;

  @override
  Widget build(BuildContext context) {
    final a = c.project.adjustments;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 430, maxWidth: 380),
            child: GestureDetector(
              onPanUpdate: (details) => c.setAdjustments(
                a.copyWith(
                  photoOffsetX: (a.photoOffsetX + details.delta.dx / 150).clamp(
                    -1,
                    1,
                  ),
                  photoOffsetY: (a.photoOffsetY + details.delta.dy / 150).clamp(
                    -1,
                    1,
                  ),
                ),
              ),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x24000000),
                      blurRadius: 24,
                      offset: Offset(0, 10),
                    ),
                  ],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AuraCardPreview(
                    project: c.project,
                    template: c.template,
                    fontFamily:
                        c.app.fontFamilies[c.project.adjustments.fontStyle],
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 22),
        const Text('画面比例', style: TextStyle(fontWeight: FontWeight.w700)),
        Wrap(
          spacing: 8,
          children: AuraRatio.values
              .map(
                (ratio) => ChoiceChip(
                  label: Text(ratio.value),
                  selected: c.project.ratio == ratio,
                  onSelected: (_) => c.setRatio(ratio),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 16),
        const Text('背景', style: TextStyle(fontWeight: FontWeight.w700)),
        Wrap(
          spacing: 8,
          children: {'gradient': '渐变', 'solid': '纯色', 'paper': '纸张'}.entries
              .map(
                (entry) => ChoiceChip(
                  label: Text(entry.value),
                  selected: a.background == entry.key,
                  onSelected: (_) =>
                      c.setAdjustments(a.copyWith(background: entry.key)),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 16),
        const Text('字体', style: TextStyle(fontWeight: FontWeight.w700)),
        Wrap(
          spacing: 8,
          children: {'sans': '简洁', 'serif': '杂志', 'handwriting': '手写'}.entries
              .map(
                (entry) => ChoiceChip(
                  label: Text(entry.value),
                  selected: a.fontStyle == entry.key,
                  onSelected: (_) =>
                      c.setAdjustments(a.copyWith(fontStyle: entry.key)),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 16),
        const Text('主题色', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        Row(
          children: List.generate(
            c.project.palette.length,
            (index) => GestureDetector(
              onTap: () => c.setAdjustments(a.copyWith(paletteIndex: index)),
              child: Container(
                width: 46,
                height: 46,
                margin: const EdgeInsets.only(right: 9),
                decoration: BoxDecoration(
                  color: Color(c.project.palette[index]),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: a.paletteIndex == index
                        ? Colors.black
                        : Colors.white,
                    width: 3,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          '照片缩放 ${a.photoScale.toStringAsFixed(1)}×',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        Slider(
          value: a.photoScale,
          min: 1,
          max: 3,
          divisions: 20,
          onChanged: (value) => c.setAdjustments(a.copyWith(photoScale: value)),
        ),
        Text(
          '装饰数量 ${a.decorationDensity}',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        Slider(
          value: a.decorationDensity.toDouble(),
          min: 0,
          max: 20,
          divisions: 20,
          onChanged: (value) =>
              c.setAdjustments(a.copyWith(decorationDensity: value.round())),
        ),
        const Text(
          '可在预览上拖动照片焦点；播放器位置和图层结构由模板控制。',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }
}

class _ExportStep extends StatelessWidget {
  const _ExportStep({
    required this.c,
    required this.exported,
    required this.onExported,
  });
  final CreationController c;
  final File? exported;
  final ValueChanged<File> onExported;
  @override
  Widget build(BuildContext context) {
    final size = c.project.ratio.exportSize;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 460, maxWidth: 380),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AuraCardPreview(
                project: c.project,
                template: c.template,
                fontFamily: c.app.fontFamilies[c.project.adjustments.fontStyle],
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          '${c.project.ratio.value} · ${size.$1} × ${size.$2} · PNG',
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.grey),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: c.busy
              ? null
              : () async {
                  final file = await c.export();
                  if (file != null) onExported(file);
                },
          icon: const Icon(Icons.auto_awesome),
          label: Text(exported == null ? '生成分享卡片' : '重新生成'),
        ),
        if (exported != null) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await c.exporter.saveToGallery(exported!);
                    if (context.mounted)
                      ScaffoldMessenger.of(
                        context,
                      ).showSnackBar(const SnackBar(content: Text('已保存到相册')));
                  },
                  icon: const Icon(Icons.download_outlined),
                  label: const Text('保存图片'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(40, 50),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => c.exporter.share(exported!),
                  icon: const Icon(Icons.ios_share),
                  label: const Text('分享'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(40, 50),
                  ),
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 14),
        const Text(
          '图片只在本机生成，不会上传到服务器。',
          style: TextStyle(fontSize: 12, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _Navigation extends StatelessWidget {
  const _Navigation({required this.c});
  final CreationController c;
  @override
  Widget build(BuildContext context) {
    final canNext = c.project.step != 0 || c.project.sourcePhotoPath != null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
      child: Row(
        children: [
          if (c.project.step > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () => c.setStep(c.project.step - 1),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(40, 50),
                ),
                child: const Text('上一步'),
              ),
            ),
          if (c.project.step > 0 && c.project.step < 4)
            const SizedBox(width: 10),
          if (c.project.step < 4)
            Expanded(
              flex: 2,
              child: FilledButton(
                onPressed: canNext && !c.busy
                    ? () {
                        if (c.project.step == 1 &&
                            (c.project.music.songName.trim().isEmpty ||
                                c.project.music.artist.trim().isEmpty)) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('请填写歌曲名和歌手')),
                          );
                          return;
                        }
                        c.setStep(c.project.step + 1);
                      }
                    : null,
                child: const Text('下一步'),
              ),
            ),
        ],
      ),
    );
  }
}
