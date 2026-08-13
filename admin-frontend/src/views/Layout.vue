<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">📒 素材管理</div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: currentPath === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <div class="main-area">
      <header class="topbar">
        <div class="topbar-user">
          <span>👤 {{ authStore.username }}</span>
          <span class="topbar-logout" @click="handleLogout">退出登录</span>
        </div>
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentPath = computed(() => route.path)

const navItems = [
  { path: '/categories', icon: '📂', label: '分类管理' },
  { path: '/materials', icon: '🖼️', label: '素材管理' },
  { path: '/text-assets', icon: '☺', label: '颜文字 / Emoji' },
  { path: '/collector-runs', icon: '↻', label: '采集记录' },
  { path: '/aura', icon: '🎵', label: 'AURA 音乐卡片' },
  { path: '/users', icon: '👥', label: '用户管理' },
  { path: '/redeem-codes', icon: '🎟️', label: '兑换码管理' },
  { path: '/feedbacks', icon: '💬', label: '反馈管理' },
  { path: '/music-card', icon: '♪', label: '音乐卡片' }
]

function handleLogout() {
  authStore.logout()
  router.replace('/login')
}
</script>
