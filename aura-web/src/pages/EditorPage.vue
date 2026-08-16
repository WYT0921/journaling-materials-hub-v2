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
      <AuraCanvas :project="store.active" :template="store.activeTemplate" :photo-url="store.activePhotoUrl" :playing="playing" :playback-progress="audioProgress" fit-editor-height />
      <div class="canvas-rail right">
        <label class="rail-label">↻<span>换媒体</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" @change="pickPhoto" /></label>
        <button :class="{ active: playing }" @click="togglePlayback">{{ playing ? '■' : '▶' }}</button>
      </div>
    </div>

    <nav class="tool-tabs">
      <button v-for="tool in tools" :key="tool.id" :class="{ active: activeTool === tool.id }" @click="activeTool = tool.id"><span>{{ tool.icon }}</span>{{ tool.label }}</button>
    </nav>

    <div class="tool-panel">
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
        <h3>播放器与歌曲信息</h3>
        <div class="music-info-form">
          <label><span>歌曲名</span><input v-model.trim="store.active.music.songName" maxlength="80" placeholder="slow living" @change="recordDirect" /></label>
          <label><span>歌手</span><input v-model.trim="store.active.music.artist" maxlength="80" placeholder="just be" @change="recordDirect" /></label>
          <label><span>专辑</span><input v-model.trim="store.active.music.album" maxlength="80" placeholder="可选" @change="recordDirect" /></label>
          <div class="music-time-row">
            <label><span>当前时间</span><input v-model.trim="store.active.music.currentTime" inputmode="numeric" maxlength="8" placeholder="0:00" @change="recordDirect" /></label>
            <label><span>总时长</span><input v-model.trim="store.active.music.totalTime" inputmode="numeric" maxlength="8" placeholder="3:30" @change="recordDirect" /></label>
          </div>
        </div>
        <label class="audio-upload" :class="{ attached: !!store.activeAudioUrl }"><span>{{ store.activeAudioUrl ? '更换音频' : '添加音频' }}</span><b>{{ store.active.audioName || '支持 MP3、M4A、WAV' }}</b><input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/webm" @change="pickAudio" /></label>
        <p class="panel-note player-style-label">播放器样式</p><div class="option-grid compact"><button v-for="item in players" :key="item.id" :class="{ selected: store.active.adjustments.playerStyle === item.id }" @click="mutate(() => store.active!.adjustments.playerStyle = item.id)"><i>{{ item.icon }}</i>{{ item.label }}</button></div>
        <RangeControl label="播放器尺寸" :value="store.active.adjustments.playerScale" :min=".85" :max="1.15" :step=".01" @change="value => mutate(() => store.active!.adjustments.playerScale = value)" /><RangeControl label="播放进度" :value="store.active.adjustments.progress" :min="0" :max="1" :step=".01" @change="setPlayerProgress" />
      </template>
      <template v-if="activeTool === 'text'">
        <h3>歌词</h3><label class="switch-row">显示歌词<input type="checkbox" :checked="store.active.adjustments.quoteVisible" @change="mutate(() => store.active!.adjustments.quoteVisible = !store.active!.adjustments.quoteVisible)" /></label>
        <textarea v-model="store.active.music.quote" maxlength="120" placeholder="输入 1～2 行歌词" @change="recordDirect"></textarea>
        <p class="panel-note">歌词属于 Music Widget，最多显示两行；关闭后播放器会自动重新居中。</p>
        <div class="choice-row lyrics-styles"><button v-for="style in lyricsStyles" :key="style.id" :class="{ selected: store.active.adjustments.lyricsStyle === style.id }" @click="mutate(() => store.active!.adjustments.lyricsStyle = style.id)">{{ style.label }}</button></div>
        <div class="choice-row"><button v-for="font in fonts" :key="font.id" :class="{ selected: store.active.adjustments.textFont === font.id }" @click="mutate(() => store.active!.adjustments.textFont = font.id)">{{ font.label }}</button></div>
        <div class="choice-row"><button v-for="align in aligns" :key="align.id" :class="{ selected: store.active.adjustments.textAlign === align.id }" @click="mutate(() => store.active!.adjustments.textAlign = align.id)">{{ align.label }}</button></div>
        <RangeControl label="歌词字号" :value="store.active.adjustments.lyricsFontSize" :min=".75" :max="1.35" :step=".05" @change="value => mutate(() => store.active!.adjustments.lyricsFontSize = value)" /><RangeControl label="歌词行距" :value="store.active.adjustments.lyricsLineHeight" :min="1.1" :max="2" :step=".05" @change="value => mutate(() => store.active!.adjustments.lyricsLineHeight = value)" /><RangeControl label="歌词透明度" :value="store.active.adjustments.lyricsOpacity" :min=".35" :max="1" :step=".05" @change="value => mutate(() => store.active!.adjustments.lyricsOpacity = value)" /><RangeControl label="歌词位置" :value="store.active.adjustments.lyricsOffsetY" :min="-.08" :max=".08" :step=".01" @change="value => mutate(() => store.active!.adjustments.lyricsOffsetY = value)" />
      </template>
      <template v-if="activeTool === 'decor'">
        <h3>装饰</h3><label class="switch-row">显示装饰<input type="checkbox" :checked="store.active.adjustments.decorationVisible" @change="mutate(() => store.active!.adjustments.decorationVisible = !store.active!.adjustments.decorationVisible)" /></label>
        <div class="option-grid decor-grid"><button v-for="item in decorationStyles" :key="item.id" :class="{ selected: store.active.adjustments.decorationStyle === item.id }" @click="mutate(() => store.active!.adjustments.decorationStyle = item.id)"><i>{{ item.icon }}</i>{{ item.label }}</button></div>
        <p class="panel-note decoration-color-label">分布方式</p><div class="choice-row"><button v-for="item in decorationDistributions" :key="item.id" :class="{ selected: store.active.adjustments.decorationDistribution === item.id }" @click="mutate(() => store.active!.adjustments.decorationDistribution = item.id)">{{ item.label }}</button></div>
        <p class="panel-note decoration-color-label">动画方式</p><div class="option-grid motion-grid"><button v-for="item in decorationMotions" :key="item.id" :class="{ selected: store.active.adjustments.motion === item.id }" @click="setDecorationMotion(item.id)"><i>{{ item.icon }}</i>{{ item.label }}</button></div>
        <RangeControl label="装饰数量" :value="store.active.adjustments.decorationDensity" :min="1" :max="30" :step="1" @change="value => mutate(() => store.active!.adjustments.decorationDensity = value)" /><RangeControl label="透明度" :value="store.active.adjustments.decorationOpacity" :min=".2" :max="1" :step=".05" @change="value => mutate(() => store.active!.adjustments.decorationOpacity = value)" />
        <p class="panel-note decoration-color-label">装饰颜色</p><div class="palette-row editor-palette decoration-palette"><button v-for="(color, index) in store.active.palette" :key="`${color}-${index}`" :class="{ selected: store.active.adjustments.noteColorIndex === index }" :style="{ background: color }" @click="mutate(() => store.active!.adjustments.noteColorIndex = index)"></button></div>
      </template>
    </div>
    <div v-if="showExport" class="export-overlay" @click.self="!exporting && (showExport = false)">
      <section class="export-sheet">
        <div class="export-sheet-head"><div><p class="eyebrow">EXPORT</p><h3>导出音乐卡片</h3></div><button v-if="!exporting" aria-label="关闭" @click="showExport = false">×</button></div>
        <div v-if="!exporting" class="export-formats">
          <button @click="exportPng"><i>▣</i><b>高清 PNG</b><small>原尺寸 · 静态 · 无水印</small></button>
          <button class="video-format" @click="exportMp4"><i>▶</i><b>动态 MP4</b><small>6 秒 · 30 FPS · {{ store.activeAudioUrl ? '包含音频' : '无音频' }}</small></button>
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
import type { AuraBackground, AuraDecorationDistribution, AuraDecorationStyle, AuraLyricsStyle, AuraMotion, AuraPlayerStyle, AuraProject, AuraRatio, AuraTextAlign, AuraTextFont } from '../types/aura'

