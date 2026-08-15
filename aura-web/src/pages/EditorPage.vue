<template>
  <section v-if="store.active && store.activeTemplate" class="walk-editor">
    <header class="editor-topbar">
      <button class="plain-icon" aria-label="返回" @click="leave">‹</button>
      <button class="soft-pill" @click="createNew">＋ 新建</button>
      <div class="draft-state"><i></i>{{ saving ? '保存中' : '已保存本地' }}</div>
      <button class="plain-icon" :disabled="!canUndo" aria-label="撤销" @click="undo">↶</button>
      <button class="plain-icon" :disabled="!canRedo" aria-label="重做" @click="redo">↷</button>
      <button class="export-pill" :disabled="exporting" @click="showExport = true">{{ exporting ? '生成中' : '导出' }}</button>
    </header>

    <div class="editor-stage-area">
      <div class="canvas-rail left"><button :disabled="!canUndo" @click="undo">↶</button><button :disabled="!canRedo" @click="redo">↷</button></div>
      <AuraCanvas :project="store.active" :template="store.activeTemplate" :photo-url="store.activePhotoUrl" :playing="playing" />
      <div class="canvas-rail right">
        <label class="rail-label">↻<span>换图</span><input type="file" accept="image/jpeg,image/png,image/webp" @change="pickPhoto" /></label>
        <button :class="{ active: playing }" @click="playing = !playing">{{ playing ? '■' : '▶' }}</button>
      </div>
    </div>

    <nav class="tool-tabs">
      <button v-for="tool in tools" :key="tool.id" :class="{ active: activeTool === tool.id }" @click="activeTool = tool.id"><span>{{ tool.icon }}</span>{{ tool.label }}</button>
    </nav>

    <div class="tool-panel">
      <template v-if="activeTool === 'recipe'">
        <h3>配方</h3><div class="option-grid recipes"><button v-for="template in store.catalog?.templates" :key="template.key" :class="{ selected: store.active.templateKey === template.key }" @click="changeTemplate(template.key)"><i>{{ recipeIcon(template.key) }}</i><b>{{ template.name }}</b><small>{{ recipeLabel(template.key) }}</small></button></div>
      </template>
      <template v-if="activeTool === 'layout'">
        <h3>排版</h3><div class="segmented"><button v-for="ratio in ratios" :key="ratio" :class="{ active: store.active.ratio === ratio }" @click="mutate(() => store.active!.ratio = ratio)">{{ ratio }}</button></div>
        <RangeControl label="上部比例" :value="store.active.adjustments.photoSplit" :min=".34" :max=".66" :step=".01" @change="value => mutate(() => store.active!.adjustments.photoSplit = value)" />
        <RangeControl label="照片缩放" :value="store.active.adjustments.photoScale" :min="1" :max="2.4" :step=".05" @change="value => mutate(() => store.active!.adjustments.photoScale = value)" />
        <RangeControl label="横向焦点" :value="store.active.adjustments.photoOffsetX" :min="-1" :max="1" :step=".05" @change="value => mutate(() => store.active!.adjustments.photoOffsetX = value)" />
        <RangeControl label="纵向焦点" :value="store.active.adjustments.photoOffsetY" :min="-1" :max="1" :step=".05" @change="value => mutate(() => store.active!.adjustments.photoOffsetY = value)" />
      </template>
      <template v-if="activeTool === 'color'">
        <h3>色块</h3><div class="choice-row"><button v-for="item in backgrounds" :key="item.id" :class="{ selected: store.active.adjustments.background === item.id }" @click="mutate(() => store.active!.adjustments.background = item.id)">{{ item.label }}</button></div>
        <div class="palette-row editor-palette"><button v-for="(color, index) in store.active.palette" :key="color" :class="{ selected: store.active.adjustments.paletteIndex === index }" :style="{ background: color }" @click="mutate(() => store.active!.adjustments.paletteIndex = index)"></button></div>
        <template v-if="store.active.adjustments.background === 'stripes'"><RangeControl label="条纹角度" :value="store.active.adjustments.stripeAngle" :min="0" :max="180" :step="5" @change="value => mutate(() => store.active!.adjustments.stripeAngle = value)" /><RangeControl label="条纹密度" :value="store.active.adjustments.stripeDensity" :min="4" :max="24" :step="1" @change="value => mutate(() => store.active!.adjustments.stripeDensity = value)" /></template>
      </template>
      <template v-if="activeTool === 'player'">
        <h3>播放器与音符</h3><div class="option-grid compact"><button v-for="item in players" :key="item.id" :class="{ selected: store.active.adjustments.playerStyle === item.id }" @click="mutate(() => store.active!.adjustments.playerStyle = item.id)"><i>{{ item.icon }}</i>{{ item.label }}</button></div>
        <RangeControl label="播放器尺寸" :value="store.active.adjustments.playerScale" :min=".72" :max="1.25" :step=".01" @change="value => mutate(() => store.active!.adjustments.playerScale = value)" /><RangeControl label="播放进度" :value="store.active.adjustments.progress" :min="0" :max="1" :step=".01" @change="value => mutate(() => store.active!.adjustments.progress = value)" /><RangeControl label="音符密度" :value="store.active.adjustments.decorationDensity" :min="3" :max="24" :step="1" @change="value => mutate(() => store.active!.adjustments.decorationDensity = value)" />
        <div class="choice-row"><button v-for="path in notePaths" :key="path.id" :class="{ selected: store.active.adjustments.notePath === path.id }" @click="mutate(() => store.active!.adjustments.notePath = path.id)">{{ path.label }}</button></div>
      </template>
      <template v-if="activeTool === 'text'">
        <h3>文字</h3><label class="switch-row">显示文案<input type="checkbox" :checked="store.active.adjustments.quoteVisible" @change="mutate(() => store.active!.adjustments.quoteVisible = !store.active!.adjustments.quoteVisible)" /></label>
        <textarea v-model="store.active.music.quote" maxlength="120" @change="recordDirect">文案</textarea>
        <div class="choice-row"><button v-for="font in fonts" :key="font.id" :class="{ selected: store.active.adjustments.textFont === font.id }" @click="mutate(() => store.active!.adjustments.textFont = font.id)">{{ font.label }}</button></div>
        <div class="choice-row"><button v-for="align in aligns" :key="align.id" :class="{ selected: store.active.adjustments.textAlign === align.id }" @click="mutate(() => store.active!.adjustments.textAlign = align.id)">{{ align.label }}</button></div>
      </template>
      <template v-if="activeTool === 'motion'">
        <h3>动态预览</h3><p class="panel-note">动画只用于预览，PNG 会导出稳定静态画面。</p><div class="option-grid motion-grid"><button v-for="motion in motions" :key="motion.id" :class="{ selected: store.active.adjustments.motion === motion.id }" @click="mutate(() => store.active!.adjustments.motion = motion.id); playing = true"><i>{{ motion.icon }}</i>{{ motion.label }}</button></div>
      </template>
    </div>
    <div v-if="showExport" class="export-overlay" @click.self="!exporting && (showExport = false)">
      <section class="export-sheet">
        <div class="export-sheet-head"><div><p class="eyebrow">EXPORT</p><h3>导出音乐卡片</h3></div><button v-if="!exporting" aria-label="关闭" @click="showExport = false">×</button></div>
        <div v-if="!exporting" class="export-formats">
          <button @click="exportPng"><i>▣</i><b>高清 PNG</b><small>原尺寸 · 静态 · 无水印</small></button>
          <button class="video-format" @click="exportMp4"><i>▶</i><b>动态 MP4</b><small>6 秒 · 30 FPS · 完整尺寸 · 无音频</small></button>
        </div>
        <div v-else class="export-progress">
          <div class="video-spinner">♫</div><b>{{ exportKind === 'mp4' ? '正在本地编码 MP4' : '正在生成 PNG' }}</b>
          <p>{{ exportKind === 'mp4' ? '请保持页面在前台，照片不会上传。' : '正在绘制高清图片…' }}</p>
          <div class="progress-track"><i :style="{ width: `${Math.round(exportProgress * 100)}%` }"></i></div><strong>{{ Math.round(exportProgress * 100) }}%</strong>
          <button v-if="exportKind === 'mp4'" class="cancel-export" @click="cancelExport">取消导出</button>
        </div>
      </section>
    </div>
    <p v-if="message" class="editor-message">{{ message }}</p>
  </section>
  <section v-else class="page loading-page"><div class="loader"></div><p>正在恢复草稿…</p></section>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuraCanvas from '../components/AuraCanvas.vue'
