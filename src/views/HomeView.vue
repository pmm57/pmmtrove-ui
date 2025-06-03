<script setup>
import { ref } from 'vue'
import { watch } from 'vue'
import { useNavBarStore } from '@/stores/navbar'
import { useErrorsArrayStore } from '@/stores/errorsarray'
import { useUserDataStore } from '@/stores/userdata'
const navBarStore = useNavBarStore()
const errorsStore = useErrorsArrayStore()
const userData = useUserDataStore()
var loadingMsg = ref('Loading from TROVE.')
var loading = ref(false)
var inUserId = ''
var intervalLoading = null
var eventSourceUserCache = null

const emit = defineEmits(['setupUserSse'])

function handleMessage(e) {
    clearInterval(intervalLoading);
    var sseRetrieve = JSON.parse(e.data);
    console.log('User Cache Event: ', userData.troveDetails.troveUserId);
    emit('setupUserSse')
    if (sseRetrieve.cacheUser == userData.troveDetails.troveUserId) {
        // console.log (JSON.stringify(sseRetrieve))
        userData.troveQueryTotal = sseRetrieve.cacheTroveQueryTotal
        userData.troveQueryArticleTotal = sseRetrieve.cacheTroveQueryArticleTotal
        userData.userDuplicateListIds = sseRetrieve.cacheUserDuplicateListIds
        userData.userLists = sseRetrieve.cacheUserLists
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
function loadingTick() {
    intervalLoading = setInterval(tick, 500);
}
function tick() {
    loadingMsg.value += '.';
}
// Astnch method in App.vue will set this
watch(
    () => userData.userLists,
    (userLists) => {
        loading.value = false;
        clearInterval(intervalLoading);
        navBarStore.disableTroveLists = false;
    }
)
async function verifyUser() {
    errorsStore.arrayErrors = [];
    const url = import.meta.env.VITE_SERVER_URL + "/";
    console.log('Verify User-', inUserId)
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
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
        .catch(error => {
            errorsStore.arrayErrors.push({ msg: 'Server not available', param: '' });
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
        console.log('verifyUSer data ', data)
        userData.troveDetails = data; // There is a watch function in App.vue that will be triggered
        navBarStore.disableSearch = false;
        loadingTick();
        loading.value = true
    } else {
        // console.log (response);
        const errorData = await response.json();
        // console.log(errorData)
        errorsStore.arrayErrors = errorData
    }
}
function updTroveLists() {
    console.log('Reload User Trove Lists')
    loading.value = true
    loadingMsg.value = 'Loading from TROVE.'
    inUserId = userData.troveDetails.troveUserId
    // as this is a reload  reset the users cached data
    userData.clearStore
    verifyUser()
}
</script>

<template>
    <div v-if="userData.troveDetails.hasOwnProperty('troveUserId')" class="card">
        <p>This is a Trove Data Miner for user {{ userData.troveDetails.troveUserId }}</p>
        <p v-if="userData.userLists.length > 0">There are {{ userData.userLists.length }} Lists in Trove to manage</p>
        <div v-if="loading">
            {{ loadingMsg }}
        </div>
        <div v-else>
            <button @click="updTroveLists()" class="btn btn-primary">Refresh Your Trove Lists</button>
        </div>
    </div>
    <div v-else class="card col-sm-4 text-center">
        <label for="UserId" class="form-label h2">Trove User Id</label>
        <input v-model="inUserId" @keyup.enter="verifyUser()" class="form-control" id="UserId"
            placeholder="Enter Trove User Id" autofocus>
        <button @click="verifyUser()" id="UserID" class="btn btn-primary">Verify</button>
    </div>
</template>
