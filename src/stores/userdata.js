import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserDataStore = defineStore('userData', () => {
  const troveUserId = ref('')
  const troveQueryTotal = ref(0)
  const troveQueryArticleTotal = ref(0)
  const userDuplicateListIds = ref([])
  const userLists = ref([])
//   All the Trove Lists of a user - read from Trove
// userLists = []; /
// List element object definition
// listItem = {};
// listItem.TroveListUserId FROM TroveUserId  REMOVE
// listItem.TroveListId
// listItem.TroveListUpdatedText
// listItem.TroveListUpdated
// listItem.TroveListItemCount
// listItem.TroveListDescription
// listItem.TroveListReqUrl FROM TroveReqUrl
// listItem.TroveListName
// listItem.TroveListViewUrl FROm TroveViewUrl
// listItem.TroveListLoadState
// listItem.TroveListArticleMinedStatusCounts
// listItem.TroveListArticles []

// TroveListArticles [] 
//   TroveListArticleViewedIdx 
//   TroveListArticleId FROM id => 
//   TroveListArticleReqUrl FROM url => 
//   TroveListArticleHeading FROM heading => 
//   TroveListArticleCategory FROM category => 
//   TroveListArticleSource FROM title.value => 
//   TroveListArticlePubDate FROM date => 
//   TroveListArticlePage FROM page => 
//   TroveListArticlePageSequence FROM pageSequence => 
//   TroveListArticleViewUrl FROM troveUrl => 
//   TroveListArticleMinedStatus FROM listArticleMinedStatus => 
//   TroveListArticleMinedStatustext FROM listArticleMinedStatustext => 
//   TroveListArticleNote FROM note => 
//
  const userListsReady = ref(false)
  const viewedArticles = ref([])
  // viewedArticles FROM displayedArticles = []; => 
  // ViewedArticleId FROM TroveArticleId
  // ViewedArticleLastTroveUpdated FROM TroveArticleLastUpdated
  // ViewedArticleTroveUpdate
  // ViewedArticleDBUpdate??
  // ViewedArticleUpdatedBy FROM TroveArticleLastUpdatedBy
  // ViewedArticleHeading FROM TroveArticleHeading
  // ViewedArticleSource FROM TroveArticleSource => 
  // ViewedArticlePubDate FROM TroveArticlePubDate => 
  // ViewedArticleNote FROM TroveArticleNote => 
  // ViewedArticleReqUrl FROM TroveArticleReqUrl => 
  // ViewedArticleViewUrl FROM TroveArticleViewUrl => 
  // ViewedArticleGetTrove FROM TroveArticleGetTrove => 
  // ViewedArticleGetDB FROM TroveArticleGetDB => 
  // ViewedArticleRetrieveDB FROM TroveArticleRetrieveDB => 
  // ViewedArticleSelectedText FROM TroveArticleSelectedText => 
  // ViewedArticleEntities [] FROM TroveArticleEntities => 
	// Metadatype (Date, Event, Name, Place), Metadata, 'Men'/Matched True
  // ViewedArticleRetrieveTrove FROM TroveArticleRetrieveTrove => 
  // ViewedArticleSearchWord FROM TroveArticleSearchWord => 
  // ViewedArticleFoundCount FROM TroveArticleFoundCount => 
  // ViewedArticleOriginalText FROM TroveArticleOriginalText => 
  // ViewedArticleMinedStatus FROM TroveArticleMinedStatus => 
  // ViewedArticleMinedStatusText FROM TroveArticleMinedStatusText => 
  // ViewedArticleMetadata FROM TroveArticleMetadata [] => 
	// MetadataType, Metadata, "Auto"/"Sel"

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
    viewedArticles.value = []
    metadataValueTotal.value = 0
    metadataTypeByMetadata.value = []
    }
  //
  return { troveUserId, troveQueryTotal, troveQueryArticleTotal, userDuplicateListIds, userLists, userListsReady, viewedArticles, metadataValueTotal, metadataTypeByMetadata, clearStore}
})
