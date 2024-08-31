<script setup>
    const props = defineProps(['inline', 'articleListArray', 'troveListId'])
    console.log("ArticleUrls", props.articleListArray)
    //
    function compareFn(a, b) {
        if (Number(a.troveArticleId) < Number(b.troveArticleId)) {
            return -1;
        } else if (Number(a.troveArticleId) > Number(b.troveArticleId)) {
            return 1;
        }
        // a must be equal to b
        return 0;
    }
    // Transform to a standardised array
    let articleUrls = [...props.articleListArray];
    if (props.troveListId > 0) {
        // Don't have article link array but a Trove List array
        articleUrls = props.articleListArray.map((el) => {return {troveArticleId: el.TroveListArticleId,
                                                            idxViewedArticle: el.TroveListArticleViewedIdx,
                                                            troveListId: props.troveListId } });
    }
    articleUrls.sort(compareFn);
    console.log ("Article Urls -2 - ", articleUrls);
</script>
//
<template>
    <template v-for="(articleLink, index) in articleUrls" :key="articleLink.troveArticleId">
        <router-link         
            v-if="articleLink.idxViewedArticle > -1"        
            class="btn btn-link px-0 py-0"
            :to="'/editArticle/' + articleLink.troveListId + '/' + articleLink.troveArticleId"
        >{{ articleLink.troveArticleId }}
        </router-link>
        <template v-else>{{ articleLink.troveArticleId }}</template>
        <template v-if="(props.inline) && ((index + 1)<articleUrls.length)"> - </template>
    </template>
</template>