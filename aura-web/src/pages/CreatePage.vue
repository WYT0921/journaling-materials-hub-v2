<template>
  <section v-if="store.active && store.activeTemplate" class="page create-page">
    <div class="create-heading"><div><p class="eyebrow">NEW MEMORY</p><h1>{{ stepTitles[step] }}</h1></div><span>{{ step + 1 }} / 5</span></div>
    <div class="step-dots"><i v-for="index in 5" :key="index" :class="{ active: index - 1 <= step }"></i></div>

    <div v-if="step === 0" class="step-panel photo-step">
      <label class="photo-picker" :class="{ filled: store.activePhotoUrl }">
        <img v-if="store.activePhotoUrl" :src="store.activePhotoUrl" alt="已选择照片" />
        <div v-else><span>＋</span><b>选择一张照片</b><small>JPEG · PNG · WebP</small></div>
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="pickPhoto" />
      </label>
      <p class="privacy-note">◉ 图片在设备本地取色和保存，不会上传。</p>
      <div v-if="store.activePhotoUrl" class="palette-row"><button v-for="(color, index) in store.active.palette" :key="color" :class="{ selected: index === store.active.adjustments.paletteIndex }" :style="{ background: color }" @click="store.active.adjustments.paletteIndex = index"></button></div>
    </div>

    <div v-else-if="step === 1" class="step-panel form-stack">
      <label>歌曲名<input v-model="store.active.music.songName" maxlength="80" placeholder="From The Start" /></label>
      <label>歌手<input v-model="store.active.music.artist" maxlength="80" placeholder="Laufey" /></label>
      <label>专辑<input v-model="store.active.music.album" maxlength="80" placeholder="Bewitched" /></label>
      <label>这一刻的文案<textarea v-model="store.active.music.quote" maxlength="120" placeholder="有些旋律，会替我们记住当时的光。"></textarea></label>
      <div class="time-row"><label>当前时长<input v-model="store.active.music.currentTime" placeholder="1:28" /></label><label>总时长<input v-model="store.active.music.totalTime" placeholder="4:12" /></label></div>
    </div>

    <div v-else-if="step === 2" class="step-panel">
      <div class="choice-grid">
        <button v-for="template in store.catalog?.templates" :key="template.key" class="mood-choice" :class="[{ selected: store.active.templateKey === template.key }, `mood-${template.style}`]" @click="store.active.templateKey = template.key">
          <span>{{ styleIcon(template.style) }}</span><b>{{ template.name }}</b><small>{{ template.style.toUpperCase() }}</small>
        </button>
      </div>
    </div>

    <div v-else-if="step === 3" class="step-panel editor-step">
      <AuraCanvas :project="store.active" :template="store.activeTemplate" :photo-url="store.activePhotoUrl" />
      <div class="editor-controls">
        <div class="segmented"><button v-for="ratio in ratios" :key="ratio" :class="{ active: store.active.ratio === ratio }" @click="store.active.ratio = ratio">{{ ratio }}</button></div>
        <label>照片缩放 <input v-model.number="store.active.adjustments.photoScale" type="range" min="1" max="2.4" step=".05" /></label>
        <label>横向焦点 <input v-model.number="store.active.adjustments.photoOffsetX" type="range" min="-1" max="1" step=".05" /></label>
        <label>纵向焦点 <input v-model.number="store.active.adjustments.photoOffsetY" type="range" min="-1" max="1" step=".05" /></label>
        <label>装饰密度 <input v-model.number="store.active.adjustments.decorationDensity" type="range" min="0" max="12" step="1" /></label>
        <div class="background-options"><button v-for="background in backgrounds" :key="background.value" :class="{ selected: store.active.adjustments.background === background.value }" @click="store.active.adjustments.background = background.value">{{ background.label }}</button></div>
      </div>
    </div>

    <div v-else class="step-panel export-step">
      <AuraCanvas :project="store.active" :template="store.activeTemplate" :photo-url="store.activePhotoUrl" />
      <div class="export-meta"><b>{{ exportSize }}</b><span>PNG · 无水印 · 本地生成</span></div>
      <button class="primary export-button" :disabled="exporting" @click="exportCard">{{ exporting ? '正在生成高清图片…' : '导出并分享 PNG' }}</button>
      <p v-if="message" class="success-message">{{ message }}</p>
    </div>

    <div class="step-actions"><button v-if="step > 0" class="secondary" @click="go(step - 1)">上一步</button><button v-if="step < 4" class="primary" @click="go(step + 1)">{{ step === 3 ? '准备导出' : '继续' }}</button></div>
  </section>
  <section v-else class="page loading-page"><div class="loader"></div><p>正在准备画布…</p></section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuraStore } from '../stores/aura'
import { extractPalette } from '../services/paletteService'
import { exportAuraPng } from '../editor/konvaRenderer'
import { shareOrDownload } from '../services/shareService'
import AuraCanvas from '../components/AuraCanvas.vue'
import { ratioSize, type AuraBackground, type AuraRatio } from '../types/aura'

const store = useAuraStore(), step = ref(0), exporting = ref(false), message = ref('')
const stepTitles = ['选择今天的照片', '写下音乐信息', '选择一种氛围', '轻轻调整设计', '保存这段记忆']
const ratios: AuraRatio[] = ['1:1', '4:3', '9:16']
const backgrounds: { value: AuraBackground; label: string }[] = [{ value: 'gradient', label: '柔光' }, { value: 'cream', label: '奶油' }, { value: 'paper', label: '纸张' }, { value: 'dark', label: '夜色' }]
const exportSize = computed(() => store.active ? ratioSize(store.active.ratio).join(' × ') : '')

onMounted(async () => {
  await store.initialize()
  if (!store.active) await store.create()
  step.value = store.active?.step || 0
  document.addEventListener('visibilitychange', autosaveOnHide)
})
onUnmounted(() => { document.removeEventListener('visibilitychange', autosaveOnHide); store.save() })
watch(() => store.active, () => { if (store.active) window.clearTimeout(saveTimer), saveTimer = window.setTimeout(store.save, 500) }, { deep: true })
let saveTimer = 0

async function pickPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  await store.setPhoto(file, await extractPalette(file))
}
async function go(value: number) { step.value = value; if (store.active) store.active.step = value; await store.save() }
async function exportCard() {
  if (!store.active || !store.activeTemplate) return
  exporting.value = true; message.value = ''
  try {
    const blob = await exportAuraPng(store.active, store.activeTemplate, store.activePhotoUrl)
    const result = await shareOrDownload(blob, store.active.title)
    message.value = result === 'shared' ? '已打开系统分享面板' : '图片已保存到下载目录'
  } catch (error) { message.value = error instanceof Error ? error.message : '导出失败，请重试' }
  finally { exporting.value = false }
}
function styleIcon(style: string) { return ({ fresh: '✦', cute: '♡', vintage: '⌁', vinyl: '◉', waveform: '≋' } as Record<string, string>)[style] || '✦' }
function autosaveOnHide() { if (document.visibilityState === 'hidden') store.save() }
</script>
