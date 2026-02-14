import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavBarStore = defineStore('navBar', () => {
  const disableHome = ref(false)
  const disableTroveLists = ref(true)
  const disableMetadataList = ref(true)
  const disablePersonList = ref(true)
  const disablePersonStory = ref(true)
  const disableSearch = ref(true)
  const disableAbout = ref(false)
  const listTabTitle = ref("List")
  const listId = ref(0)
  const listHref = ref("")
  const articleTabTitle = ref("Article")
  const articleId = ref(0)
  const articleHref = ref("")
  const savedPerson = reactive({});
  const storyPersonNew = ref(false)
  const troveSearchName = ref("")
  //
  function clearNavBar() {
    this.disableHome = false
    this.disableTroveLists = true
    this.disableMetadataList = true
    this.disablePersonStory = true
    this.disableSearch = true
    this.disableAbout = false
    this.disablePersonList = true
    this.listTabTitle = "List"
    this.listId = 0
    this.listHref = ""
    this.articleTabTitle = "Article"
    this.articleId = 0
    this.articleHref = ""
    this.savedPerson = {};
    this.storyPersonNew = false
    this.troveSearchName = ""
  }
//
  return { disableHome, 
    disableTroveLists, 
    disableMetadataList, 
    disablePersonList, 
    disablePersonStory, 
    disableSearch, 
    disableAbout,
    listTabTitle, 
    listId, 
    listHref, 
    articleTabTitle, 
    articleId, 
    articleHref,
    savedPerson,
    storyPersonNew,
    troveSearchName,
  clearNavBar }
})
