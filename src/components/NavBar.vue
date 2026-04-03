<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter();
import { resetServer } from '@/components/ResetUser.js';
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useAuth } from '@/auth'
import { shouldUseAuth0 } from '@/auth/authMode'

const logout = ref(null)
const error = ref(null)
const isAuthenticated = ref(false)

onMounted(async () => {
    const auth = await useAuth()
    isAuthenticated.value = auth.isAuthenticated
    error.value = auth.error
    logout.value = auth.logout

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
</template>
<style>
.trove-brand-img {
  height: 100%;
  max-height: 40px; /* Bootstrap navbar default */
  width: auto;
}
</style>