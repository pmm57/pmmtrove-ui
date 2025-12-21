import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/usertrovelists',
      name: 'userTroveLists',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/UserTroveListsView.vue')
    },
    { 
      path: '/userListPage',
      name: 'userListPage',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/UserListView.vue'),
      props: true
    },
    { 
      path: '/editArticle',
      name: 'editArticle',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/EditArticle.vue'),
      props: true
    },
    {
      path: '/usermetadatalist',
      name: 'userMetadataList',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/UserMetadataListView.vue')
    },
    {
      path: '/userpersonlist',
      name: 'userPersonList',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/UserPersonListView.vue')
    },
    {
      path: '/userpersonstory',
      name: 'userPersonStory',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/UserPersonStoryView.vue')
    },
    {
      path: '/searchTrove',
      name: 'searchTrove',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/SearchTroveView.vue')
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'), props: true
    }
  ]
})

export default router
