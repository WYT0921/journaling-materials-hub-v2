<template>
  <section v-if="store.active" class="page prepare-page">
    <div class="create-heading"><div><p class="eyebrow">NEW MEMORY</p><h1>{{ step === 0 ? '选择今天的照片' : '写下音乐信息' }}</h1></div><span>{{ step + 1 }} / 2</span></div>
    <div class="step-dots two"><i :class="{ active: true }"></i><i :class="{ active: step === 1 }"></i></div>

    <div v-if="step === 0" class="step-panel photo-step">
      <label class="photo-picker" :class="{ filled: store.activePhotoUrl }">
        <img v-if="store.activePhotoUrl" :src="store.activePhotoUrl" alt="已选择照片" />
        <div v-else><span>＋</span><b>选择一张照片</b><small>JPEG · PNG · WebP</small></div>
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="pickPhoto" />
      </label>
      <p class="privacy-note">◉ 图片在设备本地取色和保存，不会上传。</p>
      <div v-if="store.activePhotoUrl" class="palette-row"><button v-for="(color, index) in store.active.palette" :key="color" :class="{ selected: index === store.active.adjustments.paletteIndex }" :style="{ background: color }" @click="store.active.adjustments.paletteIndex = index"></button></div>
    </div>

    <div v-else class="step-panel form-stack">
      <label>歌曲名<input v-model="store.active.music.songName" maxlength="80" placeholder="From The Start" /></label>
      <label>歌手<input v-model="store.active.music.artist" maxlength="80" placeholder="Laufey" /></label>
      <label>专辑<input v-model="store.active.music.album" maxlength="80" placeholder="Bewitched" /></label>
      <label>这一刻的文案<textarea v-model="store.active.music.quote" maxlength="120" placeholder="有些旋律，会替我们记住当时的光。"></textarea></label>
      <div class="time-row"><label>当前时长<input v-model="store.active.music.currentTime" placeholder="1:28" /></label><label>总时长<input v-model="store.active.music.totalTime" placeholder="4:12" /></label></div>
    </div>

    <div class="step-actions"><button v-if="step" class="secondary" @click="step = 0">上一步</button><button class="primary" :disabled="step === 0 && !store.activePhotoUrl" @click="continueFlow">{{ step ? '进入编辑器' : '继续' }}</button></div>
  </section>
  <section v-else class="page loading-page"><div class="loader"></div><p>正在准备画布…</p></section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuraStore } from '../stores/aura'
import { extractPalette } from '../services/paletteService'

const store = useAuraStore(), router = useRouter(), step = ref(0)
let saveTimer = 0
onMounted(async () => { await store.initialize(); if (!store.active) await store.create() })
onUnmounted(() => { window.clearTimeout(saveTimer); store.save() })
watch(() => store.active, () => { window.clearTimeout(saveTimer); saveTimer = window.setTimeout(store.save, 500) }, { deep: true })

async function pickPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  await store.setPhoto(file, await extractPalette(file))
}
async function continueFlow() {
  if (!store.active) return
  if (step.value === 0) { step.value = 1; return }
  store.active.step = 2
  await store.save()
  router.push(`/editor/${store.active.id}`)
}
</script>
