<script setup>
const props = defineProps(['inline', 'articleListArray'])
import { useNavBarStore } from '@/stores/navbar';
const navStore = useNavBarStore();
import { useRouter } from 'vue-router';
const router = useRouter();
// console.log("ArticleUrls", JSON.stringify(props))
//
function openArticle(articleLink) {
    console.log('ArticleUrls/openArticle ', JSON.stringify(articleLink))
    navStore.listId = articleLink.troveListId;
    navStore.listHref = "/userListPage";
    navStore.listTabTitle = "List " + navStore.listId;
    navStore.articleId = articleLink.troveArticleId;
    router.push({ name: 'editArticle' });
}
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
let articleUrls = [];
articleUrls = props.articleListArray.map((el) => {
    var listIdStr = el.troveListId
    if (!(typeof listIdStr === "string")) listIdStr = el.troveListId.toString()
    var articleIdStr = el.troveArticleId
    if (!(typeof articleIdStr === "string")) articleIdStr = el.troveArticleId.toString()
    return {
        troveArticleId: articleIdStr,
        idxViewedArticle: el.idxViewedArticle,
        troveListId: listIdStr
    }
});
articleUrls.sort(compareFn);
console.log("ArticleUrls/Article Urls -2 - ", JSON.stringify(articleUrls));
</script>
//
<template>
    <template v-for="(articleLink, index) in articleUrls" :key="articleLink.troveArticleId">
        <a v-if="articleLink.idxViewedArticle > -1" href="#" @click.prevent="openArticle(articleLink)">
            {{ articleLink.troveArticleId }}
        </a>
        <template v-else>{{ articleLink.troveArticleId }}</template>
        <template v-if="(props.inline) && ((index + 1) < articleUrls.length)"> - </template>
    </template>
</template>