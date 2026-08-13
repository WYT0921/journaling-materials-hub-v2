import 'package:flutter/material.dart';

import '../../app/app_controller.dart';
import '../../core/models/aura_models.dart';
import '../../core/widgets/aura_card_preview.dart';

class TemplatesScreen extends StatefulWidget {
  const TemplatesScreen({super.key, required this.app, required this.onUse});
  final AppController app;
  final ValueChanged<String> onUse;
  @override
  State<TemplatesScreen> createState() => _TemplatesScreenState();
}

class _TemplatesScreenState extends State<TemplatesScreen> {
  String style = 'all';
  @override
  Widget build(BuildContext context) {
    final templates = widget.app.catalog!.templates
        .where((item) => style == 'all' || item.style == style)
        .toList();
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(24, 28, 24, 8),
            child: Text(
              '模板灵感',
              style: TextStyle(
                fontFamily: 'serif',
                fontSize: 34,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 18),
              scrollDirection: Axis.horizontal,
              children:
                  {
                        'all': '全部',
                        'fresh': '清新',
                        'cute': '可爱',
                        'vintage': '复古',
                        'vinyl': '黑胶',
                        'waveform': '波形',
                      }.entries
                      .map(
                        (entry) => Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: ChoiceChip(
                            label: Text(entry.value),
                            selected: style == entry.key,
                            onSelected: (_) =>
                                setState(() => style = entry.key),
                          ),
                        ),
                      )
                      .toList(),
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: .7,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
              ),
              itemCount: templates.length,
              itemBuilder: (_, index) {
                final template = templates[index];
                final sample = AuraProject(
                  id: template.key,
                  title: template.name,
                  updatedAt: DateTime.now(),
                  templateKey: template.key,
                  music: const AuraMusicInfo(
                    songName: 'Lucky Day',
                    artist: 'AURA',
                    quote: 'take your time',
                  ),
                );
                return Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => widget.onUse(template.key),
                    child: Column(
                      children: [
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: AuraCardPreview(
                              project: sample,
                              template: template,
                              fontFamily: widget
                                  .app
                                  .fontFamilies[sample.adjustments.fontStyle],
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  template.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const Icon(Icons.arrow_forward, size: 18),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
