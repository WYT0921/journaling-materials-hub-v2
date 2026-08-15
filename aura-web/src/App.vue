<template>
  <div class="app-frame" :class="{ 'editor-frame': route.meta.editor }">
    <header v-if="!route.meta.editor" class="topbar"><router-link to="/" class="brand">AURA <span>MUSIC</span></router-link><div class="privacy-dot">● 本地创作</div></header>
    <main><router-view /></main>
    <nav v-if="!route.meta.editor" class="bottom-nav">
      <router-link to="/" aria-label="首页"><span>⌂</span>首页</router-link>
      <router-link to="/create" class="create-nav" aria-label="创作"><span>＋</span>创作</router-link>
      <router-link to="/templates" aria-label="模板"><span>▦</span>模板</router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuraStore } from './stores/aura'
const store = useAuraStore()
const route = useRoute()
onMounted(store.initialize)
</script>
