<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter();
import { resetServer } from '@/components/ResetUser.js';
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useAuth } from '@/auth'
import { shouldUseAuth0 } from '@/auth/authMode'
import { useDoFetch } from '@/components/DoFetch.js';

// ---- auth state ----
const logout = ref(null)
const error = ref(null)
const isAuthenticated = ref(false)
// --------------------
// Timeout config
// --------------------
const serverUrl = import.meta.env.VITE_SERVER_URL
const WARN_AFTER_MS = 10 * 60 * 1000
const RENDER_SPINDOWN_MS = 15 * 60 * 1000
const LAST_RENDER_FETCH_KEY = 'lastRenderFetchAt'
// Time tracking
const nowTick = ref(Date.now())
const lastRenderFetchAt = ref(Date.now())
let tickTimer = null
let storageHandler = null
//
function isRenderBackendBase() {
    try {
        const u = new URL(serverUrl, window.location.origin)
        return u.hostname.endsWith('.onrender.com')
    } catch {
        return false
    }
}
//
function readLastFetch() {
    const raw = localStorage.getItem(LAST_RENDER_FETCH_KEY)
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) ? n : Date.now()
}
// Derived times
const idleMs = computed(() => Math.max(0, nowTick.value - lastRenderFetchAt.value))
const minutesIdle = computed(() => Math.floor(idleMs.value / 60000))
const minutesToSpinDown = computed(() =>
    Math.max(0, Math.ceil((RENDER_SPINDOWN_MS - idleMs.value) / 60000))
)
//
const showTimeoutBanner = computed(() => {
    if (!isRenderBackendBase()) return false
    return idleMs.value >= WARN_AFTER_MS
})
// --------------------
// Manual keep-alive
// --------------------
async function manualKeepAlive() {
    const options = {
        method: "get",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const data = await useDoFetch('verifyServerUp', "/check", options);
    if (typeof data == 'boolean') {
        errorsStore.arrayErrors.push({ msg: 'Server not available', param: '' });
        console.log('manualKeepAlive: Error in Fetch');
    }
    lastRenderFetchAt.value = readLastFetch()
}
onMounted(async () => {
    const auth = await useAuth()
    isAuthenticated.value = auth.isAuthenticated
    error.value = auth.error
    logout.value = auth.logout
    // Only enable timeout logic when backend is on Render
    if (!isRenderBackendBase()) return
    // Initialise last activity
    lastRenderFetchAt.value = readLastFetch()
    // Tick once per second for live countdown
    tickTimer = setInterval(() => {
        nowTick.value = Date.now()
    }, 1000)
    // Sync across tabs/windows
    storageHandler = (ev) => {
        if (ev.key === LAST_RENDER_FETCH_KEY) {
        lastRenderFetchAt.value = readLastFetch()
        }
    }
    window.addEventListener('storage', storageHandler)
})

onBeforeUnmount(() => {
    // Nothing was set up locally, so nothing to clean up
    if (!isRenderBackendBase()) return
    if (tickTimer) clearInterval(tickTimer)
    if (storageHandler) window.removeEventListener('storage', storageHandler)
})

const logoutUser = () => {
    resetServer()
    if (shouldUseAuth0) {
        // Real Auth0 logout
        logout.value({
            logoutParams: {
                returnTo: window.location.origin
            }
        })
    } else {
        // mockAuth logout (no redirect)
        logout.value()
    }
    router.push({ name: 'home' })
}

</script>
<template>
    <div class="navbar navbar-expand-sm bg-light">
        <ul class="navbar-nav">
            <li class="nav-item">
                <RouterLink to="/" class="nav-link" :class="{ disabled: navStore.disableHome }">Home</RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink to="/userPersonList" class="nav-link" :class="{ disabled: navStore.disablePersonList }">
                    People</RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink to="/userPersonStory" class="nav-link" :class="{ disabled: navStore.disablePersonStory }">
                    Person Story</RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink to="/searchTrove" class="nav-link" :class="{ disabled: navStore.disableSearch }">
                    Search
                </RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink to="/userTroveLists" class="nav-link" :class="{ disabled: navStore.disableTroveLists }">
                    Trove
                    Lists</RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink :to="navStore.listHref" class="nav-link" :class="{ disabled: navStore.listId == 0 }">
                    {{ navStore.listTabTitle }}</RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink :to="navStore.articleHref" class="nav-link" :class="{ disabled: navStore.articleId == 0 }">
                    {{ navStore.articleTabTitle }}</RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink to="/userMetadataList" class="nav-link" :class="{ disabled: navStore.disableMetadataList }">
                    Metadata Items</RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink to="/manage" class="nav-link" :class="{ disabled: navStore.disableManage }">Manage
                </RouterLink>
            </li>
            <li class="nav-item" v-if="isAuthenticated.value">
                <a href="#" class="nav-link" @click.prevent="logoutUser">Logout</a>
            </li>
        </ul>
        <RouterLink to="/" class="navbar-brand ms-auto d-flex align-items-center">
            <img
                src="https://assets.nla.gov.au/logos/trove/trove-colour.svg"
                alt="Trove"
                class="trove-brand-img"
            />
        </RouterLink>
    </div>
    <div v-show="errorsStore.arrayErrors.length > 0" class="card text-center">
        <button @click.prevent="errorsStore.arrayErrors = []" type="button" class="btn btn-primary">Clear
            Errors</button>
        <ul>
            <li v-for="(error, index) in errorsStore.arrayErrors" :key="index">
                {{ error.msg + "-" + error.param }}
            </li>
        </ul>
    </div>
    <div v-if="showTimeoutBanner"
    class="alert alert-warning m-2 d-flex align-items-center justify-content-between"
    >
        <div>
            <strong>Backend inactivity warning</strong>
            <div class="small">
                No Render-backend activity for ~{{ minutesIdle }} minutes.
                Render free-tier services may spin down after 15 minutes without inbound traffic.
                (approx {{ minutesToSpinDown }} minutes remaining)
            </div>
        </div>
        <div class="ms-3">
            <button
                class="btn btn-sm btn-primary"
                @click="manualKeepAlive"
            >
            {{ 'Keep alive now' }}
            </button>
        </div>
    </div>
</template>
<style>
.trove-brand-img {
  height: 100%;
  max-height: 40px; /* Bootstrap navbar default */
  width: auto;
}
</style>