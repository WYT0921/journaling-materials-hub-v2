import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app/app_controller.dart';
import 'app/aura_theme.dart';
import 'features/shell/main_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const AuraApp());
}

class AuraApp extends StatefulWidget {
  const AuraApp({super.key});
  @override
  State<AuraApp> createState() => _AuraAppState();
}

class _AuraAppState extends State<AuraApp> {
  final controller = AppController();
  @override
  void initState() {
    super.initState();
    controller.initialize();
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'AURA Music',
    theme: AuraTheme.light,
    home: AnimatedBuilder(
      animation: controller,
      builder: (_, __) =>
          controller.loading ? const _Splash() : MainShell(app: controller),
    ),
  );
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'AURA',
            style: TextStyle(
              fontFamily: 'serif',
              fontSize: 42,
              letterSpacing: 8,
            ),
          ),
          SizedBox(height: 18),
          CircularProgressIndicator(strokeWidth: 2),
        ],
      ),
    ),
  );
}
