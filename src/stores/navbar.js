import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavBarStore = defineStore('navBar', () => {
  const disableHome = ref(false)
  const disableTroveLists = ref(true)
  const listTabTitle = ref("List")
  const listId = ref(0)
  const listHref = ref("")
  const articleTabTitle = ref("Article")
  const articleId = ref(0)
  const articleHref = ref("")
  const disableMetadataList = ref(true)
  const disablePersonList = ref(true)
  const disableSearch = ref(true)
  const disableAbout = ref(false)
  return { disableHome, 
    disableTroveLists, 
    listTabTitle, 
    listId, 
    listHref, 
    articleTabTitle, 
    articleId, 
    articleHref, 
    disableMetadataList, 
    disablePersonList, 
    disableSearch, 
    disableAbout}
})
