<script setup>
import { useDoFetch } from '@/components/DoFetch.js';
import { AuthUserState } from '@/components/AuthUserState.js';
import { ref, watch } from 'vue'
import { useNavBarStore } from '@/stores/navbar'
import { useRouter } from 'vue-router';
import { useErrorsArrayStore } from '@/stores/errorsarray'
import { useUserDataStore } from '@/stores/userdata'
import { useAuth } from '@/auth'
import { shouldUseAuth0 } from '@/auth/authMode'
import MockLogin from '@/components/MockLogin.vue'

const router = useRouter();
const navBarStore = useNavBarStore()
const errorsStore = useErrorsArrayStore()
const userData = useUserDataStore()
//
// Following States are Possible on HomeView start
//   userData.authUserSate == AuthUserState.UNAUTHENTICATED
//      Clean Start
//   Else Restart
//   userData.authUserSate == AuthUserState.UNVERIFIED
//   userData.authUserSate == AuthUserState.READY
//
// At Startup - userData.authUserSate = AuthUserState.UNAUTHENTICATED
// At Restart
// User Clicks Login or Signup
// Auth0 returns user object
//   {auth.user, auth.error, auth.isAuthenticated, auth.loginWithRedirect}
//   auth.isAuthenticated = true userData.authUserSate = AuthUserState.UNVERIFIED
//   Triggers call to server to access AuthUser's linked Trove User Id's
//   Check number of linked Trove User Id's to this Authenticated User
//   0 - userData.authUserSate = AuthUserState.TROVE_ID_REQUIRED
//       Open ManageView to link a Trove User Id
//   1 - VerifyTroveUser
//   >1 - userData.authUserSate = AuthUserState.TROVE_ID_SELECTION_REQUIRED
//        :Select Trove User Id
//        Open selection of linked Trove User Id's
//        User Selects a Trove User Id
//        VerifyTroveUser
//
// VerifyTroveUser
//   userData.authUserSate = AuthUserState.UNVERIFIED
//   Call server to verify Trove User Id and get Trove User Details
//   Verfication Succedded
//   If Server sends newlogon = false - userData.authUserSate = AuthUserState.REFRESH_LOAD // User sessin re-established on server - reload lists from server
//   userData.authUserSate = AuthUserState.FIRST_LOAD
//   Goto :loading
//
// loading: Loading Trove User Data
// Server will sse MetaData, savedSearches and sseUserLists
// SSE are handled by App.vue
// userData.loadedIndex increments in App.vue and is displayed below
// When all lists are loaded in App.vue - sseUserListArticles checks (userData.loadedIndex == userData.troveQueryTotal) userData.userListsReady = true to trigger above Watch
// Watch on userData.userListsReady triggers 
// - userData.authUserSate = AuthUserState.READY
// - if Linked Trove User Id's > 1, Change User Button Visible
// - Refresh Lists Button visible 
// - if AuthUserState.REFRESH_LOAD true check if some lists needed to be refreshed
//
// User Clicks Refresh Lists
// userData.authUserSate = AuthUserState.REFRESH_LOAD
//// userReloadLists = false, - replaced by userData.authUserSate = AuthUserState.REFRESH_LOAD
// userData.userListsReady = false
// userData.loadedIndex = -1
// refresh true sent to server
// goto loading:
//
// User clicks Change User only available if more then one linked Trove User Id
// Call server to clear Trove User Data
// userData.clearStore
// userData.authUserSate = AuthUserState.TROVE_ID_SELECTION_REQUIRED
// goto :Select Trove User Id
// 
var userReloadLists = false // Browser restart - User Verified - Session On Server to reload from
const authenticateAuthUserMsg = 'Authenticating .'
const verifyTroveUserMsg = 'Verifying Trove User .'
const loadingTroveMsg = 'Loading from TROVE .'
var currentLoadingMsg = ''
const loadingMsg = ref('')
const savedAuthUserTroveIds = ref([])
const selectedTroveUserId = ref('')
var inUserId = ''
var intervalLoading = null
// const verifyChgPrompt = 'Verify Changed User'

