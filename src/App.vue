<script setup>
  import { watch } from 'vue'
  import NavBar from '@/components/NavBar.vue'
  import { useErrorsArrayStore } from '@/stores/errorsarray'
  const errorsStore = useErrorsArrayStore()
  import { useUserDataStore } from '@/stores/userdata'
  const userData = useUserDataStore()
  import { useNavBarStore } from '@/stores/navbar'
  const navBarStore = useNavBarStore()
  var eventSourceUserCache = null
//
// This code handles the following SSE events from the server
//    sseUserLists
//    sseUserListsCounts
//    sseUserListsArticles
//    sseMetaData
//
  function handleMessage(e) {
      var sseRetrieve = JSON.parse(e.data);
      var listIdx = 0
      console.log('App.vue SSE tiggered: ', userData.troveUserId, sseRetrieve.sseUser, sseRetrieve.event);
      if (sseRetrieve.sseUser == userData.troveUserId) {
        switch (sseRetrieve.event) {
          case 'sseUserLists':
            console.log(sseRetrieve.event);
            // console.log (JSON.stringify(sseRetrieve))
            userData.clearStore
            userData.troveQueryTotal = sseRetrieve.cacheTroveQueryTotal
            userData.troveQueryArticleTotal = sseRetrieve.cacheTroveQueryArticleTotal
            userData.userDuplicateListIds = sseRetrieve.cacheUserDuplicateListIds
            userData.userLists = sseRetrieve.cacheUserLists
            break
          case 'sseUserListsArticles':
            // console.log(sseRetrieve.event);
            // console.log (JSON.stringify(sseRetrieve))
            userData.userListsReady = true
            break
          case 'sseUserListsCounts':
            // console.log(sseRetrieve.event);
            userData.userLists = sseRetrieve.cacheUserLists
            break
          case 'sseMetaData':
            // console.log (JSON.stringify(sseRetrieve))
            userData.metadataValueTotal = sseRetrieve.cacheMetadataValueTotal
            userData.metadataTypeByMetadata = sseRetrieve.cacheMetadataTypeByMetadata
            navBarStore.disableMetadataList = false
            break
          case 'sseUserListWithArticles':
            // console.log (JSON.stringify(sseRetrieve))
            listIdx = userData.userLists.findIndex((item) => item.TroveListId === sseRetrieve.listId);
            userData.userLists[listIdx] = sseRetrieve.cacheUserListWithArticles
            userData.viewedArticles = sseRetrieve.cacheViewedArticles
            // navBarStore.disableMetadataList = false
            break
          default:
            console.log('App.vue SSE tiggered unknown action: ', sseRetrieve.event);
        }
      }
  }
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
          var streamId = 'userSSE' + userData.troveUserId
          var streamName = 'https://localhost:3000/streamTrove/userSSE/' + streamId;
          eventSourceUserCache = new EventSource(streamName, { withCredentials: true });
          console.log('Appvue start ' + streamName);
          eventSourceUserCache.addEventListener(streamId, (e) => handleMessage(e), false);
          eventSourceUserCache.addEventListener('error', (e) => handleError(e), false);
      } else {
          errorsStore.errors.push({msg : `Your browser doesn't support SSE`, param : ''});
          console.log("Your browser doesn't support SSE")
      }
  }
  //
  // When HomeView has verified a User Id it is saved and triggers this watcher
  //
  watch (
    () => userData.troveUserId,
    (troveUserId) => {
      setupUserSse()
    }
  )
  //
  // Verify that the server is available
  //
  async function verifyServerUp () {
    const url = "https://localhost:3000/check";
    const options = {                
              method: "get",
              mode: "cors", 
              credentials : "include", // to send HTTP only cookies
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              }
          };
    const request = new Request(url, options);
    const fetchPromise = fetch(request);
    const response = await fetchPromise
        .catch (error => {
            errorsStore.errors.push({msg : 'Server not available', param : ''});
            console.log('verifyServerUp: Error in event handler::', error);
            return
        });
    // console.log (response);
    // iterate over all headers
    // for (let [key, value] of response.headers) {
    // console.log(`${key} = ${value}`);
    // }
    console.log("verifyServerUp: response.status =", response.status);
    if (response.status == 200) {
      const data = await response.json();
      console.log ('data ', data)
    } else {
        errorsStore.errors = response.error
    }             
  }
  //
  verifyServerUp ()
</script>

<template>
  <main>
    <NavBar />
    <div class="container-fluid w-auto"> 
      <!-- <RouterView @setup-user-sse="setupUserSse"/> -->
      <RouterView />
    </div>
</main>
</template>

<style scoped>
</style>
