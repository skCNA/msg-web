import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/groups',
    children: [
      {
        path: '/demo-manager',
        name: 'DemoManager',
        component: () => import('@/views/demo-manager.vue'),
        meta: { title: '演示管理' }
      },
      {
        path: '/groups',
        name: 'Groups',
        component: () => import('@/views/groups/index.vue'),
        meta: { title: '群组配置' }
      },
      {
        path: '/groups/:id',
        name: 'GroupDetail',
        component: () => import('@/views/groups/detail-working.vue'),
        meta: { title: '群组详情' }
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: '/rules',
        name: 'Rules',
        component: () => import('@/views/rules-working.vue'),
        meta: { title: '规则配置' }
      },
      {
        path: '/templates',
        name: 'Templates',
        component: () => import('@/views/templates/index.vue'),
        meta: { title: '模板配置' }
      },
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '监控面板' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/settings.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: '/storage-test',
        name: 'StorageTest',
        component: () => import('@/views/StorageTest.vue'),
        meta: { title: '存储测试' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router