const auth = useAuth()
const user = auth.user
const error = auth.error
console.log(`HomeView Start authUserState:%s, user:%s, isAuthenticated:%s`, userData.authUserState, JSON.stringify(user), auth.isAuthenticated?.value)
// const isAuthenticated = auth.isAuthenticated
if (userData.authUserState == AuthUserState.UNAUTHENTICATED) {
    if (auth.isAuthenticated?.value) {
        if (user?.value != null) userData.authUserState = AuthUserState.UNVERIFIED
    }
}
const loginWithRedirect = auth.loginWithRedirect

console.log(`HomeView Start After isAuthenticated authUserState:%s, user:%s`, userData.authUserState, JSON.stringify(user))
watch(user, async (u) => {
    console.log(`HomeView WATCH user:%s, authUserState:%s`, u?.nickname, userData.authUserState)
    if (!u?.nickname) {
        userData.authUserState = AuthUserState.UNAUTHENTICATED
        console.log('HomeView WATCH - No authenticated user yet')
        return
    }
    if (userData.authUserState == AuthUserState.UNAUTHENTICATED) {
        await getUserTroveIds(u.nickname)
    }
}, { immediate: true })

watch(error, (err) => {
    if (err) console.error("HomeView Auth0 error:", err)
}, { immediate: true })

const login = () => loginWithRedirect()
const signup = () =>
    loginWithRedirect({
        authorizationParams: { screen_hint: 'signup' }
    })

