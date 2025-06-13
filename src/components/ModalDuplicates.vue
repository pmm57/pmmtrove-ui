<script setup>
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
const props = defineProps(['idxViewed'])
const emit = defineEmits(['close'])
console.log('ModalDuplicates:', props.idxViewed)
//
</script>
<template>
    <div class="modal">
        <div class="container-fluid" style="width: 25rem;">
            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">
                        Click to View an Article
                        <a @click.prevent="$emit('close')" href="#"><i class="bi-x-square"></i></a>
                    </h4>
                </div>
                <span v-for="duplicate in userData.viewedArticles[props.idxViewed].ViewedArticlePossibleDupArticle">
                    <a :href="duplicate.TroveArticleViewUrl" target="_blank">{{ duplicate.TroveArticleId }}</a>
                    In List - {{ duplicate.TroveArticleListDescription }}
                </span>
            </div>
        </div>
    </div>
</template>