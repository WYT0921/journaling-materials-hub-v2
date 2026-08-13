import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/categories',
    children: [
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('../views/categories/CategoryList.vue')
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('../views/materials/MaterialList.vue')
      },
      {
        path: 'text-assets',
        name: 'TextAssets',
        component: () => import('../views/text-assets/TextAssetList.vue')
      },
      {
        path: 'collector-runs',
        name: 'CollectorRuns',
        component: () => import('../views/collector/CollectorRunList.vue')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/users/UserList.vue')
      },
      {
        path: 'redeem-codes',
        name: 'RedeemCodes',
        component: () => import('../views/redeem-codes/RedeemCodeList.vue')
      },
      {
        path: 'feedbacks',
        name: 'Feedbacks',
        component: () => import('../views/feedbacks/FeedbackList.vue')
      },
      {
        path: 'music-card',
        name: 'MusicCard',
        component: () => import('../views/music-card/MusicCardManage.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.guest && authStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
