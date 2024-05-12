import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useErrorsArrayStore = defineStore('errorsArray', () => {
  const arrayErrors = ref([])
  return { arrayErrors }
})
