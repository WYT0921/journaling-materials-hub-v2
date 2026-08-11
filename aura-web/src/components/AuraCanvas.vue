<template>
  <div class="canvas-shell" :style="{ aspectRatio }">
    <div ref="container" class="konva-host"></div>
    <div v-if="busy" class="canvas-loading">正在绘制…</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type Konva from 'konva'
import { renderAuraStage } from '../editor/konvaRenderer'
import type { AuraProject, AuraTemplate } from '../types/aura'

const props = defineProps<{ project: AuraProject; template: AuraTemplate; photoUrl?: string }>()
const container = ref<HTMLDivElement>()
const busy = ref(false)
let stage: Konva.Stage | undefined
let revision = 0
const aspectRatio = computed(() => props.project.ratio === '1:1' ? '1 / 1' : props.project.ratio === '9:16' ? '9 / 16' : '4 / 3')

async function draw() {
  if (!container.value) return
  const current = ++revision
  busy.value = true
  await nextTick()
  const width = container.value.clientWidth
  const next = await renderAuraStage({ container: container.value, project: props.project, template: props.template, photoUrl: props.photoUrl, width })
  if (current !== revision) next.destroy()
  else { stage?.destroy(); stage = next; busy.value = false }
}

onMounted(draw)
watch(() => [props.project, props.template, props.photoUrl], draw, { deep: true })
onBeforeUnmount(() => { revision++; stage?.destroy() })
</script>
