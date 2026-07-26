import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: { template: '<div />' }
    },
    {
      path: '/blog/:name',
      name: 'blog-post',
      component: () => import('../views/BlogPost.vue')
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