import { EditHistory } from '../editor/history'
import { exportAuraPng } from '../editor/konvaRenderer'
import { extractPalette } from '../services/paletteService'
import { shareOrDownload, shareOrDownloadMedia } from '../services/shareService'
import { exportAuraMp4 } from '../services/videoExportService'
import { useAuraStore } from '../stores/aura'
import type { AuraBackground, AuraMotion, AuraNotePath, AuraPlayerStyle, AuraProject, AuraRatio, AuraTextAlign, AuraTextFont } from '../types/aura'

const RangeControl = defineComponent({ props: { label: String, value: Number, min: Number, max: Number, step: Number }, emits: ['change'], setup(props, { emit }) { return () => h('label', { class: 'range-control' }, [h('span', props.label), h('input', { type: 'range', value: props.value, min: props.min, max: props.max, step: props.step, onChange: (event: Event) => emit('change', Number((event.target as HTMLInputElement).value)) }), h('b', String(Math.round((props.value || 0) * 100) / 100))]) } })
const store = useAuraStore(), route = useRoute(), router = useRouter()
const activeTool = ref('recipe'), playing = ref(false), saving = ref(false), exporting = ref(false), message = ref(''), showExport = ref(false), exportProgress = ref(0), exportKind = ref<'png' | 'mp4'>('png')
const history = ref<EditHistory<AuraProject>>(), canUndo = ref(false), canRedo = ref(false)
let saveTimer = 0
let exportController: AbortController | undefined
const tools = [{ id: 'recipe', icon: '✦', label: '配方' }, { id: 'layout', icon: '▦', label: '排版' }, { id: 'color', icon: '◕', label: '色块' }, { id: 'player', icon: '♫', label: '播放器' }, { id: 'text', icon: '✎', label: '文字' }, { id: 'motion', icon: '◉', label: '动态' }]
const ratios: AuraRatio[] = ['1:1', '3:4', '9:16']
const backgrounds: { id: AuraBackground; label: string }[] = [{ id: 'solid', label: '纯色' }, { id: 'stripes', label: '条纹' }, { id: 'gradient', label: '柔光' }, { id: 'paper', label: '纸张' }]
const players: { id: AuraPlayerStyle; label: string; icon: string }[] = [{ id: 'capsule', label: '悬浮线', icon: '≡' }, { id: 'vinyl', label: '唱片线', icon: '◎' }, { id: 'console', label: '波形框', icon: '▭' }, { id: 'bubble', label: '封面线', icon: '□' }, { id: 'waveform', label: '耳机线', icon: '⌒' }, { id: 'heartbeat', label: '心跳线', icon: '♡' }]
const notePaths: { id: AuraNotePath; label: string }[] = [{ id: 'vertical', label: '垂落' }, { id: 'arc', label: '弧线' }, { id: 'sparse', label: '稀疏' }, { id: 'spiral', label: '螺旋' }, { id: 'scatter', label: '散点' }]
const fonts: { id: AuraTextFont; label: string }[] = [{ id: 'serif', label: '宋体' }, { id: 'sans', label: '黑体' }, { id: 'rounded', label: '圆体' }], aligns: { id: AuraTextAlign; label: string }[] = [{ id: 'left', label: '左' }, { id: 'center', label: '中' }, { id: 'right', label: '右' }]
const motions: { id: AuraMotion; label: string; icon: string }[] = [{ id: 'fall', label: '音符飘落', icon: '↓' }, { id: 'breathe', label: '呼吸', icon: '≋' }, { id: 'together', label: '同时出现', icon: '✦' }, { id: 'sequence', label: '顺序出现', icon: '☷' }, { id: 'rotate', label: '旋转', icon: '↻' }]

