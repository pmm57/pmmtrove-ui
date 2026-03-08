<script setup>
import { resetServer } from '@/components/ResetUser.js';
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useAuth0 } from '@auth0/auth0-vue'
const { isAuthenticated, logout } = useAuth0()
const logoutUser = () => {
    resetServer()
    logout({
        logoutParams: {
            returnTo: window.location.origin
        }
    })
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
            <li class="nav-item" v-if="isAuthenticated">
                <a href="#" class="nav-link" @click.prevent="logoutUser">Logout</a>
            </li>
        </ul>
    </div>
    <div v-show="errorsStore.arrayErrors.length > 0" class="card text-center">
        <button @click.prevent="errorsStore.arrayErrors = []" type="button" class="btn btn-primary">Clear
            Errors</button>
        <ul>
            <li v-for="error in errorsStore.arrayErrors">
                {{ error.msg + "-" + error.param }}
            </li>
        </ul>
    </div>
</template>