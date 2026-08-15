<template>
  <section class="page home-page">
    <div class="hero-card">
      <p class="eyebrow">VISUAL DIARY · NO CLOUD</p>
      <h1>把一首歌，<br>变成视觉记忆。</h1>
      <p>照片不会上传服务器，创作只留在这台设备。</p>
      <button class="primary" @click="start">开始创作 <span>✦</span></button>
    </div>
    <div class="section-title"><div><p class="eyebrow">RECENT</p><h2>最近草稿</h2></div><span>{{ store.projects.length }} 个</span></div>
    <div v-if="!store.projects.length" class="empty-card"><div>♫</div><p>第一张音乐卡片，等你来完成</p></div>
    <div v-else class="project-grid">
      <article v-for="project in store.projects" :key="project.id" class="project-card" @click="open(project)">
        <div class="project-art" :style="{ background: `linear-gradient(145deg, ${project.palette[0]}, ${project.palette[1]})` }"><span>♫</span><b>{{ project.music.songName || 'Untitled' }}</b></div>
        <div class="project-info"><div><b>{{ project.title }}</b><small>{{ formatDate(project.updatedAt) }}</small></div><button class="icon-button" aria-label="删除" @click.stop="store.remove(project)">×</button></div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuraStore } from '../stores/aura'
import type { AuraProject } from '../types/aura'
const router = useRouter(), store = useAuraStore()
async function start() { await store.create(); router.push('/create') }
async function open(project: AuraProject) { await store.open(project); router.push(`/editor/${project.id}`) }
const formatDate = (value: string) => new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
</script>
