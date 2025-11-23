<script setup>
import { watch, reactive } from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter();
import NavBar from '@/components/NavBar.vue'
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { getObjDiff } from '@/components/CompareObject.js';
var eventSourceUserCache = null
//
// This code handles the following SSE events from the server
//    sseUserLists - Sent by Init User on initial login and relogin
//    sseRemoveUserList
//    sseUserListArticles - Sent by Init User to Cache Trove Lists and Linked Articles for Lists
//    sseUserListsCounts
//    sseMetaData
//    sseUserViewedArticle - Sent from dispArticle - LoadListArticles  - 
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
        userData.nbrUserIgnoredArticles = sseRetrieve.cacheNbrIgnored
        // In UI have split Articles from the List - so do split
        userData.updateAllLists(sseRetrieve.cacheUserLists)
        if (sseRetrieve.cacheViewedArticles.length > 0) {
          userData.viewedArticles = sseRetrieve.cacheViewedArticles // Only has data on resendUserData
          // console.log('sseUserLists - Viewed Articles ', JSON.stringify(sseRetrieve.cacheViewedArticles))
        }
        break
      case 'sseRemoveUserList':
        // console.log (JSON.stringify(sseRetrieve)) 
        userData.troveQueryTotal = sseRetrieve.cacheTroveQueryTotal
        // In UI have split Articles from the List - so do split
        splitListArticles(sseRetrieve.cacheUserLists)
        // console.log('Remove List :', sseRetrieve.removedListId, navStore.listId);
        // Handle where this list is being viewed
        if (sseRetrieve.removedListId == navStore.listId) {
          navStore.listId = 0;
          navStore.listHref = "";
          navStore.listTabTitle = "List";
          router.push({ name: 'userTroveLists' });
        }
        break
      case 'sseUserListArticles':
        // console.log(sseRetrieve.event);
        // console.log('*** sseUserListsArticles ', JSON.stringify(sseRetrieve))
        userData.userListsReady = true
        // Only One List
        userData.loadedIndex = sseRetrieve.updatedListIndex
        userData.nbrUserIgnoredArticles = sseRetrieve.updateNbrIgnored
        const cacheListArticles = sseRetrieve.cacheUserLists.TroveListArticles
        // Update List Details
        delete sseRetrieve.cacheUserLists.TroveListArticles
        // console.log('sseUserListsArticles Update List Index %s Load State %s %s',
        //   sseRetrieve.updatedListIndex, userData.userLists[sseRetrieve.updatedListIndex].TroveListLoadState, sseRetrieve.cacheUserLists.TroveListLoadState)
        userData.userLists.splice(sseRetrieve.updatedListIndex, 1, sseRetrieve.cacheUserLists) // Triggers Reactivity
        // Update List Articles
        // Find which is the first array element to change and mod from there
        // cacheListArticles is the sor so if it is shorter truncate userListArticles to the same length
        if (userData.userListArticles[sseRetrieve.updatedListIndex].length > 0) {
          var targetList = userData.userListArticles[sseRetrieve.updatedListIndex]
          if (cacheListArticles.length < targetList.length) {
            // Trim userListArticles
            targetList.splice(cacheListArticles.length - 1)
          }
          // console.log('sseUserListsArticles Update List Count %s Articles %s Cache %s', userData.userLists[sseRetrieve.updatedListIndex].TroveListItemCount,
          //   userData.userListArticles[sseRetrieve.updatedListIndex].length, cacheListArticles.length)
          var idxChange = -1;
          for (let i = 0; i < cacheListArticles.length; i++) {
            const obj1 = cacheListArticles[i] || {};
            const obj2 = targetList[i] || {};
            const diffProps = getObjDiff(obj1, obj2);
            // console.log('sseUserListsArticles %s Cache %s Old %s', i, JSON.stringify(obj1), JSON.stringify(obj2))
            if (diffProps.length > 0) { // Article has changed
              console.log('sseUserListsArticles %s Diff %s - %s', i, diffProps.length, diffProps)
              idxChange = i;
              break;
            };
          };
          // Slice the tail from cacheListArticles starting at idxChange
          const newTail = cacheListArticles.slice(idxChange)
          // Replace the tail in targetList starting at idxChange
          targetList.splice(idxChange, targetList.length - idxChange, ...newTail)
        } else {
          userData.userListArticles[sseRetrieve.updatedListIndex] = cacheListArticles;
          // console.log('sseUserListsArticles Update List Articles %s', userData.userListArticles.length, userData.userListArticles[sseRetrieve.updatedListIndex].length)
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
      case 'sseUserViewedArticle':
        // console.log(`userListsWithArticles %s`, JSON.stringify(sseRetrieve))
        // cacheListIdIdx - index into userData.userLists
        // cacheListArticleIdx - index into userData.userListArticles[cacheListIdIdx]
        // cacheViewedArticleIdx - Index of new or updated Viewed Article in userData.viewedArticles
        // cacheViewedArticle - new or updated 
        // Clear Edit Article
        navStore.articleId = 0
        navStore.articleHref = "";
        navStore.articleTabTitle = "";
        //
        console.log(`sseUserViewedArticle ListIdx %s ListArticleIdx %s ViewedIdx %s`, sseRetrieve.cacheListIdIdx, sseRetrieve.cacheListArticleIdx, sseRetrieve.cacheViewedArticleIdx)
        //
        // Updated User List Article with Viewed Info
        updListArticle(sseRetrieve.cacheListIdIdx, sseRetrieve.cacheListArticleIdx, sseRetrieve.cacheViewedArticleIdx,
          sseRetrieve.cacheViewedArticle.ViewedArticleMinedStatus, sseRetrieve.cacheViewedArticle.ViewedArticleMinedStatusText)
        //
        // Updated Viewed Articles
        // if (sseRetrieve.cacheViewedArticleIdx > userData.viewedArticles.length) {
        //   userData.viewedArticles.push(sseRetrieve.cacheViewedArticle)
        // } else {
        userData.viewedArticles[sseRetrieve.cacheViewedArticleIdx] = sseRetrieve.cacheViewedArticle
        // }
        // Collect Viewed Article Metadata
        // console.log('sseUserViewedArticle - Metadata 1 ', userData.userLists[sseRetrieve.cacheListIdIdx].TroveListId,
        //   JSON.stringify(sseRetrieve.cacheViewedArticle.ViewedArticleMetadata))
        userData.updMetadataTypeArticleLinks(userData.userLists[sseRetrieve.cacheListIdIdx].TroveListId,
          userData.userListArticles[sseRetrieve.cacheListIdIdx][sseRetrieve.cacheListArticleIdx].TroveListArticleId,
          sseRetrieve.cacheViewedArticleIdx, sseRetrieve.cacheViewedArticle.ViewedArticleMetadata)
        break
      case 'sseArticlePossibleDupArticle':
        articleIdx = userData.viewedArticles.findIndex((item) => item.ViewedArticleId === sseRetrieve.viewedArticleId);
        // console.log ('sseArticlePossibleDupArticle', JSON.stringify(sseRetrieve))
        userData.viewedArticles[articleIdx].ViewedArticlePossibleDupArticle = sseRetrieve.cacheViewedArticlePossibleDupArticle
        break
      case 'sseReloadViewedArticle':
        // console.log("sseReloadViewedArticle ", JSON.stringify(sseRetrieve))
        // Update List Article Status
        updAListArticle(sseRetrieve.viewedListId, sseRetrieve.viewedArticleId, sseRetrieve.cacheViewedArticle.ViewedArticleMinedStatus, sseRetrieve.cacheViewedArticle.ViewedArticleMinedStatusText)
        // Update Viewed Article
        articleIdx = userData.viewedArticles.findIndex((item) => item.ViewedArticleId === sseRetrieve.viewedArticleId);
        if (articleIdx < 0) { // New Viewed Article
          // console.log("sseReloadViewedArticle userData New Viewed Article", sseRetrieve.cacheViewedArticle)
          articleIdx = userData.viewedArticles.length;
        }
        userData.viewedArticles.splice(articleIdx, 1, reactive(sseRetrieve.cacheViewedArticle)) // Triggers Reactivity
        // console.log ("sseReloadViewedArticle userData", articleIdx, userData.viewedArticles[articleIdx])
        userData.updMetadataTypeArticleLinks(sseRetrieve.viewedListId, sseRetrieve.viewedArticleId, articleIdx, sseRetrieve.cacheViewedArticle.ViewedArticleMetadata)
        break
      case 'sseUpdateListsArticleStatus':
        updAListArticle(sseRetrieve.listId, sseRetrieve.articleId, sseRetrieve.cacheListsArticleStatus, sseRetrieve.cacheListsArticleStatusText)
        break
      case 'sseUpdateListStatusCount':
        // console.log(`App sseUpdateListStatusCount %s`, JSON.stringify(sseRetrieve))
        listIdx = userData.userLists.findIndex((item) => item.TroveListId === sseRetrieve.listId);
        if (listIdx > -1) {
          userData.updateListItemStatusCount(listIdx, sseRetrieve.cacheTroveListLoadState, sseRetrieve.cacheTroveListItemCount, sseRetrieve.cacheTroveListArticleMinedStatusCounts)
        }
        break
      case 'sseServerError':
        errorsStore.arrayErrors.push({ msg: sseRetrieve.errorResponse.statusText, param: sseRetrieve.errorResponse });
        break
      default:
        console.log('App.vue SSE tiggered unknown action: ', sseRetrieve.event);
    }
  }
}
// Split List and Aticles
function splitListArticles(cacheUserLists) {
  userData.userListArticles = []
  userData.userLists = []
  for (const list of cacheUserLists) {
    userData.userListArticles.push(list.TroveListArticles);
    delete list.TroveListArticles
    userData.userLists.push(list)
  }
}
// Whenever an Article Status is change - updated the list screen
function updAListArticle(listId, articleId, articleStatus, articleStatusText) {
  // console.log('updListsArticleStatus ', listId, articleId, articleStatus)
  const listIdx = userData.userLists.findIndex((item) => item.TroveListId === listId);
  const articleIdx = userData.userListArticles[listIdx].findIndex((item) => item.TroveListArticleId === articleId);
  const viewedIdx = userData.userListArticles[listIdx][articleIdx].TroveListArticleViewedIdx
  updListArticle(listIdx, articleIdx, viewedIdx, articleStatus, articleStatusText)
}
function updListArticle(listIdx, articleIdx, viewedIdx, articleStatus, articleStatusText) {
  const aTroveListArticle = userData.userListArticles[listIdx][articleIdx]
  aTroveListArticle.TroveListArticleViewedIdx = viewedIdx
  aTroveListArticle.TroveListArticleMinedStatus = articleStatus
  aTroveListArticle.TroveListArticleMinedStatustext = articleStatusText
  userData.userListArticles[listIdx].splice(articleIdx, 1, aTroveListArticle) // Triggers Reactivity
}
// Whenever viewedArticles is updated update metadataTypeByMetadata to indicate Article link is enabled
// function updMetadataTypeArticleLinks(viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata) {
//   // Wait until Metadata has been loaded
//   // console.log('App.vue updMetadataTypeArticleLinks: ', userData.metadataTypeByMetadata.length, viewedListId, viewedArticleId, idxViewdArticle, viewedArticleMetadata);
//   if (userData.metadataTypeByMetadata.length == 0) {
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
//   // console.log('sseUserViewedArticle - Metadata 2 ', JSON.stringify(arrayViewedArticleMetadata))
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
//     // console.log ('updMetadataType - metadataTypeByMetadata - idxType ', JSON.stringify(userData.metadataTypeByMetadata[idxType]))
//     idxType = userData.metadataTypeByMetadata.findIndex((type) => type.metadataType === el.MetadataType)
//     // If less than then 0 have a New MetadataType not in the array - not possible so show error
//     if (idxType < 0) {
//       console.log('ERROR updMetadataType Missing MetaDataType ', el.MetadataType)
//       break
//     }
//     // console.log('App.vue Match Type: ', el.MetadataType, userData.metadataTypeByMetadata[idxType].metadataType);
//     // Matched to MetadataType now match to MetadataValue
//     tempArray = userData.metadataTypeByMetadata[idxType].arrayMetadata
//     // console.log ('updMetadataType - MetadataValue arrayMetadata ', el.MetadataValue, JSON.stringify(tempArray))
//     idxValue = tempArray.findIndex((value) => value.metadataValue === el.MetadataValue)
//     // If less than then 0 have a New MetadataValue not in the array - is possible due to asynchronous processing - log and ignore
//     if (idxValue < 0) {
//       console.log('NOTIFY updMetadataType Missing MetadataValue ', el.MetadataValue)
//       break
//     }
//     // console.log('App.vue updMetadataType Match Value: ', el.MetadataValue, tempArray[idxValue].metadataValue);
//     // Matched to MetadataType and MetadataValue now match List and Article
//     tempArray = userData.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray
//     // console.log ('updMetadataType - articleListArray ', JSON.stringify(tempArray))
//     var matched = false
//     for (var jdx = 0; jdx < tempArray.length; ++jdx) {
//       if ((tempArray[jdx].troveArticleId == el.troveArticleId) && (tempArray[jdx].troveListId == el.troveListId)) {
//         // console.log ('updMetadataType - matched ', el)
//         matched = true
//         userData.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray[jdx].idxViewedArticle = el.idxViewedArticle
//         break
//       }
//     }
//     // If not matched - is possible due to asynchronous processing - log and ignore
//     if (!matched) {
//       console.log('NOTIFY updMetadataType Missing Article/List for MetadataValue ', idx, el, idxType, idxValue, JSON.stringify(tempArray))
//     }
//   }
// }
// //
// function sortMetadataTypeAndValue(a, b) {
//   var comparison = 0;
//   if (a.MetadataType === b.MetadataType) {
//     if (a.Metadata > b.Metadata) {
//       comparison = 1;
//     } else if (a.Metadata < b.Metadata) {
//       comparison = -1;
//     }
//     return comparison
//   }
//   if (a.MetadataType > b.MetadataType) {
//     comparison = 1;
//   } else if (a.MetadataType < b.MetadataType) {
//     comparison = -1;
//   }
//   return comparison;
// }
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
  // console.log(`App.vue verifyServerUp URL:%s`, url);
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
// console.log(`Host URL:%s`, import.meta.env.VITE_SERVER_URL)
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

:global(.snip-block) {
  background-color: #caf8f6;
  border-left: 3px solid #b58900;
  padding: 6px;
  margin: 6px 0;
  cursor: pointer;
}

:global(.snip-handle) {
  display: inline-block;
  padding: 2px 6px;
  background-color: #eee;
  border: 1px solid #aaa;
  cursor: grab;
  user-select: none;
  font-size: 14px;
}

:global(.snip-toolbar) {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
  padding: 4px 8px;
  background: linear-gradient(to right, #f0f0f0, #e0e0e0);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', sans-serif;
}

:global(.snip-toolbar button) {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background-color: #0078d4;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:global(.snip-toolbar button:hover) {
  background-color: #005a9e;
}

:global(.snip-toolbar button:active) {
  background-color: #004578;
}
</style>
