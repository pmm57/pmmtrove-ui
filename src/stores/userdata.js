import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useUserDataStore = defineStore('userData', () => {
  const arrayMinedStatus = ref([])
  const arrayMetadataTypes = ref([])
  const troveDetails = reactive({})
  const troveQueryTotal = ref(0)
  const troveQueryArticleTotal = ref(0)
  const nbrUserDupOrIgnoredArticles = ref(0)
  const userDuplicateListIds = ref([])
  const loadedIndex = ref(-1)
  const userLists = ref([])
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

  const userListArticles = ref([])
// A 2 dimensional array - First index is same as listItem
//   TroveListArticleViewedIdx 
//   TroveListArticleId FROM id => 
//   TroveListArticleReqUrl FROM url => 
//   TroveListArticleHeading FROM heading => 
//   TroveListArticleCategory FROM category => 
//   TroveListArticleSource FROM title => 
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
  const viewedArticles = ref([])
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
  // ViewedArticleSnips FROM TroveArticleTextSnips - JSON array as string [{snips:"xxxxxx",snipe:"xxxxxxx"}, ....]
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
  const storyEventsForPersons = ref([])
  //
function clearStore() {
  this.troveQueryTotal = 0
  this.troveQueryArticleTotal = 0
  this.loadedIndex = -1
  this.userDuplicateListIds = []
  this.userLists = []
  this.userListArticles = []
  this.viewedArticles = []
  this.metadataValueTotal = 0
  this.metadataTypeByMetadata = []
  this.storyEventsForPersons = []
}
  //
function updateAllLists(cacheUserLists) {
  // Build new arrays immutably
  const newUserLists = []
  const newUserListArticles = []
  for (const list of cacheUserLists) {
    // Extract articles immutably
    const articles = [...list.TroveListArticles]
    // Extract list WITHOUT mutating original
    const { TroveListArticles, ...rest } = list
    const listWithoutArticles = { ...rest }
    newUserListArticles.push(articles)
    newUserLists.push(listWithoutArticles)
  }
  // Replace state immutably so watchers fire
  this.userListArticles = newUserListArticles
  this.userLists = newUserLists
}
//
function updateListCounts(cacheUserLists) {
  this.userLists = this.userLists.map((list, index) => ({
    ...list,
    TroveListArticleMinedStatusCounts:
      cacheUserLists[index].TroveListArticleMinedStatusCounts
  }))
}
// Whenever viewedArticles is updated update metadataTypeByMetadata to indicate Article link is enabled
function updMetadataTypeArticleLinks(viewedListId, viewedArticleId, idxViewedArticle, viewedArticleMetadata) {
  // Wait until metadata is loaded
  if (this.metadataTypeByMetadata.length === 0) {
    setTimeout(() =>
      this.updMetadataTypeArticleLinks(
        viewedListId,
        viewedArticleId,
        idxViewedArticle,
        viewedArticleMetadata
      ), 3000)
    return
  }
  // Build list of selected metadata entries
  const selected = viewedArticleMetadata
    .filter(m => m[2] === 'Sel')
    .map(m => ({
      MetadataType: m[0],
      MetadataValue: m[1],
      troveArticleId: Number(viewedArticleId),
      troveListId: Number(viewedListId),
      idxViewedArticle
    }))
    .sort(sortMetadataTypeAndValue)
  // Build a deep immutable copy of metadataTypeByMetadata
  let newMetadata = this.metadataTypeByMetadata.map(type => ({
    ...type,
    arrayMetadata: type.arrayMetadata.map(value => ({
      ...value,
      articleListArray: value.articleListArray.map(article => ({ ...article }))
    }))
  }))
  // Apply updates immutably
  for (const entry of selected) {
    const typeIdx = newMetadata.findIndex(
      t => t.metadataType === entry.MetadataType
    )
    if (typeIdx < 0) {
      console.log('ERROR Missing MetadataType', entry.MetadataType)
      continue
    }
    const valueIdx = newMetadata[typeIdx].arrayMetadata.findIndex(
      v => v.metadataValue === entry.MetadataValue
    )
    if (valueIdx < 0) {
      console.log('NOTIFY Missing MetadataValue', entry.MetadataValue)
      continue
    }
    const articleIdx = newMetadata[typeIdx]
      .arrayMetadata[valueIdx]
      .articleListArray
      .findIndex(a =>
        a.troveArticleId === entry.troveArticleId &&
        a.troveListId === entry.troveListId
      )
    if (articleIdx < 0) {
      console.log('NOTIFY Missing Article/List for MetadataValue', entry)
      continue
    }
    // 1. Update articleListArray immutably
    const newArticleListArray =
      newMetadata[typeIdx].arrayMetadata[valueIdx].articleListArray.map(
        (a, i) =>
          i === articleIdx
            ? { ...a, idxViewedArticle: entry.idxViewedArticle }
            : a
      )
    // 2. Update arrayMetadata immutably
    const newArrayMetadata =
      newMetadata[typeIdx].arrayMetadata.map((v, i) =>
        i === valueIdx
          ? { ...v, articleListArray: newArticleListArray }
          : v
      )
    // 3. Update metadataTypeByMetadata immutably
    newMetadata = newMetadata.map((t, i) =>
      i === typeIdx
        ? { ...t, arrayMetadata: newArrayMetadata }
        : t
    )
  }
  // Replace entire structure immutably
  this.metadataTypeByMetadata = newMetadata
}
  // function updMetadataTypeArticleLinks(viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata) {
  //   // Wait until Metadata has been loaded
  //   // console.log('App.vue updMetadataTypeArticleLinks: ', this.metadataTypeByMetadata.length, viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata);
  //   if (this.metadataTypeByMetadata.length == 0) {
  //     setTimeout(updMetadataTypeArticleLinks, 3000, viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata);
  //   }
  //   // Collect ViewedArticle Metadata
  //   var arrayViewedArticleMetadata = []
  //   viewedArticleMetadata.forEach((metadata) => {
  //     if (metadata[2] == 'Sel') {
  //       arrayViewedArticleMetadata.push({
  //         MetadataType: metadata[0],
  //         MetadataValue: metadata[1],
  //         troveArticleId: Number(viewedArticleId),
  //         troveListId: Number(viewedListId),
  //         idxViewedArticle: idxViewdArticle
  //       })
  //     }
  //   })
  //   // console.log('sseUserListWithArticles - Metadata 2 ', JSON.stringify(arrayViewedArticleMetadata))
  //   // Sort into order
  //   arrayViewedArticleMetadata.sort(sortMetadataTypeAndValue)
  //   // console.log('App.vue arrayViewedArticleMetadata: ', JSON.stringify(arrayViewedArticleMetadata));
  //   // Merge against metadataTypeByMetadata and set Article Link
  //   var idxType = 0
  //   var idxValue = 0
  //   var tempArray = []
  //   for (var idx = 0; idx < arrayViewedArticleMetadata.length; ++idx) {
  //     // Find Metadata Type Array
  //     var el = arrayViewedArticleMetadata[idx]
  //     // console.log ('updMetadataType - metadataTypeByMetadata - idxType ', JSON.stringify(this.metadataTypeByMetadata[idxType]))
  //     idxType = this.metadataTypeByMetadata.findIndex((type) => type.metadataType === el.MetadataType)
  //     // If less than then 0 have a New MetadataType not in the array - not possible so show error
  //     if (idxType < 0) {
  //       console.log('ERROR updMetadataType Missing MetaDataType ', el.MetadataType)
  //       break
  //     }
  //     // console.log('App.vue Match Type: ', el.MetadataType, this.metadataTypeByMetadata[idxType].metadataType);
  //     // Matched to MetadataType now match to MetadataValue
  //     tempArray = this.metadataTypeByMetadata[idxType].arrayMetadata
  //     // console.log ('updMetadataType - MetadataValue arrayMetadata ', el.MetadataValue, JSON.stringify(tempArray))
  //     idxValue = tempArray.findIndex((value) => value.metadataValue === el.MetadataValue)
  //     // If less than then 0 have a New MetadataValue not in the array - is possible due to asynchronous processing - log and ignore
  //     if (idxValue < 0) {
  //       console.log('NOTIFY updMetadataType Missing MetadataValue ', el.MetadataValue)
  //       break
  //     }
  //     // console.log('App.vue updMetadataType Match Value: ', el.MetadataValue, tempArray[idxValue].metadataValue);
  //     // Matched to MetadataType and MetadataValue now match List and Article
  //     tempArray = this.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray
  //     // console.log ('updMetadataType - articleListArray ', JSON.stringify(tempArray))
  //     var matched = false
  //     for (var jdx = 0; jdx < tempArray.length; ++jdx) {
  //       if ((tempArray[jdx].troveArticleId == el.troveArticleId) && (tempArray[jdx].troveListId == el.troveListId)) {
  //         // console.log ('updMetadataType - matched ', el)
  //         matched = true
  //         this.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray[jdx].idxViewedArticle = el.idxViewedArticle
  //         break
  //       }
  //     }
  //     // If not matched - is possible due to asynchronous processing - log and ignore
  //     if (!matched) {
  //       console.log('NOTIFY updMetadataType Missing Article/List for MetadataValue ', idx, el, idxType, idxValue, JSON.stringify(tempArray))
  //     }
  //   }
  // }
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
  function updateListItemStatusCount(listIdx, loadStatus, count, minedStatusCounts) {
      // console.log(`this updateListItemStatusCount %s %s`, listIdx, JSON.stringify(this.userLists[listIdx]))
      this.userLists[listIdx].TroveListLoadState = loadStatus
      this.userLists[listIdx].TroveListItemCount = count
      this.userLists[listIdx].TroveListArticleMinedStatusCounts = minedStatusCounts
      // console.log ("userData updateListItemStatusCount")
  }
//
  return { arrayMinedStatus,
    arrayMetadataTypes,
    troveDetails, 
    troveQueryTotal, 
    troveQueryArticleTotal, 
    nbrUserDupOrIgnoredArticles,
    userDuplicateListIds,
    loadedIndex,
    userLists, 
    userListsReady, 
    userReloadList,
    userReloadLists,
    viewedArticles, 
    metadataValueTotal, 
    metadataTypeByMetadata,
    // savedPerson,
    // storyPersonNew,
    storyEventsForPersons,
    clearStore,
    updateAllLists,
    updMetadataTypeArticleLinks,
    updateListItemStatusCount,
    updateListCounts
  }
})
