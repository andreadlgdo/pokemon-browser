import { createRouter, createWebHistory } from 'vue-router'
import PokemonListView from '@/views/PokemonListView.vue'
import PokemonDetailView from '@/views/PokemonDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'pokemon-list',
      component: PokemonListView,
    },
    { path: '/pokemon/:name', name: 'detail', component: PokemonDetailView },
  ],
})

export default router
