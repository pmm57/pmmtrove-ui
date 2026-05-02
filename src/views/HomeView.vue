<script setup>
import { useDoFetch } from '@/components/DoFetch.js';
import { resetServer } from '@/components/ResetUser.js';
import { ref, watch, onMounted } from 'vue'
import { useNavBarStore } from '@/stores/navbar'
import { useRouter } from 'vue-router';
const router = useRouter();
import { useErrorsArrayStore } from '@/stores/errorsarray'
import { useUserDataStore } from '@/stores/userdata'
import { useAuth } from '@/auth'
import { shouldUseAuth0 } from '@/auth/authMode'
import MockLogin from '@/components/MockLogin.vue'

const navBarStore = useNavBarStore()
const errorsStore = useErrorsArrayStore()
const userData = useUserDataStore()
// Status Flag cycle
// Start - verfiedUser = false
// User Clicks Login or Signup
// Triggers call to server to access linked Trove User Id's
// Check number of linked TroveUserID to this Authenticated User
// None - Open manage screen to link a Trove User Id
// 1 - VerifyTroveUser
// > 1 - User Selects a Trove User Id
//     VerifyTroveUSer
//
// VerifyTroveUser
//   userData.verifiedTroveUserName = true
//   loadingTroveUseData = true
// Server sends newlogon = false - userReloadLists = true
// loading: userData.loadedIndex increments in App.vue and is displayed below, Change User Button Visible
// When all lists are loaded in App.vue - sseUserListArticles checks (userData.loadedIndex == userData.troveQueryTotal) userData.userListsReady = true
// Watch on userData.userListsReady triggers - loadingTroveUseData = false, Refresh Lists Button visible - if userReloadLists = true check if some lists needed to be refreshed
//
// User Clicks Refresh Lists
// userReloadLists = false, userData.userListsReady = false
// loadingTroveUseData.value = true, userData.loadedIndex = -1
// refresh true sent to server, goto loading:
//
// User clicks Change User only available if more then one linked Trove User Id
// userData.verifiedTroveUserName = false
// Call server to clear session
// userData.clearStore
// User goto start
// 
var userReloadLists = false // Browser restart - User Verified - Session On Server to reload from
const loadingAuthMsg = 'Authenticating .'
const loadingTroveMsg = 'Loading from TROVE .'
const loadingMsg = ref('')
const authUserWithTroveId = ref([])
const selectedTroveUserId = ref('')
const loadingTroveUseData = ref(false) // Shows / Hides loadingMsg
var inUserId = ''
var intervalLoading = null
const verifyChgPrompt = 'Verify Changed User'
//
// const isLoading = ref(false)
const isAuthenticated = ref(false)
const error = ref([])
const loginWithRedirect = ref(null)
const user = ref(null)

onMounted(async () => {
    const auth = await useAuth()
    isAuthenticated.value = auth.isAuthenticated
    error.value = auth.error
    loginWithRedirect.value = auth.loginWithRedirect
    user.value = auth.user

    console.log(`HomeView Start onMounted isAuthenticated-%s, verifiedTroveUserID-%s user-%s`, isAuthenticated.value.value, userData.verifiedTroveUserName, JSON.stringify(user.value.value))
    watch(() => user.value.value, async (u) => {
        console.log("HomeView trigger user watch:", u)
        if (u && !userData.verifiedTroveUserName) {
            await getUserTroveIds(user.value.value?.nickname)
        }
    })
    watch(error, (err) => {
        if (err) console.error("HomeView Auth0 error:", err)
    })
})

const login = () => loginWithRedirect.value()
const signup = () =>
    loginWithRedirect.value({
        authorizationParams: { screen_hint: 'signup' }
    })

