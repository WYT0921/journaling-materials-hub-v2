import 'package:flutter/material.dart';

import '../../app/app_controller.dart';
import '../create/create_screen.dart';
import '../create/creation_controller.dart';
import '../home/home_screen.dart';
import '../templates/templates_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.app});
  final AppController app;
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int index = 0;
  CreationController? creation;

  void start({String? templateKey, dynamic project}) {
    creation = CreationController(
      widget.app,
      project ?? widget.app.create(templateKey: templateKey ?? 'fresh-rounded'),
    );
    setState(() => index = 1);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.app.catalog == null || widget.app.catalog!.templates.isEmpty)
      return const Scaffold(body: Center(child: Text('模板目录不可用')));
    final pages = [
      HomeScreen(
        app: widget.app,
        onCreate: () => start(),
        onContinue: (project) => start(project: project),
      ),
      creation == null
          ? _CreateEmpty(onCreate: () => start())
          : CreateScreen(controller: creation!),
      TemplatesScreen(
        app: widget.app,
        onUse: (key) => start(templateKey: key),
      ),
    ];
    return Scaffold(
      body: IndexedStack(index: index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: '首页',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline),
            selectedIcon: Icon(Icons.add_circle),
            label: '创作',
          ),
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded),
            label: '模板',
          ),
        ],
      ),
    );
  }
}

class _CreateEmpty extends StatelessWidget {
  const _CreateEmpty({required this.onCreate});
  final VoidCallback onCreate;
  @override
  Widget build(BuildContext context) => SafeArea(
    child: Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.auto_awesome, size: 54, color: Color(0xff799c79)),
            const SizedBox(height: 18),
            const Text(
              '把喜欢的歌，变成分享卡片',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onCreate,
              icon: const Icon(Icons.add_photo_alternate_outlined),
              label: const Text('开始创作'),
            ),
          ],
        ),
      ),
    ),
  );
}