const RangeControl = defineComponent({ props: { label: String, value: Number, min: Number, max: Number, step: Number }, emits: ['change'], setup(props, { emit }) { return () => h('label', { class: 'range-control' }, [h('span', props.label), h('input', { type: 'range', value: props.value, min: props.min, max: props.max, step: props.step, onChange: (event: Event) => emit('change', Number((event.target as HTMLInputElement).value)) }), h('b', String(Math.round((props.value || 0) * 100) / 100))]) } })
const store = useAuraStore(), route = useRoute(), router = useRouter()
const activeTool = ref('player'), playing = ref(false), audioProgress = ref<number>(), saving = ref(false), exporting = ref(false), message = ref(''), showExport = ref(false), exportProgress = ref(0), exportKind = ref<'png' | 'mp4'>('png')
const history = ref<EditHistory<AuraProject>>(), canUndo = ref(false), canRedo = ref(false)
let saveTimer = 0
let exportController: AbortController | undefined
let audio: HTMLAudioElement | undefined
const tools = [{ id: 'layout', icon: '▦', label: '排版' }, { id: 'color', icon: '◕', label: '色块' }, { id: 'player', icon: '♫', label: '播放器' }, { id: 'decor', icon: '✦', label: '装饰' }, { id: 'text', icon: '✎', label: '歌词' }]
const ratios: AuraRatio[] = ['1:1', '3:4', '9:16']
const backgrounds: { id: AuraBackground; label: string }[] = [{ id: 'solid', label: '纯色' }, { id: 'stripes', label: '条纹' }, { id: 'gradient', label: '柔光' }, { id: 'paper', label: '纸张' }]
const players: { id: AuraPlayerStyle; label: string; icon: string }[] = [{ id: 'bubble', label: '封面波形', icon: '▣' }, { id: 'vinyl', label: '黑胶唱机', icon: '◎' }, { id: 'capsule', label: '极简控制', icon: '▬' }, { id: 'console', label: '随身听', icon: '▤' }, { id: 'waveform', label: '爱心耳机', icon: '♡' }, { id: 'heartbeat', label: '音乐涂鸦', icon: '♫' }]
const lyricsStyles: { id: AuraLyricsStyle; label: string }[] = [{ id: 'center-poetry', label: '居中诗句' }, { id: 'editorial', label: '杂志排版' }, { id: 'handwritten-note', label: '手写小字' }, { id: 'minimal-serif', label: '极简衬线' }]
const fonts: { id: AuraTextFont; label: string }[] = [{ id: 'serif', label: '宋体' }, { id: 'sans', label: '黑体' }, { id: 'rounded', label: '圆体' }], aligns: { id: AuraTextAlign; label: string }[] = [{ id: 'left', label: '左' }, { id: 'center', label: '中' }, { id: 'right', label: '右' }]
const decorationStyles: { id: AuraDecorationStyle; label: string; icon: string }[] = [{ id: 'music-notes', label: '音符', icon: '♫' }, { id: 'bows', label: '蝴蝶结', icon: '⌁' }, { id: 'stars', label: '星星', icon: '☆' }, { id: 'flowers', label: '小花', icon: '❀' }, { id: 'sparkles', label: '闪光', icon: '✦' }, { id: 'hearts', label: '爱心', icon: '♡' }]
const decorationDistributions: { id: AuraDecorationDistribution; label: string }[] = [{ id: 'trail', label: '轨迹' }, { id: 'scatter', label: '随机' }, { id: 'uniform', label: '均匀' }]
const decorationMotions: { id: AuraMotion; label: string; icon: string }[] = [{ id: 'fall', label: '轻轻飘落', icon: '↓' }, { id: 'breathe', label: '呼吸缩放', icon: '≋' }, { id: 'together', label: '同时闪现', icon: '✦' }, { id: 'sequence', label: '依次出现', icon: '☷' }, { id: 'rotate', label: '缓慢旋转', icon: '↻' }]

