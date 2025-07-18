import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useUserDataStore = defineStore('userData', () => {
  const arrayMinedStatus = ref([])
  const arrayMetadataTypes = ref([])
  const troveDetails = ref('')
  const troveQueryTotal = ref(0)
  const troveQueryArticleTotal = ref(0)
  const userDuplicateListIds = ref([])
  const loadedIndex = ref(0)
  const userLists = reactive([])
//   All the Trove Lists of a user - read from Trove
// userLists = []; /
// List element object definition
// listItem = {};
// listItem.TroveListId
// listItem.TroveListUpdatedText
// listItem.TroveListViewedDateText added June 2025 - Date time that the UI got it
// listItem.TroveListUpdated
// listItem.TroveListItemCount
// listItem.TroveListDescription
// listItem.TroveListReqUrl FROM TroveReqUrl
// listItem.TroveListName
// listItem.TroveListViewUrl FROm TroveViewUrl
// listItem.TroveListLoadState
// listItem.TroveListLinkedPerson
// listItem.TroveListArticleMinedStatusCounts

  const userListArticles = reactive([])
// A 2 dimensional array - First index is same as listItem
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
  const userReloadLists = ref(false)
  const userListsReady = ref(false)
  const viewedArticles = reactive([])
  // viewedArticles FROM displayedArticles = []; => 
  // ViewedArticleId FROM TroveArticleId
  // ViewedArticleLastTroveUpdated FROM TroveArticleLastUpdated
  // ViewedArticleLastTroveUpdatedText added June 2025 DUmmy daye / troveArticle.lastCorrection.lastupdated / Latest List Updated Date
  // ViewedArticleDbUpdateDateText added June 2025 - Date time updated in DB
  // ViewedArticleViewedDateText added June 2025 - Date time that the UI got it
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
  // ViewedArticleSummaryText FROM TroveArticleSummaryText => 
  // ViewedArticlePossibleDupArticle []
  //             TroveArticleId
  //             TroveArticleViewUrl
  //             TroveArticleListDescription
  // ViewedArticleEntities [] FROM TroveArticleEntities => 
	// Metadatype (Date, Event, Name, Place), Metadata, 'Men'/Matched True
  // ViewedArticleRetrieveTrove FROM TroveArticleRetrieveTrove => 
  // ViewedArticleSearchWord FROM TroveArticleSearchWord => 
  // ViewedArticleFoundCount FROM TroveArticleFoundCount => 
  // ViewedArticleOriginalText FROM TroveArticleOriginalText => 
  // ViewedArticleMinedStatus FROM TroveArticleMinedStatus => 
  // ViewedArticleMinedStatusText FROM TroveArticleMinedStatusText => 
  // ViewedArticleMetadata FROM TroveArticleMetadata [] => 
	// Array [MetadataType, Metadata, "Auto"/"Sel"]

  const metadataValueTotal = ref(0)
  const metadataTypeByMetadata = ref([])
  //
 function clearStore() {
    troveDetails.value = {}
    troveQueryTotal.value = 0
    troveQueryArticleTotal.value = 0
    loadedIndex.value = 0
    userDuplicateListIds.value = []
    userLists = []
    userListArticles = []
    userListsReady.value = false
    viewedArticles = []
    metadataValueTotal.value = 0
    metadataTypeByMetadata.value = []
    }
  //
  function updateListItemStatusCount(listIdx, count, minedStatusCounts) {
      // console.log(`userData updateListItemStatusCount %s %s`, listIdx, JSON.stringify(this.userLists[listIdx]))
      this.userLists[listIdx].TroveListItemCount = count
      this.userLists[listIdx].TroveListArticleMinedStatusCounts = minedStatusCounts
      console.log ("userData updateListItemStatusCount")
  }
//
  return { arrayMinedStatus,
    arrayMetadataTypes,
    troveDetails, 
    troveQueryTotal, 
    troveQueryArticleTotal, 
    userDuplicateListIds,
    loadedIndex,
    userLists, 
    userListsReady, 
    userReloadLists,
    viewedArticles, 
    metadataValueTotal, 
    metadataTypeByMetadata, 
    clearStore,
    updateListItemStatusCount
  }
})
