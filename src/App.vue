<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter();
import NavBar from '@/components/NavBar.vue'
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
var eventSourceUserCache = null
//
// This code handles the following SSE events from the server
//    sseUserLists - Sent by Init User on initial login and relogin
//    sseRemoveUserList
//    sseUserListsArticles - Sent by Init User to Cache Trove Lists and Linked Articles for Lists
//    sseUserListsCounts
//    sseMetaData
//    sseUserListWithArticles - Sent from dispArticle - LoadListArticles  - 
//    sseArticlePossibleDupArticle
//    sseReloadViewedArticle
//    sseUpdateListsArticleStatus
//    sseUpdateListStatusCount
//    sseServerError
//
function handleMessage(e) {
  const sseRetrieve = JSON.parse(e.data);
  var listIdx = 0
  var articleIdx = 0
  console.log('App.vue SSE tiggered: ', userData.troveDetails.troveUserId, sseRetrieve.sseUser, sseRetrieve.event);
  if (sseRetrieve.sseUser == userData.troveDetails.troveUserId) {
    switch (sseRetrieve.event) {
      case 'sseUserLists':
        // console.log(sseRetrieve.event);
        // console.log (JSON.stringify(sseRetrieve))
        userData.clearStore
        userData.troveQueryTotal = sseRetrieve.cacheTroveQueryTotal
        userData.troveQueryArticleTotal = sseRetrieve.cacheTroveQueryArticleTotal
        userData.userDuplicateListIds = sseRetrieve.cacheUserDuplicateListIds
        userData.userLists = sseRetrieve.cacheUserLists
        userData.viewedArticles = sseRetrieve.cacheViewedArticles // Only has data on resendUserData
        // console.log('sseUserLists - Viewed Articles ', JSON.stringify(sseRetrieve.cacheViewedArticles))

        // Collect All Viewed Article Metadata
        userData.userLists.forEach((listItem) => {
          listItem.TroveListArticles.forEach((listArticle) => {
            if (!listArticle.hasOwnProperty("TroveListArticleViewedIdx")) return
            if (listArticle.TroveListArticleViewedIdx < 0) return
            console.log('sseUserLists - Metadata 1 ', JSON.stringify(listArticle))
            const viewedArticle = userData.viewedArticles[listArticle.TroveListArticleViewedIdx]
            console.log('sseUserLists - Metadata 2 ', listItem.TroveListId,
              JSON.stringify(viewedArticle))
            if ((viewedArticle === undefined) || (!viewedArticle.hasOwnProperty("ViewedArticleMetadata"))) return
            const viewedArticleMetadata = userData.viewedArticles[listArticle.TroveListArticleViewedIdx].ViewedArticleMetadata
            if (viewedArticleMetadata.length < 1) return
            console.log('sseUserLists - Metadata 3 ', listItem.TroveListId,
              JSON.stringify(viewedArticleMetadata))
            updMetadataTypeArticleLinks(listItem.TroveListId, listArticle.TroveListArticleId, listArticle.TroveListArticleViewedIdx,
              viewedArticleMetadata)
          })
        })
        break
      case 'sseRemoveUserList':
        // console.log (JSON.stringify(sseRetrieve)) 
        userData.troveQueryTotal = sseRetrieve.cacheTroveQueryTotal
        userData.userLists = sseRetrieve.cacheUserLists
        // console.log('Remove List :', sseRetrieve.removedListId, navStore.listId);
        // Handle where this list is being viewed
        if (sseRetrieve.removedListId == navStore.listId) {
          navStore.listId = 0;
          navStore.listHref = "";
          navStore.listTabTitle = "List";
          router.push({ name: 'userTroveLists' });
        }
        break
      case 'sseUserListsArticles':
        // console.log(sseRetrieve.event);
        // console.log ('sseUserListsArticles ', JSON.stringify(sseRetrieve))
        userData.userListsReady = true
        if (sseRetrieve.updatedListIndex == -1) {
          userData.userLists = sseRetrieve.cacheUserLists
        } else {
          // Only One List
          // var tempList = userData.userLists[sseRetrieve.updatedListIndex];
          // var tempCache = sseRetrieve.cacheUserLists
          // // Check if List Information has changed
          // if (tempList.TroveListViewedDateText != tempCache.TroveListViewedDateText) {
          //   userData.userLists[sseRetrieve.updatedListIndex].TroveListArticleMinedStatusCounts = tempCache.TroveListArticleMinedStatusCounts;
          // }
          // Check which List articles have changed
          // console.log('sseUserListsArticles Update Index %s Have %s With %s', sseRetrieve.updatedListIndex, JSON.stringify(userData.userLists[sseRetrieve.updatedListIndex]), JSON.stringify(sseRetrieve.cacheUserLists))
          userData.userLists.splice(sseRetrieve.updatedListIndex, 1, sseRetrieve.cacheUserLists) // Triggers Reactivity
        }
        break
      case 'sseUserListsCounts':
        // console.log(sseRetrieve.event);
        // userData.userLists = sseRetrieve.cacheUserLists
        // userData.userLists[listIdx].TroveListArticleMinedStatusCounts = sseRetrieve.cacheTroveListArticleMinedStatusCounts
        // Update each lists status counts
        for (let index = 0; index < userData.userLists.length; index++) {
          userData.userLists[index].TroveListArticleMinedStatusCounts = sseRetrieve.cacheUserLists[index].TroveListArticleMinedStatusCounts;
        }
        break
      case 'sseMetaData':
        // console.log (JSON.stringify(sseRetrieve))
        userData.metadataValueTotal = sseRetrieve.cacheMetadataValueTotal
        userData.metadataTypeByMetadata = sseRetrieve.cacheMetadataTypeByMetadata
        navStore.disableMetadataList = false
        navStore.disablePersonList = false
        break
      case 'sseUserListWithArticles':
        // console.log(`userListsWithArticles %s`, JSON.stringify(sseRetrieve))
        // cacheListIdIdx - index into userData.userLists
        // cacheListArticleIdx - index into userData.lists[cacheListIdIdx].TroveListArticles
        // cacheViewedArticleIdx - Index of new or updated Viewed Article in userData.viewedArticles
        // cacheViewedArticle - new or updated 
        // Clear Edit Article
        navStore.articleId = 0
        navStore.articleHref = "";
        navStore.articleTabTitle = "";//
        // Updated User List Article Viewed Idx
        userData.userLists[sseRetrieve.cacheListIdIdx].TroveListArticles[sseRetrieve.cacheListArticleIdx].TroveListArticleViewedIdx = sseRetrieve.cacheViewedArticleIdx
        // Updated Viewed Articles
        if (sseRetrieve.cacheViewedArticleIdx > userData.viewedArticles.length) {
          userData.viewedArticles.push(sseRetrieve.cacheViewedArticle)
        } else {
          userData.viewedArticles[sseRetrieve.cacheViewedArticleIdx] = sseRetrieve.cacheViewedArticle
        }
        // Collect Viewed Article Metadata
        console.log('sseUserListWithArticles - Metadata 1 ', userData.userLists[sseRetrieve.cacheListIdIdx].TroveListId,
          JSON.stringify(sseRetrieve.cacheViewedArticle.ViewedArticleMetadata))
        updMetadataTypeArticleLinks(userData.userLists[sseRetrieve.cacheListIdIdx].TroveListId,
          userData.userLists[sseRetrieve.cacheListIdIdx].TroveListArticles[sseRetrieve.cacheListArticleIdx].TroveListArticleId,
          sseRetrieve.cacheViewedArticleIdx, sseRetrieve.cacheViewedArticle.ViewedArticleMetadata)
        break
      case 'sseArticlePossibleDupArticle':
        articleIdx = userData.viewedArticles.findIndex((item) => item.ViewedArticleId === sseRetrieve.viewedArticleId);
        // console.log ('sseArticlePossibleDupArticle', JSON.stringify(sseRetrieve))
        userData.viewedArticles[articleIdx].ViewedArticlePossibleDupArticle = sseRetrieve.cacheViewedArticlePossibleDupArticle
        break
      case 'sseReloadViewedArticle':
        console.log("sseReloadViewedArticle ", sseRetrieve)
        // Update List Article Status
        updListsArticleStatus(sseRetrieve.viewedListId, sseRetrieve.viewedArticleId, sseRetrieve.cacheViewedArticle.ViewedArticleMinedStatus, sseRetrieve.cacheViewedArticle.ViewedArticleMinedStatusText)
        // Update Viewed Article
        articleIdx = userData.viewedArticles.findIndex((item) => item.ViewedArticleId === sseRetrieve.viewedArticleId);
        if (articleIdx < 0) { // New Viewed Article
          console.log("sseReloadViewedArticle userData New Viewed Article", sseRetrieve.cacheViewedArticle)
          articleIdx = userData.viewedArticles.length;
        }
        userData.viewedArticles.splice(articleIdx, 1, sseRetrieve.cacheViewedArticle) // Triggers Reactivity
        // console.log ("sseReloadViewedArticle userData", articleIdx, userData.viewedArticles[articleIdx])
        updMetadataTypeArticleLinks(sseRetrieve.viewedArticleId, sseRetrieve.viewedListId, articleIdx, sseRetrieve.cacheViewedArticle.ViewedArticleMetadata)
        break
      case 'sseUpdateListsArticleStatus':
        updListsArticleStatus(sseRetrieve.listId, sseRetrieve.articleId, sseRetrieve.cacheListsArticleStatus, sseRetrieve.cacheListsArticleStatusText)
        // listIdx = userData.userLists.findIndex((item) => item.TroveListId === sseRetrieve.listId);
        // articleIdx = userData.userLists[listIdx].TroveListArticles.findIndex((item) => item.TroveListArticleId === sseRetrieve.articleId);
        // const aTroveListArticles = userData.userLists[listIdx].TroveListArticles[articleIdx]
        // aTroveListArticles.TroveListArticleMinedStatus = sseRetrieve.cacheListsArticleStatus
        // aTroveListArticles.TroveListArticleMinedStatustext = sseRetrieve.cacheListsArticleStatusText
        // userData.userLists[listIdx].TroveListArticles.splice(articleIdx, 1, aTroveListArticles) // Triggers Reactivity
        // console.log ('sseUpdateListsArticleStatus', listIdx, articleIdx, JSON.stringify(sseRetrieve))
        break
      case 'sseUpdateListStatusCount':
        // console.log (JSON.stringify(sseRetrieve))
        listIdx = userData.userLists.findIndex((item) => item.TroveListId === sseRetrieve.listId);
        userData.userLists[listIdx].TroveListItemCount = sseRetrieve.cacheTroveListItemCount
        userData.userLists[listIdx].TroveListArticleMinedStatusCounts = sseRetrieve.cacheTroveListArticleMinedStatusCounts
        break
      case 'sseServerError':
        errorsStore.arrayErrors.push({ msg: sseRetrieve.errorResponse.statusText, param: sseRetrieve.errorResponse });
        break
      default:
        console.log('App.vue SSE tiggered unknown action: ', sseRetrieve.event);
    }
  }
}
// Whenever an Article Status is change - updated the list screen
function updListsArticleStatus(listId, articleId, articleStatus, articleStatusText) {
  const listIdx = userData.userLists.findIndex((item) => item.TroveListId === listId);
  const articleIdx = userData.userLists[listIdx].TroveListArticles.findIndex((item) => item.TroveListArticleId === articleId);
  const aTroveListArticles = userData.userLists[listIdx].TroveListArticles[articleIdx]
  aTroveListArticles.TroveListArticleMinedStatus = articleStatus
  aTroveListArticles.TroveListArticleMinedStatustext = articleStatusText
  userData.userLists[listIdx].TroveListArticles.splice(articleIdx, 1, aTroveListArticles) // Triggers Reactivity

}
// Whenever viewedArticles is updated update metadataTypeByMetadata to indicate Article link is enabled
function updMetadataTypeArticleLinks(viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata) {
  // Wait until Metadata has been loaded
  // console.log('App.vue updMetadataTypeArticleLinks: ', userData.metadataTypeByMetadata.length, viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata);
  if (userData.metadataTypeByMetadata.length == 0) {
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
  console.log('sseUserListWithArticles - Metadata 2 ', JSON.stringify(arrayViewedArticleMetadata))
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
    // console.log ('updMetadataType - metadataTypeByMetadata - idxType ', JSON.stringify(userData.metadataTypeByMetadata[idxType]))
    idxType = userData.metadataTypeByMetadata.findIndex((type) => type.metadataType === el.MetadataType)
    // If less than then 0 have a New MetadataType not in the array - not possible so show error
    if (idxType < 0) {
      console.log('ERROR updMetadataType Missing MetaDataType ', el.MetadataType)
      break
    }
    // console.log('App.vue Match Type: ', el.MetadataType, userData.metadataTypeByMetadata[idxType].metadataType);
    // Matched to MetadataType now match to MetadataValue
    tempArray = userData.metadataTypeByMetadata[idxType].arrayMetadata
    // console.log ('updMetadataType - MetadataValue arrayMetadata ', el.MetadataValue, JSON.stringify(tempArray))
    idxValue = tempArray.findIndex((value) => value.metadataValue === el.MetadataValue)
    // If less than then 0 have a New MetadataValue not in the array - is possible due to asynchronous processing - log and ignore
    if (idxValue < 0) {
      console.log('NOTIFY updMetadataType Missing MetadataValue ', el.MetadataValue)
      break
    }
    // console.log('App.vue updMetadataType Match Value: ', el.MetadataValue, tempArray[idxValue].metadataValue);
    // Matched to MetadataType and MetadataValue now match List and Article
    tempArray = userData.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray
    // console.log ('updMetadataType - articleListArray ', JSON.stringify(tempArray))
    var matched = false
    for (var jdx = 0; jdx < tempArray.length; ++jdx) {
      if ((tempArray[jdx].troveArticleId == el.troveArticleId) && (tempArray[jdx].troveListId == el.troveListId)) {
        // console.log ('updMetadataType - matched ', el)
        matched = true
        userData.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray[jdx].idxViewedArticle = el.idxViewedArticle
        break
      }
    }
    // If not matched - is possible due to asynchronous processing - log and ignore
    if (!matched) {
      console.log('NOTIFY updMetadataType Missing Article/List for MetadataValue ', idx, el, idxType, idxValue, JSON.stringify(tempArray))
    }
  }
}
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
function handleError(e) {
  if (e.target.readyState == EventSource.CLOSED) {
    console.log("Disconnected sourceUserCache");
  }
  else if (e.target.readyState == EventSource.CONNECTING) {
    console.log("Connecting sourceUserCache...");
  }
}
function setupUserSse() {
  if (!!window.EventSource) {
    var streamId = 'userSSE' + userData.troveDetails.troveUserId
    var streamName = import.meta.env.VITE_SERVER_URL + '/streamTrove/userSSE/' + streamId;
    eventSourceUserCache = new EventSource(streamName, { withCredentials: true });
    // console.log('Appvue start ' + streamName);
    eventSourceUserCache.addEventListener(streamId, (e) => handleMessage(e), false);
    eventSourceUserCache.addEventListener('error', (e) => handleError(e), false);
  } else {
    errorsStore.arrayErrors.push({ msg: `Your browser doesn't support SSE`, param: '' });
    console.log("Your browser doesn't support SSE")
  }
}
//
// When HomeView has verified a User Id it is saved and triggers this watcher
//
watch(
  () => userData.troveDetails.troveUserId,
  (troveUserId) => {
    setupUserSse()
  }
)
//
// Verify that the server is available
//
async function verifyServerUp() {
  const url = import.meta.env.VITE_SERVER_URL + "/check";
  console.log(`App.vue verifyServerUp URL:%s`, url);
  const options = {
    method: "get",
    mode: "cors",
    credentials: "include", // to send HTTP only cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  const request = new Request(url, options);
  const fetchPromise = fetch(request);
  const response = await fetchPromise
    .catch(error => {
      errorsStore.arrayErrors.push({ msg: 'Server not available', param: '' });
      console.log('verifyServerUp: Error in event handler::', error);
      return
    });
  // console.log (response);
  // iterate over all headers
  // for (let [key, value] of response.headers) {
  // console.log(`${key} = ${value}`);
  // }
  console.log("App.vue verifyServerUp: response.status =", response.status);
  if (response.status == 200) {
    const data = await response.json();
    userData.arrayMinedStatus = data.arrayMinedStatus
    userData.arrayMetadataTypes = data.arrayMetadataTypes
    // console.log ('data ', data)
  } else {
    errorsStore.arrayErrors = response.error
  }
}
//
console.log(`Host URL:%s`, import.meta.env.VITE_SERVER_URL)
verifyServerUp()
</script>

<template>
  <main>
    <NavBar />
    <div id="positionModals"></div>
    <div class="container-fluid w-auto">
      <!-- <RouterView @setup-user-sse="setupUserSse"/> -->
      <RouterView />
    </div>
  </main>
</template>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

/* Use Orang Badge */

:global(.custom-badge) {
  background-color: #ff9900;
}

/* Tooltip container */
:global(.metadataPopover) {
  position: relative;
  display: inline-block;
}

/* Tooltip text */
:global(.metadataPopover .tooltiptext) {
  visibility: hidden;
  width: 200px;
  background-color: #fff;
  color: black;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;
  border-style: solid;
  border-color: lightgrey;
  /* Position the tooltip text - see examples below! */
  position: absolute;
  z-index: 1;
  bottom: 100%;
  left: 50%;
  margin-left: -100px;
}

/* Show the tooltip text when you mouse over the tooltip container */
:global(.metadataPopover:hover span) {
  visibility: visible;
}

/* Modal positiongin */
:global(.modal) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