onMounted(async () => { if (!await store.openById(String(route.params.projectId))) { router.replace('/'); return }; history.value = new EditHistory(snapshot()); syncHistory(); syncAudio(); document.addEventListener('visibilitychange', saveOnHide) })
onUnmounted(() => { window.clearTimeout(saveTimer); audio?.pause(); document.removeEventListener('visibilitychange', saveOnHide); store.save() })
watch(() => store.active, scheduleSave, { deep: true })
watch(() => store.activeAudioUrl, syncAudio)
function snapshot() { return JSON.parse(JSON.stringify(store.active)) as AuraProject }
function mutate(action: () => void) { action(); history.value?.push(snapshot()); syncHistory() }
function recordDirect() { history.value?.push(snapshot()); syncHistory() }
function setDecorationMotion(motion: AuraMotion) { mutate(() => store.active!.adjustments.motion = motion); playing.value = true }
function undo() { const value = history.value?.undo(); if (value) store.active = value; syncHistory() }
function redo() { const value = history.value?.redo(); if (value) store.active = value; syncHistory() }
function syncHistory() { canUndo.value = !!history.value?.canUndo; canRedo.value = !!history.value?.canRedo }
function scheduleSave() { window.clearTimeout(saveTimer); saving.value = true; saveTimer = window.setTimeout(async () => { await store.save(); saving.value = false }, 550) }
async function pickPhoto(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file || (!file.type.startsWith('image/') && !file.type.startsWith('video/'))) return; try { await store.setMedia(file, await extractPalette(file)); history.value?.push(snapshot()); syncHistory() } catch (error) { message.value = error instanceof Error ? error.message : '媒体取色失败，请更换文件后重试' } }
async function pickAudio(event: Event) { const input = event.target as HTMLInputElement, file = input.files?.[0]; if (!file || !file.type.startsWith('audio/')) return; if (file.size > 40 * 1024 * 1024) { message.value = '音频不能超过 40MB'; input.value = ''; return } try { playing.value = false; audio?.pause(); await store.setAudio(file); history.value?.push(snapshot()); syncHistory(); message.value = '音频已添加，播放动画会跟随真实进度' } catch { message.value = '音频保存失败，请检查浏览器存储空间' } finally { input.value = '' } }
function syncAudio() { audio?.pause(); playing.value = false; audioProgress.value = undefined; if (!store.activeAudioUrl) { audio = undefined; return }; audio = new Audio(store.activeAudioUrl); audio.preload = 'metadata'; audio.loop = true; audio.ontimeupdate = () => { if (audio?.duration) audioProgress.value = audio.currentTime / audio.duration }; audio.onloadedmetadata = () => { if (!audio?.duration || !store.active) return; audio.currentTime = store.active.adjustments.progress * audio.duration; audioProgress.value = store.active.adjustments.progress }; audio.onpause = () => { if (audio && !audio.ended) playing.value = false }; audio.onerror = () => { playing.value = false; message.value = '音频无法播放，请尝试 MP3 或 M4A 格式' } }
async function togglePlayback() { if (!audio) { playing.value = !playing.value; return }; if (audio.paused) { try { await audio.play(); playing.value = true } catch { message.value = '浏览器未能开始播放，请再次点击播放' } } else { audio.pause(); playing.value = false } }
function setPlayerProgress(value: number) { mutate(() => store.active!.adjustments.progress = value); audioProgress.value = value; if (audio?.duration) audio.currentTime = value * audio.duration }
async function exportPng() { if (!store.active || !store.activeTemplate) return; exporting.value = true; exportKind.value = 'png'; exportProgress.value = .18; playing.value = false; try { const blob = await exportAuraPng(store.active, store.activeTemplate, store.activePhotoUrl); exportProgress.value = 1; const result = await shareOrDownload(blob, store.active.title); message.value = result === 'shared' ? '已打开系统分享面板' : 'PNG 已保存到下载目录'; showExport.value = false } catch (error) { message.value = error instanceof Error ? error.message : '导出失败' } finally { exporting.value = false } }
async function exportMp4() { if (!store.active || !store.activeTemplate) return; exporting.value = true; exportKind.value = 'mp4'; exportProgress.value = 0; audio?.pause(); playing.value = false; exportController = new AbortController(); try { const blob = await exportAuraMp4(store.active, store.activeTemplate, store.activePhotoUrl, { audioUrl: store.activeAudioUrl, signal: exportController.signal, onProgress: value => exportProgress.value = value }); const result = await shareOrDownloadMedia(blob, store.active.title, 'mp4', 'video/mp4'); message.value = result === 'shared' ? '已打开系统分享面板' : 'MP4 已保存到下载目录'; showExport.value = false } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) message.value = error instanceof Error ? error.message : 'MP4 导出失败' } finally { exporting.value = false; exportController = undefined } }
function cancelExport() { exportController?.abort() }
async function leave() { await store.save(); router.push('/') }
async function createNew() { await store.save(); await store.create(); router.push('/create') }
function saveOnHide() { if (document.visibilityState === 'hidden') store.save() }
</script>

