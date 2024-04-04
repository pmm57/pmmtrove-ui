import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useErrorsArrayStore = defineStore('errorsArray', () => {
  const errors = ref([])
  return { errors }
})
