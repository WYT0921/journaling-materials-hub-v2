<template>
  <div class="canvas-shell" :style="{ aspectRatio, maxWidth: fitEditorHeight ? editorMaxWidth : undefined }">
    <div ref="container" class="konva-host"></div>
    <div v-if="busy" class="canvas-loading">正在绘制…</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type Konva from 'konva'
import { animateAuraStage, renderAuraStage } from '../editor/konvaRenderer'
import type { AuraProject, AuraTemplate } from '../types/aura'

const props = withDefaults(defineProps<{ project: AuraProject; template: AuraTemplate; photoUrl?: string; playing?: boolean; playbackProgress?: number; fitEditorHeight?: boolean }>(), { playing: false, fitEditorHeight: false })
const container = ref<HTMLDivElement>()
const busy = ref(false)
let stage: Konva.Stage | undefined
let stopAnimation: (() => void) | undefined
let revision = 0
const aspectRatio = computed(() => props.project.ratio === '1:1' ? '1 / 1' : props.project.ratio === '9:16' ? '9 / 16' : '3 / 4')
const editorMaxWidth = computed(() => props.project.ratio === '1:1'
  ? '52vh'
  : props.project.ratio === '9:16'
    ? 'calc(52vh * 9 / 16)'
    : 'calc(52vh * 3 / 4)')

async function draw() {
  if (!container.value) return
  const current = ++revision
  busy.value = true
  await nextTick()
  const width = container.value.clientWidth
  const next = await renderAuraStage({ container: container.value, project: props.project, template: props.template, photoUrl: props.photoUrl, width })
  if (current !== revision) next.destroy()
  else { stopAnimation?.(); stage?.destroy(); stage = next; busy.value = false; syncAnimation() }
}

function syncAnimation() {
  stopAnimation?.()
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  stopAnimation = props.playing && stage && !reducedMotion ? animateAuraStage(stage, props.project.adjustments.motion, () => props.playbackProgress) : undefined
}

onMounted(draw)
watch(() => [props.project, props.template, props.photoUrl], draw, { deep: true })
watch(() => props.playing, syncAnimation)
onBeforeUnmount(() => { revision++; stopAnimation?.(); stage?.destroy() })
</script>