<style scoped>
.editor-stage-area .canvas-shell { justify-self: center; }
.tool-tabs { grid-template-columns: repeat(5, 1fr); }
.decoration-color-label { margin-top: 18px; margin-bottom: 8px; }
.decoration-palette { justify-content: flex-start; margin-top: 0; }
.decoration-palette button { cursor: pointer; }
.music-info-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; margin-bottom: 22px; }
.music-info-form > label:first-child { grid-column: 1 / -1; }
.music-info-form label { display: grid; gap: 6px; color: #766e65; font-size: 11px; }
.music-info-form input { width: 100%; min-height: 44px; padding: 0 12px; border: 1px solid #ded5ca; border-radius: 12px; background: #fff; color: #302c2a; font: inherit; font-size: 13px; outline: none; }
.music-info-form input:focus { border-color: #687f68; box-shadow: 0 0 0 3px #687f6818; }
.music-time-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; }
.player-style-label { margin: 0 0 10px; }
.audio-upload { min-height: 58px; margin: 0 0 22px; padding: 10px 13px; border: 1px dashed #bdb3a6; border-radius: 14px; background: #fff; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; }
.audio-upload.attached { border-style: solid; border-color: #849984; background: #f0f5ed; }
.audio-upload span { color: #536b55; font-size: 12px; font-weight: 700; white-space: nowrap; }
.audio-upload b { min-width: 0; color: #8a8177; font-size: 10px; font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.audio-upload input { display: none; }
</style>
