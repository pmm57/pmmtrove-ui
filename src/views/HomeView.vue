<script setup>
import { useDoFetch } from '@/components/DoFetch.js';
import { ref, watch } from 'vue'
import { useNavBarStore } from '@/stores/navbar'
import { useErrorsArrayStore } from '@/stores/errorsarray'
import { useUserDataStore } from '@/stores/userdata'
const navBarStore = useNavBarStore()
const errorsStore = useErrorsArrayStore()
const userData = useUserDataStore()
// Status Flag cycle
// Start - verfiedUser = false
// Enter User - loading = true
// Invalid User - loading = false go to start
// Valid User - userData.verifiedUser = true, loading = true
// Server sends newlogon = flase - userReloadLists = true
// loading: userData.loadedIndex increments in App,vue and is displayed below, Change User Button Visible
// When all lists are loaded in App.vue - sseUserListArticles checks (userData.loadedIndex == userData.troveQueryTotal) userData.userListsReady = true
// Watch on userData.userListsReady triggers - loading = false, Refresh Lists Button visible - if userReloadLists = true check if some lists needed to be refreshed
//
// User Clicks Refresh Lists
// userReloadLists = false, userData.userListsReady = false
// loading.value = true, userData.loadedIndex = -1
// refresh true sent to server, goto loading:
//
// User clicks Change User
// userData.verifiedUser = false
// Call server to clear session
// userData.clearStore
// User goto start
// 
var userReloadLists = false // Browser restart - User Verified - Session On Server to reload from
const loadingMsg = ref('Loading from TROVE.')
const loading = ref(false) // Shows / Hides loadingMsg
var inUserId = ''
var intervalLoading = null
const verifyPrompt = 'Verify'
const verifyChgPrompt = 'Verify Changed User'
var verifyUserPrompt = 'Verify'

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
    (ready) => {
        console.log(`HomeView Watch: ready %s`, ready)
        if (!ready) return // Set to false userData.clearStore()
        loading.value = false; // userData.userListsReady is true
        clearInterval(intervalLoading);
        navBarStore.disableTroveLists = false;
        // If this was a Browser Reload from Server - CHeck if the full load never completed
        // Indicated by last list that is not a duplicate having a count > 0 but no artices in its Article Array
        //  force a refresh
        if (userReloadLists) {
            userReloadLists = false;
            for (let i = (userData.userLists.length - 1); i >= 0; --i) {
                console.log(`HomeView Reload: Duplicate Ids %s, Check Id %s, Count %s, Length %s`,
                    userData.userDuplicateListIds, userData.userLists[i].TroveListId, userData.userListArticles[i].TroveListItemCount, userData.userListArticles[i].length)
                if (userData.userDuplicateListIds.includes(Number(userData.userLists[i].TroveListId))) {
                    console.log(`HomeView Reload: Matched Duplicate ID %s`, userData.userLists[i].TroveListId)
                } else {
                    console.log(`HomeView Reload: Check Array Length %s %s`, userData.userLists[i].TroveListId, userData.userListArticles[i].length)
                    if (userData.userListArticles[i].length == 0) {
                        refreshUserLists()
                    }
                    break
                }
            }
        }
    }
)
async function verifyUser(refresh) {
    loading.value = true
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
    const data = await useDoFetch('verifyUser', url, options);
    if (typeof data == 'boolean') {
        // Verification failed
        loading.value = false
    } else {
        console.log(`HomeView/verifyUser Returned data: %s `, JSON.stringify(data))
        userData.troveDetails = data.troveDetails; // There is a watch function in App.vue that will be triggered
        navBarStore.disableSearch = false;
        userData.verifiedUser = true
        if (!data.newLogon) {
            // Previous cookie existed on server
            console.log(`HomeView/verifyUser User Session Exists On Server - Trigger Server Reload`)
            // Server will sseMetaData and sseUserLists - setting userData.userListsReady to trigger above Watch
            // Doing a server reload reload
            userReloadLists = true;
        }
        loadingTick();
    }
}
function refreshUserLists() {
    console.log('Refresh User Trove Lists')
    loadingMsg.value = 'Loading from TROVE.'
    inUserId = userData.troveDetails.troveUserId
    // Doing a refresh not a reload
    userReloadLists = false;
    userData.userListsReady = false;
    // as this is a reload  reset the users cached data
    userData.clearCacheStore()
    verifyUser(true)
}
//
function resetUser() {
    userData.verifiedUser = false
    inUserId = ''
    verifyUserPrompt = verifyChgPrompt
    // Send reset to server
    const url = import.meta.env.VITE_SERVER_URL + "/reset-session";
    console.log('HomeView - Reset Session')
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include"
    };
    useDoFetch('resetUser', url, options);
    // Clear all data
    userData.clearStore()
}
</script>

<template>
    <div v-if="userData.verifiedUser" class="card">
        <p>This is a Trove Data Miner for user {{ userData.troveDetails.troveUserId }}</p>
        <p v-if="userData.userLists.length > 0">There are {{ userData.troveQueryTotal }} Lists in Trove.</p>
        <p v-if="userData.userLists.length > 0">With {{ userData.troveQueryArticleTotal }} Articles to manage having
            and {{ userData.nbrUserDupOrIgnoredArticles }} Duplicates or Ignored</p>
        <p v-if="userData.loadedIndex > 0">{{ userData.loadedIndex + 1 }} Lists have been Loaded</p>
        <div v-if="loading">
            {{ loadingMsg }}
        </div>
        <div v-else>
            <button @click.prevent="refreshUserLists()" class="btn btn-primary">Refresh
                Your Trove Lists</button>
        </div>
    </div>
    <div v-else class="card col-sm-4 text-center">
        <label for="UserId" class="form-label h2">Trove User Id</label>
        <input v-model="inUserId" @keyup.enter="verifyUser(false)" class="form-control" id="UserId"
            placeholder="Enter Trove User Id" autofocus>
        <button @click.prevent="verifyUser(false)" id="UserID" class="btn btn-primary">{{ verifyUserPrompt }}</button>
    </div>
    <div v-if="userData.userListsReady" class="card col-sm-4 text-center">
        <button @click.prevent="resetUser()" class="btn btn-primary">Change
            User</button>
    </div>
</template>