watch(selectedTroveUserId, (troveUserId) => {
    if (!troveUserId) return;
    console.log(`Watch selectedTroveUserId:"%s" verifiedTroveUserName: `, selectedTroveUserId.value, userData.verifiedTroveUserName)
    if ('troveUserId' in userData.troveDetails) {
        resetTroveUser()
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
}
// Asynch method in App.vue will set this
watch(
    () => userData.userListsReady,
    (ready) => {
        console.log(`HomeView Watch: ready %s`, ready)
        if (!ready) return // Set to false userData.clearStore()
        loadingTroveUseData.value = false; // userData.userListsReady is true
        clearInterval(intervalLoading);
        intervalLoading = null;
        navBarStore.disableTroveLists = false;
        console.log(`HomeView Watch: Good TO Go - Is Authenticated:%s, Verified User:%s`, isAuthenticated.value.value, userData.verifiedTroveUserName)
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
    // isLoading.value.value = true
    loadingMsg.value = loadingAuthMsg
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
    const data = await useDoFetch('getUserTroveIds', "/", options);
    clearInterval(intervalLoading);
    intervalLoading = null;
    if (typeof data == 'boolean') {
        // Verification failed
        loadingTroveUseData.value = false
    } else {
        // isLoading.value.value = false
        userData.authUserTroveIds = [...data]
        userData.verifiedAuthUserName = true
        navBarStore.disableManage = false
        console.log(`HomeView/getUserTroveIds Returned userData.authUserTroveIds: %s `, JSON.stringify(userData.authUserTroveIds))
        // How many Trove User ID's are linked to this AuthUser
        authUserWithTroveId.value = userData.authUserTroveIds.filter((u) => u.troveUserId != null)
        console.log(`HomeView/getUserTroveIds Returned authUserWithTroveId: %s `, JSON.stringify(authUserWithTroveId.value))
        switch (authUserWithTroveId.value.length) {
            case 0: // Ask User to link one in Manage
                userData.authUserTroveIds[0].troveUserId = ''
                userData.authUserTroveIds[0].troveUserApiKey = ''
                router.push({ name: 'manage' })
                break
            case 1: // If only one then use that as Trove User Id
                inUserId = authUserWithTroveId.value[0].troveUserId
                userData.verifiedTroveUserName = true
                console.log(`HomeView/getUserTroveIds Direct verifyTroveUser: %s `, inUserId)
                verifyTroveUser(false)
                break
            default: // Ask user to select one
        }
    }
}
//
async function verifyTroveUser(refresh) {
    loadingTroveUseData.value = true
    errorsStore.arrayErrors = [];
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
    const data = await useDoFetch('verifyTroveUser', "/troveUser", options);
    if (typeof data == 'boolean') {
        // Verification failed
        loadingTroveUseData.value = false
    } else {
        // console.log(`HomeView/verifyTroveUser Returned data: %s `, JSON.stringify(data))
        userData.troveDetails = data.troveDetails; // There is a watch function in App.vue that will be triggered
        navBarStore.disableSearch = false;
        userData.verifiedTroveUserName = true
        if (!data.newLogon) {
            // Previous cookie existed on server
            console.log(`HomeView/verifyTroveUser User Session Exists On Server - Trigger Server Reload`)
            // Server will sseMetaData and sseUserLists - setting userData.userListsReady to trigger above Watch
            // Doing a server reload reload
            userReloadLists = true;
        }
        loadingMsg.value = loadingTroveMsg
        loadingTick();
    }
}
//
function refreshUserLists() {
    console.log('Refresh User Trove Lists')
    loadingMsg.value = 'Loading from TROVE.'
    inUserId = userData.troveDetails.troveUserId
    // Doing a refresh not a reload
    userReloadLists = false;
    userData.userListsReady = false;
    // as this is a reload  reset the users cached data
    userData.clearCacheStore()
    verifyTroveUser(true)
}
//
function resetTroveUser() {
    console.log('resetTroveUser')
    userData.verifiedTroveUserName = false
    inUserId = ''
    verifyUserPrompt = verifyChgPrompt
    resetServer()
}

console.log(`HomeView Started`)
// if (isAuthenticated.value.value && !userData.verifiedTroveUserName) {
//     console.log(`HomeView Start call getUserTroveIds`)
//     getUserTroveIds(user.value.value?.nickname)
// } else {
//     // Coming back from another tab
//     console.log(`HomeView Tabbed`)
//     authUserWithTroveId.value = userData.authUserTroveIds.filter((u) => u.troveUserId != null)
// }
</script>

<template>
    <div v-if="!isAuthenticated.value" class="card col-sm-4 text-center">
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
    <div v-else-if="isAuthenticated.value && !userData.verifiedTroveUserName" class="card col-sm-4 text-center">
        <p v-if="'troveUserId' in userData.troveDetails">
            Change {{ userData.troveDetails.troveUserId }} to Manage Another
        </p>
        <p v-else>Select a Trove User Id to Manage</p>
        <!-- Trove User Id selection, fires watcher on selected UI -->
        <select v-model="selectedTroveUserId">
            <option disabled value="">-- Select a Trove User Id --</option>
            <option v-for="u in authUserWithTroveId" :key="u.id" :value="u.troveUserId">
                {{ u.troveUserId }}
            </option>
        </select>
    </div>
    <div v-else-if="userData.verifiedTroveUserName" class="card col-sm-4 text-center">
        <p>This is a Trove Data Miner for user {{ userData.troveDetails.troveUserId }}</p>
        <p v-if="userData.userLists.length > 0">There are {{ userData.troveQueryTotal }} Lists in Trove.
            <br v-if="userData.userDuplicateListIds.length > 0">There is {{ userData.userDuplicateListIds.length }}
            Duplicate List/s that will not be Loaded.
        </p>
        <p v-if="userData.userLists.length > 0">There are {{ userData.troveQueryArticleTotal }} Articles to Manage<br>
            {{ userData.nbrUserDupArticles }} Duplicates and {{ userData.nbrUserIgnoredArticles }} Ignored</p>
        <p v-if="userData.loadedIndex > -1">{{ userData.loadedIndex + 1 }} Lists have been Loaded</p>
        <div v-if="loadingTroveUseData">
            <p>{{ loadingMsg }}</p>
        </div>
        <div v-else>
            <button @click.prevent="refreshUserLists()" class="btn btn-primary">Refresh
                Your Trove Lists</button>
        </div>
    </div>
    <div v-if="userData.userListsReady && (authUserWithTroveId.length > 1) && userData.verifiedTroveUserName"
        class="card col-sm-4 text-center">
        <button @click.prevent="userData.verifiedTroveUserName = false" class="btn btn-primary">Change
            User</button>
    </div>
    <div v-if="shouldUseAuth0 && error.length > 0" class="alert alert-danger">
        Authentication error: {{ error.message }}
    </div>
</template>
