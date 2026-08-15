import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import CreatePage from '../pages/CreatePage.vue'
import TemplatesPage from '../pages/TemplatesPage.vue'
import EditorPage from '../pages/EditorPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/create', component: CreatePage },
    { path: '/templates', component: TemplatesPage },
    { path: '/editor/:projectId', component: EditorPage, meta: { editor: true } }
  ],
  scrollBehavior: () => ({ top: 0 })
})
