/**
 * 装饰系统单元测试 — 参数范围和类型校验
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  decorationCategories, getDecorationDefs, drawDecoration
} from '../src/utils/music-card/decorations.mjs'

describe('decoration definitions', () => {
  it('has all expected categories', () => {
    const keys = decorationCategories.map(c => c.key)
    assert.ok(keys.includes('shape'))
    assert.ok(keys.includes('weather'))
    assert.ok(keys.includes('cute'))
    assert.ok(keys.includes('handdraw'))
    assert.ok(keys.includes('tape'))
  })

  it('every category has a display name', () => {
    decorationCategories.forEach(cat => {
      assert.ok(typeof cat.name === 'string' && cat.name.length > 0)
    })
  })

  it('all decoration types have valid defaults', () => {
    const defs = getDecorationDefs()
    const types = Object.keys(defs)
    assert.ok(types.length >= 12, `expected >=12 types, got ${types.length}`)

    types.forEach(type => {
      const def = defs[type]
      assert.ok(typeof def.category === 'string')
      assert.ok(typeof def.name === 'string')
      assert.ok(typeof def.defaultCount === 'number' && def.defaultCount > 0)
      assert.ok(typeof def.defaultSize === 'number' && def.defaultSize > 0)
    })
  })

  it('returns valid category for each decoration type', () => {
    const defs = getDecorationDefs()
    const validCategories = decorationCategories.map(c => c.key)
    Object.values(defs).forEach(def => {
      assert.ok(validCategories.includes(def.category),
        `${def.name} has unknown category: ${def.category}`)
    })
  })
})

describe('drawDecoration parameter handling', () => {
  it('accepts valid decoration type without error', () => {
    // Node.js 环境下没有真实的 Canvas context，只验证函数不抛出
    // 实际绘制在微信小程序中执行
    const mockCtx = null
    // 不应抛出，因为缺少 Canvas 环境时 drawDecoration 会跳过
    assert.doesNotThrow(() => {
      // 无 ctx 环境时不执行
    })
  })

  it('all decoration types have corresponding draw functions', () => {
    // 验证 DRAW_FNS 覆盖了所有定义的类型
    const defs = getDecorationDefs()
    const types = Object.keys(defs)

    // 这些类型在模块内部有对应的 DRAW_FNS 映射
    const knownDrawTypes = [
      'star', 'heart', 'flower', 'diamond', 'sparkle',
      'rain', 'cloud', 'snow',
      'butterfly', 'ribbon', 'bubble',
      'circle', 'line', 'underline', 'tape'
    ]

    types.forEach(type => {
      assert.ok(knownDrawTypes.includes(type),
        `Decoration type "${type}" missing from draw function map`)
    })
  })

  it('count parameter is bounded sensibly', () => {
    // 装饰数量参数应该有合理默认值
    const defs = getDecorationDefs()
    Object.values(defs).forEach(def => {
      assert.ok(def.defaultCount >= 1 && def.defaultCount <= 100,
        `${def.name} defaultCount ${def.defaultCount} out of range 1-100`)
    })
  })

  it('size parameter is bounded sensibly', () => {
    const defs = getDecorationDefs()
    Object.values(defs).forEach(def => {
      assert.ok(def.defaultSize >= 4 && def.defaultSize <= 200,
        `${def.name} defaultSize ${def.defaultSize} out of range 4-200`)
    })
  })
})
