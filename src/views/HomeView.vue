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

function loadingTick() {
    intervalLoading = setInterval(tick, 500);
}
function tick() {
    loadingMsg.value += '.';
}
// Asynch method in App.vue will set this
watch(
    () => userData.userListsReady,
    () => {
        loading.value = false;
        clearInterval(intervalLoading);
        navBarStore.disableTroveLists = false;
        // If this was a refresh - but the full load never completed
        // Indicated by last list that is not a duplicate having a count > 0 but no artices in its Article Array
        //  force a refresh
        if (userData.userReloadLists) {
            userData.userReloadLists = false;
            for (let i = (userData.userLists.length - 1); i >= 0; --i) {
                console.log(`HomeView Reload: Duplicate Ids %s, Check Id %s, Count %s, Length %s`,
                    userData.userDuplicateListIds, userLists[i].TroveListId, userData.userListArticles[i].TroveListItemCount, userData.userListArticles[i].length)
                if (userData.userDuplicateListIds.includes(Number(userData.userLists[i].TroveListId))) {
                    console.log(`HomeView Reload: Matched Duplicate ID %s`, userData.userLists[i].TroveListId)
                } else {
                    console.log(`HomeView Reload: Check Array Length %s %s`, userData.userLists[i].TroveListId, userData.userListArticles[i].length)
                    if (userData.userListArticles[i].length == 0) {
                        updTroveLists()
                    }
                    break
                }
            }
        }
    }
)
async function verifyUser(refresh) {
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
            UserId: inUserId,
            refresh: refresh
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
        console.log('verifyUser data ', data)
        userData.troveDetails = data.troveDetails; // There is a watch function in App.vue that will be triggered
        navBarStore.disableSearch = false;
        if (!data.newLogon) {
            // Previous cookie existed on server
            // Trigger setup of sse
            userData.userListsReady = true;
            // Doing a reload
            userData.userReloadLists = true;
        }
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
    console.log('Refresh User Trove Lists')
    loading.value = true
    loadingMsg.value = 'Loading from TROVE.'
    inUserId = userData.troveDetails.troveUserId
    // Doing a refresh not a reload
    userData.userReloadLists = false;
    userData.userListsReady = false;
    // as this is a reload  reset the users cached data
    userData.clearStore
    verifyUser(true)
}
</script>

<template>
    <div v-if="userData.troveDetails.hasOwnProperty('troveUserId')" class="card">
        <p>This is a Trove Data Miner for user {{ userData.troveDetails.troveUserId }}</p>
        <p v-if="userData.userLists.length > 0">There are {{ userData.troveQueryTotal }} Lists in Trove.</p>
        <p v-if="userData.userLists.length > 0">With {{ userData.troveQueryArticleTotal }} Articles to manage having
            Ignored {{ userData.nbrUserIgnoredArticles }}</p>
        <p v-if="userData.loadedIndex > 0">{{ userData.loadedIndex + 1 }} Lists have been Loaded</p>
        <div v-if="loading">
            {{ loadingMsg }}
        </div>
        <div v-else>
            <button @click.prevent="updTroveLists()" class="btn btn-primary"
                :disabled="(userData.loadedIndex + 1) < userData.troveQueryTotal">Refresh
                Your Trove Lists</button>
        </div>
    </div>
    <div v-else class="card col-sm-4 text-center">
        <label for="UserId" class="form-label h2">Trove User Id</label>
        <input v-model="inUserId" @keyup.enter="verifyUser(false)" class="form-control" id="UserId"
            placeholder="Enter Trove User Id" autofocus>
        <button @click.prevent="verifyUser(false)" id="UserID" class="btn btn-primary">Verify</button>
    </div>
</template>
