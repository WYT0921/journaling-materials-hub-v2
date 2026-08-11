import 'package:aura/main.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('complete application graph compiles', () {
    expect(const AuraApp(), isA<Widget>());
  });
}
