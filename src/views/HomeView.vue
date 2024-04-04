<script setup>
    import { ref } from 'vue'
    import { watch } from 'vue'
    import { useNavBarStore } from '@/stores/navbar'
    import { useErrorsArrayStore } from '@/stores/errorsarray'
    import { useUserDataStore } from '@/stores/userdata'
    const navBarStore = useNavBarStore()
    const errorsStore = useErrorsArrayStore()
    const userDataStore = useUserDataStore()
    var loadingMsg = ref('Loading from TROVE.')
    var loading = ref(false)
    var inUserId = ''
    var intervalLoading = null
    var eventSourceUserCache = null

    const emit = defineEmits (['setupUserSse'])

    function handleMessage(e) {
        clearInterval(intervalLoading);
        var sseRetrieve = JSON.parse(e.data);
        console.log('User Cache Event: ', userDataStore.troveUserId);
        emit ('setupUserSse')
        if (sseRetrieve.cacheUser == userDataStore.troveUserId) {
            // console.log (JSON.stringify(sseRetrieve))
            userDataStore.troveQueryTotal = sseRetrieve.cacheTroveQueryTotal
            userDataStore.troveQueryArticleTotal = sseRetrieve.cacheTroveQueryArticleTotal
            userDataStore.userDuplicateListIds = sseRetrieve.cacheUserDuplicateListIds
            userDataStore.userLists = sseRetrieve.cacheUserLists
            loading.value = false
            navBarStore.disableTroveLists = false
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
    function  loadUserLists() {
        if (!!window.EventSource) {
            loadingTick();
            var streamId = 'user' + userDataStore.troveUserId
            var streamName = 'https://localhost:3000/streamTrove/userCache/' + streamId;
            eventSourceUserCache = new EventSource(streamName, { withCredentials: true });
            console.log('start ' + streamName);
            eventSourceUserCache.addEventListener(streamId, (e) => handleMessage(e), false);
            eventSourceUserCache.addEventListener('error', (e) => handleError(e), false);
        } else {
            errorsStore.errors.push({msg : `Your browser doesn't support SSE`, param : ''});
            clearInterval(intervalLoading);
            console.log("Your browser doesn't support SSE")
        }
    }
    function loadingTick() {
        intervalLoading = setInterval(tick,500);
    }
    function tick() {
        loadingMsg.value += '.';
    }
    // Astnch method in App.vue will set this
    watch (
        () => userDataStore.userLists,
        (userLists) => {
            loading.value = false;
            clearInterval(intervalLoading);
            navBarStore.disableTroveLists = false
        }
    )
    async function verifyUser() {
        // if this is a reload then inUserId wont equal userDataStore.troveUserId
        // so reset the users cached data
        if (inUserId != userDataStore.troveUserId) {
            userDataStore.clearStore
        }
        errorsStore.errors = [];
        const url = "https://localhost:3000/";
        console.log('Verify User-', inUserId)
        const options = {                   
            method: "post",
            mode: "cors", 
            credentials : "include", // to send HTTP only cookies
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            //make sure to serialize your JSON body
            body: JSON.stringify({
                UserId: inUserId
            })
        };
        const request = new Request(url, options);
        const fetchPromise = fetch(request);
        const response = await fetchPromise
            .catch (error => {
                errorsStore.errors.push({msg : 'Server not available', param : ''});
                console.log('verifyUser: Error in event handler:', error);
                return
            });
        // console.log (response);
        // iterate over all headers
        // for (let [key, value] of response.headers) {
        // console.log(`${key} = ${value}`);
        // }
        if (response.status == 200) {
            const data = await response.json();
            console.log ('data ', data)
            userDataStore.troveUserId = inUserId // There is a watch function in App.vue that will be triggered
            loadingTick();
            loading.value = true
            // loadUserLists()
        } else {
            errorsStore.errors = data
        }             
    }
    function updTroveLists () {
                console.log('Reload User Trove Lists')
                loading.value = true
                loadingMsg.value = 'Loading from TROVE.'
                inUserId = userDataStore.troveUserId
                verifyUser()
            }
</script>

<template>
  <div v-show="errorsStore.errors.length > 0" class="card col-sm-4 text-center" >
      <ul>
        <li v-for="error in errorsStore.errors">
          {{ error.msg + "-" +  error.param }}
        </li>
      </ul>
  </div>
  <div v-if="userDataStore.troveUserId === ''" class="card col-sm-4 text-center">
      <label for="UserId" class="form-label h2">Trove User Id</label>
      <input v-model="inUserId" class="form-control" id="UserId" placeholder="Enter Trove User Id" autofocus>
      <button @click="verifyUser()" id="UserID" class="btn btn-primary">Verify</button>
  </div>
  <div v-else class="card">
      <p>This is a Trove Data Miner for user {{ userDataStore.troveUserId }}</p>
      <div v-if="loading">
          {{ loadingMsg }}
      </div>
      <div v-else>
          <button @click="updTroveLists()" class="btn btn-primary">Refresh Your Trove Lists</button>
      </div>
  </div> 
</template>
