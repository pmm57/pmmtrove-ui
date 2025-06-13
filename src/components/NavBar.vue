<script setup>
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
</script>
<template>
    <div class="navbar navbar-expand-sm bg-light">
        <ul class="navbar-nav">
            <li class="nav-item">
                <RouterLink to="/" class="nav-link" :class="{ disabled: navStore.disableHome }">Home</RouterLink>
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
                <RouterLink to="/userPersonList/blank" class="nav-link"
                    :class="{ disabled: navStore.disablePersonList }">
                    People</RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink to="/searchTrove/blank" class="nav-link" :class="{ disabled: navStore.disableSearch }">
                    Search
                </RouterLink>
            </li>
            <li class="nav-item">
                <RouterLink to="/about" class="nav-link" :class="{ disabled: navStore.disableAbout }">About us
                </RouterLink>
            </li>
        </ul>
    </div>
    <div v-show="errorsStore.arrayErrors.length > 0" class="card col-sm-4 text-center">
        <button @click.prevent="errorsStore.arrayErrors = []" type="button" class="btn btn-primary">Clear
            Errors</button>
        <ul>
            <li v-for="error in errorsStore.arrayErrors">
                {{ error.msg + "-" + error.param }}
            </li>
        </ul>
    </div>
</template>