watch(selectedTroveUserId, async (troveUserId) => {
    if (!troveUserId) return;
    console.log(`Watch selectedTroveUserId:"%s" authUserState:%s Current troveUserId:%s`, troveUserId, userData.authUserState, userData.troveDetails.troveUserId)
    // If already have a troveUserId and Select same Trover User Id as currently - then treat as a Refresh
    if (userData?.troveDetails?.troveUserId?.length > 0) {
        if (troveUserId == userData.troveDetails.troveUserId) {
            refreshUserLists()
            return
        } else {
            console.log(`HomeView/changeTroveUser From:"%s" To:"%s"`, userData.troveDetails.troveUserId, troveUserId)
            userData.authUserState = AuthUserState.UNVERIFIED
            inUserId = ''
            // Clear Old Trove User Data from Server and in Store
            userData.clearStore()
            const options = {
                method: "post",
                mode: "cors",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                //make sure to serialize your JSON body
                body: JSON.stringify({
                    clearTroveUserId: userData.troveDetails.troveUserId
                })
            };
            await useDoFetch ('clearTroveUser', "/clearTroveUser", options);
        }
    }
    inUserId = troveUserId
    verifyTroveUser(false)
});
//
function loadingTick() {
    intervalLoading = setInterval(tick, 500);
}
function tick() {
    loadingMsg.value += '.';
    if (loadingMsg.value.length > 40) {
        loadingMsg.value = currentLoadingMsg
    }
}
function clearTick() {
    loadingMsg.value = '';
    clearInterval(intervalLoading);
    intervalLoading = null;
}
// Asynch method in App.vue will set this
watch(
    () => userData.userListsReady,
    (ready) => {
        console.log(`HomeView Watch userListsRead:%s`, ready)
        if (!ready) return // Set to false userData.clearStore()
        clearTick()
        navBarStore.disableTroveLists = false;
        userData.authUserState = AuthUserState.READY
        console.log(`HomeView Watch: Good TO Go - AuthUserState:%s`, userData.authUserState)
        // If this was a Browser Reload from Server - Check if the full load never completed
        // Indicated by last list that is not a duplicate having a count > 0 but no artices in its Article Array
        //  force a refresh
        if (userReloadLists) {
            userReloadLists = false;
            for (let i = (userData.userLists.length - 1); i >= 0; --i) {
                console.log(`HomeView Reload: Duplicate List Id %s, Check Id %s, Count %s, Length %s`,
                    userData.userDuplicateListIds, userData.userLists[i].TroveListId, userData.userLists[i].TroveListItemCount, userData.userListArticles[i].length)
                if (userData.userDuplicateListIds.includes(Number(userData.userLists[i].TroveListId))) {
                    console.log(`HomeView Reload: Matched Duplicate ID %s try next`, userData.userLists[i].TroveListId)
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
//
async function getUserTroveIds(authUserName) {
    // oauth will populate user
    loadingMsg.value = authenticateAuthUserMsg
    currentLoadingMsg = authenticateAuthUserMsg
    loadingTick();
    errorsStore.arrayErrors = [];
    console.log('HomeView/getUserTroveIds User-', authUserName)
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
            authUserName: authUserName
        })
    };
    const data = await useDoFetch('getUserTroveIds', "/", options); // pmmtrove-servicelayer index\initTroveUser.authUserInitRouter
    clearTick()
    if (typeof data == 'boolean') {
        // Verification failed
    } else {
        userData.authUserTroveIds = [...data]
        // userData.verifiedAuthUserName = true
        navBarStore.clearNavBar()
        navBarStore.disableManage = false
        console.log(`HomeView/getUserTroveIds Returned userData.authUserTroveIds: %s `, JSON.stringify(userData?.authUserTroveIds))
        // How many Trove User ID's are linked to this AuthUser
        savedAuthUserTroveIds.value = userData.authUserTroveIds.filter((u) => u.troveUserId != null)
        console.log(`HomeView/getUserTroveIds Returned savedAuthUserTroveIds: %s `, JSON.stringify(savedAuthUserTroveIds?.value))
        switch (savedAuthUserTroveIds.value.length) {
            case 0: // Ask User to link one in Manage
                userData.authUserTroveIds[0].troveUserId = ''
                userData.authUserTroveIds[0].troveUserApiKey = ''
                router.push({ name: 'manage' })
                break
            case 1: // If only one then use that as Trove User Id
                inUserId = savedAuthUserTroveIds.value[0].troveUserId
                userData.authUserState = AuthUserState.UNVERIFIED
                console.log(`HomeView/getUserTroveIds Direct verifyTroveUser: %s `, inUserId)
                verifyTroveUser(false)
                break
            default: // Ask user to select one
                userData.authUserState = AuthUserState.TROVE_ID_SELECTION_REQUIRED
        }
    }
}
// 
async function verifyTroveUser(refresh) {
    selectedTroveUserId.value = ''
    if (!refresh){
        loadingMsg.value = verifyTroveUserMsg
        currentLoadingMsg = verifyTroveUserMsg
    }
    loadingTick();
    errorsStore.arrayErrors = [];
    console.log(`Homeview/verifyTroveUser User:"%s" authUserState:%s`, inUserId, userData.authUserState)
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
    const data = await useDoFetch('verifyTroveUser', "/troveUser", options);
    clearTick();
    if (typeof data == 'boolean') {
        // Verification failed
    } else {
        // console.log(`HomeView/verifyTroveUser Returned data: %s `, JSON.stringify(data))
        console.log(`HomeView/verifyTroveUser Returned Logon:"%s" New:%s`, JSON.stringify(data.troveDetails), data.newLogon)
        userData.troveDetails = data.troveDetails; // There is a watch function in App.vue that will be triggered
        navBarStore.disableSearch = false;
        if (!data.newLogon) {
            // Previous cookie existed on server
            console.log(`HomeView/verifyTroveUser User Session Exists On Server - Trigger Server Reload`)
            // Server will sseMetaData and sseUserLists - setting userData.userListsReady to trigger above Watch
            // Doing a server reload reload
            userData.authUserState = AuthUserState.REFRESH_LOAD
            // userReloadLists = true;
        } else {
            userData.authUserState = AuthUserState.FIRST_LOAD
        }
        // Server will sseMetaData and sseUserLists - setting userData.userListsReady to trigger above Watch
        loadingMsg.value = loadingTroveMsg
        currentLoadingMsg = loadingTroveMsg
        loadingTick();
    }
}
//
function refreshUserLists() {
    console.log('HomeView/refreshUserLists Refresh User Trove Lists')
    loadingMsg.value = loadingTroveMsg
    currentLoadingMsg = loadingTroveMsg
    inUserId = userData.troveDetails.troveUserId
    // Doing a refresh not a reload
    userReloadLists = false;
    userData.userListsReady = false;
    // as this is a reload  reset the users cached data
    userData.clearCacheStore()
    verifyTroveUser(true)
}
//
console.log(`HomeView Started AuthUserState:%s`, userData.authUserState)
</script>

<template>
    <div class="d-flex justify-content-center mt-5">
        <div style="max-width: 400px; width: 100%;">
            <div v-if="loadingMsg.length > 0" class="card text-center">
                <p><b>{{ loadingMsg }}</b></p>
            </div>
            <div v-if="userData.authUserState == AuthUserState.UNAUTHENTICATED" class="card text-center">
                <MockLogin v-if="!shouldUseAuth0" />
                <template v-else>
                    <br>
                    <p>Please log in or sign up to continue</p>
                    <button @click="login" class="btn btn-primary">Log in using Authentication User</button>
                    <p>First time user please Signup
                    </p>
                    <p>NOTE: After signing up an Authenticated User name you can link multiple Trove User names to it in Manage
                        User
                    </p>
                    <button @click="signup" class="btn btn-secondary mt-2">Signup an Authentication User Name</button>
                </template>
            </div>
            <div v-if="userData.authUserState == AuthUserState.TROVE_ID_SELECTION_REQUIRED" class="card text-center">
                <p>Select a Trove User Id to Manage</p>
                <!-- Trove User Id selection, fires watcher on selected UI -->
                <select v-model="selectedTroveUserId">
                    <option disabled value="">-- Select a Trove User Id --</option>
                    <option v-for="u in savedAuthUserTroveIds  ?? []" :key="u.id" :value="u.troveUserId">
                        {{ u.troveUserId }}
                    </option>
                </select>
            </div>
            <div v-if="(userData.authUserState.includes('LOAD')) || (userData.authUserState == AuthUserState.READY)" class="card text-center">
                <p>This is a Trove Data Miner for user {{ user?.nickname }}
                    <br>Managing Trove User {{ userData?.troveDetails?.troveUserId }}</p>
                <p v-if="userData?.userLists?.length > 0">There are {{ userData.troveQueryTotal }} Lists in Trove
                    <br v-if="userData?.savedSearches?.length > 0">There are {{ userData?.savedSearches?.length ?? 0 }} Saved Searches
                    <br v-if="userData?.userDuplicateListIds?.length > 0">There are {{ userData?.userDuplicateListIds?.length ?? 0 }}
                    Duplicate List/s that will not be Loaded.
                </p>
                <div v-if="userData.authUserState == AuthUserState.READY">
                    <p>There are {{ userData.troveQueryArticleTotal }} Articles to Manage<br>
                        {{ userData.nbrUserDupArticles }} Duplicates and {{ userData.nbrUserIgnoredArticles }} Ignored</p>
                    <div>
                        <button @click.prevent="refreshUserLists()" class="btn btn-primary">Refresh
                            Your Trove Lists</button>
                    </div>
                    <div v-if="(savedAuthUserTroveIds?.length > 1)">
                        <button @click.prevent="userData.authUserState = AuthUserState.TROVE_ID_SELECTION_REQUIRED" class="btn btn-primary">Change
                            User</button>
                    </div>
                </div>
                <div v-else>
                    <p>{{ userData.loadedIndex + 1 }} Lists have been Loaded</p>
                </div>
            </div>
            <div v-if="shouldUseAuth0 && error && error.message" class="alert alert-danger">
                Authentication error: {{ error.message }}
            </div>
        </div>
    </div>
</template>
