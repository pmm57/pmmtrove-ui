<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import ArticleUrls from '@/components/ArticleUrls.vue'
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
// Array to do accordian transition by Metadata Type
var flagMetadataType = ref([])
var flagMetadataValue = ref([])
showMetadataType(-1)
// console.log("STORE PROPERTIES:", Object.keys(userData))
// console.log("FIELD PROXY?", userData.metadataTypeByMetadata)
// console.log("FIELD RAW?", JSON.stringify(userData.metadataTypeByMetadata))
// Run accordion initialization ONLY when metadata is available
// watch(
//     () => userData.metadataTypeByMetadata,
//     (newVal) => {
//         // console.log(`UserMetadataListView/watch %s`, JSON.stringify(userData.metadataTypeByMetadata))
//         // console.log(`UserMetadataListView/onMounted %s`, JSON.stringify(userData.metadataTypeByMetadata))
//         // console.log("UserMetadataListView/onMounted store id", userData.$id)
//         // console.log("UserMetadataListView/onMounted isProxy?", userData.metadataTypeByMetadata)
//         if (newVal.length > 0) {
//             showMetadataType(-1)
//         }
//     },
//     { deep: true, immediate: true }
// )
//
async function showMetadataType(idxType) {
    // Wait for Vue to apply the latest metadata update
    await nextTick()
    // console.log('showMetadataType ', idxType, flagMetadataType.value, flagMetadataType.value[idxType])  const totalTypes = userData.metadataTypeByMetadata.length  const totalTypes = userData.metadataTypeByMetadata.length
    const totalTypes = userData.metadataTypeByMetadata.length
    // Toggle: if already open, close it
    if (flagMetadataType.value[idxType]) {
        flagMetadataType.value = Array(totalTypes).fill(false)
        flagMetadataValue.value = []   // collapse values too
        return
    }
    // Otherwise open this type and close others
    flagMetadataType.value = Array.from(
        { length: totalTypes },
        (_, i) => i === idxType
    )
    if (idxType > -1) {
        // Resize value accordion for this type (all closed initially)
        const valueCount = userData.metadataTypeByMetadata[idxType].arrayMetadata.length
        flagMetadataValue.value = Array(valueCount).fill(false)
    }
}
//
function showMetadataValue(idxType, idxValue) {
    const total = userData.metadataTypeByMetadata[idxType].arrayMetadata.length
    // Toggle: if already open, close it
    if (flagMetadataValue.value[idxValue]) {
        flagMetadataValue.value = Array(total).fill(false)
        return
    }
    // Otherwise open the selected value (and close others)
    flagMetadataValue.value = Array.from({ length: total }, (_, i) => i === idxValue)
    // console.log ("showMetadataValue ", flagMetadataValue)
    // Check if there are Articles that haven't been loaded into Viewed Articles
    const getLinks = userData
        .metadataTypeByMetadata[idxType]
        .arrayMetadata[idxValue]
        .articleListArray
        .some(el => el.idxViewedArticle < 0)
    if (getLinks) getArticleLinks(idxType, idxValue)
}
//
async function getArticleLinks(idxType, idxMetadataValue) {
    errorsStore.arrayErrors = [];
    const url = import.meta.env.VITE_SERVER_URL + '/streamTrove/MetadataLinks/' + userData.metadataTypeByMetadata[idxType].metadataType + ':' + idxMetadataValue;
    console.log('getArticleLinks -', url)
    const options = {
        method: "get",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const request = new Request(url, options);
    const fetchPromise = fetch(request);
    const response = await fetchPromise
        .catch(error => {
            errorsStore.arrayErrors.push({ msg: 'Server not available', param: '' });
            console.log('UserMetadataListView: Error in event handler:', error);
            return
        });
    // console.log (response);
    // iterate over all headers
    // for (let [key, value] of response.headers) {
    // console.log(`${key} = ${value}`);
    // }
    if (response.status == 200) {
        const data = await response.json();
        console.log('UserMetadataListView/getArticleLinks ', JSON.stringify(data))
        // Update Dup-licate and Ignored modifier
        if (data.linkedArticleUrls.length > 0) {
            data.linkedArticleUrls.forEach((el) => {
                el.articleArray.forEach((a, index) => {
                    if (a.includes(":")) {
                        userData.metadataTypeByMetadata[idxType].arrayMetadata[idxMetadataValue].articleListArray[index].troveArticleId = el
                    }
                })
            })
        }
    } else {
        console.log('UserMetadataListView ', response)
        if (response.hasOwnProperty('errors')) {
            errorsStore.arrayErrors = response.errors
        } else {
            errorsStore.arrayErrors.push({ msg: response.statusText, param: response.status });
        }
    }
}
</script>
//
<template>
    <div class="container-fluid">
        <h1>Metadata Items for User {{ userData.troveDetails.troveUserId }}
        </h1>
        <br>
        <p>This is a table of the {{ userData.metadataTypeByMetadata.length }} Metadata Types that {{
            userData.metadataValueTotal }} Metadata Items classify Articles
        </p>
        <div v-for="(type, idxType) in userData.metadataTypeByMetadata" :key="type.metadataType" class="card">
            <div class="card-header px-0 py-0">
                <button class="btn btn-link" @click.prevent="showMetadataType(idxType)">{{ type.metadataType }} [{{
                    type.arrayMetadata.length }}]
                </button>
            </div>
            <div v-show="flagMetadataType[idxType]">
                <div class="card-body px-0 py-0" v-for="(value, idxValue) in type.arrayMetadata"
                    :key="value.metadataValue">
                    <div>
                        <span>&nbsp;&nbsp;&nbsp;-&nbsp;</span>
                        <span v-if="value.articleListArray.length < 1">{{ value.metadataValue }} [{{
                            value.articleListArray.length
                        }}]</span>
                        <button v-else class="btn btn-link px-0 py-0"
                            @click.prevent="showMetadataValue(idxType, idxValue)">{{
                                value.metadataValue }} [{{ value.articleListArray.length }}]</button>
                    </div>
                    <div v-show="flagMetadataValue[idxValue]" class="card-body ml-3 px-0 py-0">
                        <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;</span>
                        <ArticleUrls :inline="true" :articleListArray="value.articleListArray" :troveListId="0">
                        </ArticleUrls>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style></style>
