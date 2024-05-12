<script setup>
    const props = defineProps(['articleListArray'])
    console.log("ArticleUrls", props.articleListArray)
</script>
//
<template>
    <span v-for="articleLink in props.articleListArray" :key="articleLink.troveArticleId">
        <router-link         
            v-if="articleLink.idxViewedArticle > -1"        
            class="btn btn-link"
            :to="'/editArticle/' + articleLink.troveListId + '/' + articleLink.troveArticleId"
        >
            - {{ articleLink.troveArticleId }}
        </router-link>
        <template v-else>- {{ articleLink.troveArticleId }}</template>
    </span>
</template>