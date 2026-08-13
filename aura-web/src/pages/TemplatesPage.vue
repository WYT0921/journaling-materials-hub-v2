<template>
  <section class="page">
    <p class="eyebrow">MOOD COLLECTION</p><h1 class="page-title">从一种氛围开始</h1><p class="page-lead">模板是可编辑布局，不是一张固定图片。</p>
    <div class="template-list">
      <button v-for="(template, index) in store.catalog?.templates" :key="template.key" class="template-card" @click="start(template.key)">
        <div class="template-swatch" :class="`mood-${template.style}`"><span>{{ moodIcons[index % moodIcons.length] }}</span><div></div></div>
        <div><b>{{ template.name }}</b><small>{{ template.supportedRatios.join(' · ') }}</small></div><i>→</i>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuraStore } from '../stores/aura'
const store = useAuraStore(), router = useRouter(), moodIcons = ['✦', '♡', '⌁', '◉', '≋']
async function start(key: string) { await store.create(key); router.push('/create') }
</script>
