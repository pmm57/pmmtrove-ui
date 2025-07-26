import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useUserDataStore = defineStore('userData', () => {
  const arrayMinedStatus = ref([])
  const arrayMetadataTypes = ref([])
  const troveDetails = ref('')
  const troveQueryTotal = ref(0)
  const troveQueryArticleTotal = ref(0)
  const nbrUserIgnoredArticles = ref(0)
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
  const userReloadList = ref(0)
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
  function updateAllLists (cacheUserLists) {
    this.userListArticles = []
    this.userLists = []
    for (const list of cacheUserLists) {
      this.userListArticles.push(list.TroveListArticles);
      delete list.TroveListArticles
      this.userLists.push(list)
    }
  }
  //
  
  // Whenever viewedArticles is updated update metadataTypeByMetadata to indicate Article link is enabled
  function updMetadataTypeArticleLinks(viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata) {
    // Wait until Metadata has been loaded
    // console.log('App.vue updMetadataTypeArticleLinks: ', this.metadataTypeByMetadata.length, viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata);
    if (this.metadataTypeByMetadata.length == 0) {
      setTimeout(updMetadataTypeArticleLinks, 3000, viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata);
    }
    // Collect ViewedArticle Metadata
    var arrayViewedArticleMetadata = []
    viewedArticleMetadata.forEach((metadata) => {
      if (metadata[2] == 'Sel') {
        arrayViewedArticleMetadata.push({
          MetadataType: metadata[0],
          MetadataValue: metadata[1],
          troveArticleId: Number(viewedArticleId),
          troveListId: Number(viewedListId),
          idxViewedArticle: idxViewdArticle
        })
      }
    })
    // console.log('sseUserListWithArticles - Metadata 2 ', JSON.stringify(arrayViewedArticleMetadata))
    // Sort into order
    arrayViewedArticleMetadata.sort(sortMetadataTypeAndValue)
    // console.log('App.vue arrayViewedArticleMetadata: ', JSON.stringify(arrayViewedArticleMetadata));
    // Merge against metadataTypeByMetadata and set Article Link
    var idxType = 0
    var idxValue = 0
    var tempArray = []
    for (var idx = 0; idx < arrayViewedArticleMetadata.length; ++idx) {
      // Find Metadata Type Array
      var el = arrayViewedArticleMetadata[idx]
      // console.log ('updMetadataType - metadataTypeByMetadata - idxType ', JSON.stringify(this.metadataTypeByMetadata[idxType]))
      idxType = this.metadataTypeByMetadata.findIndex((type) => type.metadataType === el.MetadataType)
      // If less than then 0 have a New MetadataType not in the array - not possible so show error
      if (idxType < 0) {
        console.log('ERROR updMetadataType Missing MetaDataType ', el.MetadataType)
        break
      }
      // console.log('App.vue Match Type: ', el.MetadataType, this.metadataTypeByMetadata[idxType].metadataType);
      // Matched to MetadataType now match to MetadataValue
      tempArray = this.metadataTypeByMetadata[idxType].arrayMetadata
      // console.log ('updMetadataType - MetadataValue arrayMetadata ', el.MetadataValue, JSON.stringify(tempArray))
      idxValue = tempArray.findIndex((value) => value.metadataValue === el.MetadataValue)
      // If less than then 0 have a New MetadataValue not in the array - is possible due to asynchronous processing - log and ignore
      if (idxValue < 0) {
        console.log('NOTIFY updMetadataType Missing MetadataValue ', el.MetadataValue)
        break
      }
      // console.log('App.vue updMetadataType Match Value: ', el.MetadataValue, tempArray[idxValue].metadataValue);
      // Matched to MetadataType and MetadataValue now match List and Article
      tempArray = this.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray
      // console.log ('updMetadataType - articleListArray ', JSON.stringify(tempArray))
      var matched = false
      for (var jdx = 0; jdx < tempArray.length; ++jdx) {
        if ((tempArray[jdx].troveArticleId == el.troveArticleId) && (tempArray[jdx].troveListId == el.troveListId)) {
          // console.log ('updMetadataType - matched ', el)
          matched = true
          this.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray[jdx].idxViewedArticle = el.idxViewedArticle
          break
        }
      }
      // If not matched - is possible due to asynchronous processing - log and ignore
      if (!matched) {
        console.log('NOTIFY updMetadataType Missing Article/List for MetadataValue ', idx, el, idxType, idxValue, JSON.stringify(tempArray))
      }
    }
  }
  //
  function sortMetadataTypeAndValue(a, b) {
    var comparison = 0;
    if (a.MetadataType === b.MetadataType) {
      if (a.Metadata > b.Metadata) {
        comparison = 1;
      } else if (a.Metadata < b.Metadata) {
        comparison = -1;
      }
      return comparison
    }
    if (a.MetadataType > b.MetadataType) {
      comparison = 1;
    } else if (a.MetadataType < b.MetadataType) {
      comparison = -1;
    }
    return comparison;
  }
  //
  function updateListItemStatusCount(listIdx, count, minedStatusCounts) {
      // console.log(`this updateListItemStatusCount %s %s`, listIdx, JSON.stringify(this.userLists[listIdx]))
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
    nbrUserIgnoredArticles,
    userDuplicateListIds,
    loadedIndex,
    userLists, 
    userListsReady, 
    userReloadList,
    userReloadLists,
    viewedArticles, 
    metadataValueTotal, 
    metadataTypeByMetadata, 
    clearStore,
    updateAllLists,
    updMetadataTypeArticleLinks,
    updateListItemStatusCount
  }
})
