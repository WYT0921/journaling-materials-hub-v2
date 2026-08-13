import 'package:flutter/material.dart';

import '../../app/app_controller.dart';
import '../../core/models/aura_models.dart';
import '../../core/widgets/aura_card_preview.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.app,
    required this.onCreate,
    required this.onContinue,
  });
  final AppController app;
  final VoidCallback onCreate;
  final ValueChanged<AuraProject> onContinue;

  @override
  Widget build(BuildContext context) => SafeArea(
    child: CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 0),
          sliver: SliverList.list(
            children: [
              const Text(
                'AURA MUSIC',
                style: TextStyle(
                  fontFamily: 'serif',
                  fontSize: 14,
                  letterSpacing: 4,
                  color: Color(0xff718771),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                '把一首歌，\n变成视觉记忆。',
                style: TextStyle(
                  fontFamily: 'serif',
                  fontSize: 38,
                  height: 1.15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 22),
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xffdce9d7),
                      Color(0xffffe8ed),
                      Color(0xfffff5dc),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.auto_awesome, color: Color(0xff64826a)),
                    const SizedBox(height: 24),
                    const Text(
                      '上传照片 · 填写音乐 · 选择模板',
                      style: TextStyle(fontSize: 15),
                    ),
                    const SizedBox(height: 14),
                    FilledButton.icon(
                      onPressed: onCreate,
                      icon: const Icon(Icons.add),
                      label: const Text('新建音乐卡片'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '最近作品',
                    style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700),
                  ),
                  Text(
                    '${app.recent.length} 个草稿',
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
        if (app.recent.isEmpty)
          const SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: 80),
                child: Text(
                  '还没有草稿，开始记录第一首歌吧',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
          ),
        if (app.recent.isNotEmpty)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
            sliver: SliverGrid.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: .72,
              ),
              itemCount: app.recent.length,
              itemBuilder: (_, index) => _ProjectCard(
                project: app.recent[index],
                app: app,
                onTap: () => onContinue(app.recent[index]),
              ),
            ),
          ),
      ],
    ),
  );
}

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({
    required this.project,
    required this.app,
    required this.onTap,
  });
  final AuraProject project;
  final AppController app;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white.withValues(alpha: .76),
    borderRadius: BorderRadius.circular(20),
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: AuraCardPreview(
                    project: project,
                    template: app.catalog!.template(project.templateKey),
                    fontFamily: app.fontFamilies[project.adjustments.fontStyle],
                  ),
                ),
                Positioned(
                  right: 4,
                  top: 4,
                  child: IconButton.filledTonal(
                    icon: const Icon(Icons.delete_outline, size: 18),
                    onPressed: () async {
                      if (await showDialog<bool>(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: const Text('删除草稿？'),
                              content: const Text('照片与导出文件也会从本机移除。'),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.pop(context, false),
                                  child: const Text('取消'),
                                ),
                                FilledButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  child: const Text('删除'),
                                ),
                              ],
                            ),
                          ) ==
                          true)
                        app.delete(project);
                    },
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  project.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  project.updatedAt.toLocal().toString().substring(0, 16),
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
