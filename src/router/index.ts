import { createRouter, createWebHashHistory } from 'vue-router'
import BlogPost from '../views/BlogPost.vue'

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
      component: BlogPost
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