onMounted(async () => { if (!await store.openById(String(route.params.projectId))) { router.replace('/'); return }; history.value = new EditHistory(snapshot()); syncHistory(); document.addEventListener('visibilitychange', saveOnHide) })
onUnmounted(() => { window.clearTimeout(saveTimer); document.removeEventListener('visibilitychange', saveOnHide); store.save() })
watch(() => store.active, scheduleSave, { deep: true })
function snapshot() { return JSON.parse(JSON.stringify(store.active)) as AuraProject }
function mutate(action: () => void) { action(); history.value?.push(snapshot()); syncHistory() }
function recordDirect() { history.value?.push(snapshot()); syncHistory() }
function changeTemplate(key: string) { store.applyTemplate(key); history.value?.push(snapshot()); syncHistory() }
function undo() { const value = history.value?.undo(); if (value) store.active = value; syncHistory() }
function redo() { const value = history.value?.redo(); if (value) store.active = value; syncHistory() }
function syncHistory() { canUndo.value = !!history.value?.canUndo; canRedo.value = !!history.value?.canRedo }
function scheduleSave() { window.clearTimeout(saveTimer); saving.value = true; saveTimer = window.setTimeout(async () => { await store.save(); saving.value = false }, 550) }
async function pickPhoto(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file || !file.type.startsWith('image/')) return; await store.setPhoto(file, await extractPalette(file)); history.value?.push(snapshot()); syncHistory() }
async function exportPng() { if (!store.active || !store.activeTemplate) return; exporting.value = true; exportKind.value = 'png'; exportProgress.value = .18; playing.value = false; try { const blob = await exportAuraPng(store.active, store.activeTemplate, store.activePhotoUrl); exportProgress.value = 1; const result = await shareOrDownload(blob, store.active.title); message.value = result === 'shared' ? '已打开系统分享面板' : 'PNG 已保存到下载目录'; showExport.value = false } catch (error) { message.value = error instanceof Error ? error.message : '导出失败' } finally { exporting.value = false } }
async function exportMp4() { if (!store.active || !store.activeTemplate) return; exporting.value = true; exportKind.value = 'mp4'; exportProgress.value = 0; playing.value = false; exportController = new AbortController(); try { const blob = await exportAuraMp4(store.active, store.activeTemplate, store.activePhotoUrl, { signal: exportController.signal, onProgress: value => exportProgress.value = value }); const result = await shareOrDownloadMedia(blob, store.active.title, 'mp4', 'video/mp4'); message.value = result === 'shared' ? '已打开 MP4 分享面板' : 'MP4 已保存到下载目录'; showExport.value = false } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) message.value = error instanceof Error ? error.message : 'MP4 导出失败' } finally { exporting.value = false; exportController = undefined } }
function cancelExport() { exportController?.abort() }
async function leave() { await store.save(); router.push('/') }
async function createNew() { await store.save(); await store.create(); router.push('/create') }
function saveOnHide() { if (document.visibilityState === 'hidden') store.save() }
function recipeIcon(key: string) { return ({ 'fresh-rounded': '▬', 'cute-pink': '◯', 'vintage-paper': '▣', 'vinyl-record': '◉', 'waveform-line': '≋' } as Record<string, string>)[key] || '♫' }
function recipeLabel(key: string) { return ({ 'fresh-rounded': '胶囊·垂落', 'cute-pink': '气泡·弧线', 'vintage-paper': '控制台·稀疏', 'vinyl-record': '黑胶·螺旋', 'waveform-line': '波形·散点' } as Record<string, string>)[key] || '音乐配方' }
</script>
