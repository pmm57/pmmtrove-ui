import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserDataStore = defineStore('userData', () => {
  const troveUserId = ref('')
  const troveQueryTotal = ref(0)
  const troveQueryArticleTotal = ref(0)
  const userDuplicateListIds = ref([])
  const userLists = ref([])
  const userListsReady = ref(false)
  const metadataValueTotal = ref(0)
  const metadataTypeByMetadata = ref([])
  //
 function clearStore() {
    troveUserId.value = ''
    troveQueryTotal.value = 0
    troveQueryArticleTotal.value = 0
    userDuplicateListIds.value = []
    userLists.value = []
    userListsReady.value = false
    metadataValueTotal.value = 0
    metadataTypeByMetadata.value = []
    }
  //
  return { troveUserId, troveQueryTotal, troveQueryArticleTotal, userDuplicateListIds, userLists, userListsReady, metadataValueTotal, metadataTypeByMetadata, clearStore}
})
