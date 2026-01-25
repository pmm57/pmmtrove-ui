<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import ArticleUrls from '@/components/ArticleUrls.vue'
import { useDoFetch } from '@/components/DoFetch.js';
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
// Array to do accordian transition by Metadata Type
const flagMetadataType = ref([])
const flagMetadataValue = ref([])
var triggerGetArticleLinks = false
var showMetdataTypeIdx = -1
var showMetdataValueIdx = -1
const idxMetatypeEvent = userData.metadataTypeByMetadata.findIndex((el) => el.metadataType === "Event");
const idxMetatypePerson = userData.metadataTypeByMetadata.findIndex((el) => el.metadataType === "Person");
//
const titleForStoryEvent = (event) =>
    event.isPrimary
        ? "Unset as Story Primary Event"
        : "Set as Story Primary Event"

const labelForStoryEvent = (event) =>
    event.isPrimary ? "Unset" : "Set"
//
showMetadataType(-1)
// console.log("STORE PROPERTIES:", Object.keys(userData))
// console.log("FIELD PROXY?", userData.metadataTypeByMetadata)
// console.log("FIELD RAW?", JSON.stringify(userData.metadataTypeByMetadata))
// Run accordion initialization ONLY when metadata is available
watch(
    () => userData.metadataTypeByMetadata,
    (newVal) => {
        console.log(`UserMetadataListView/watch triggerGetArticleLinks %s`, triggerGetArticleLinks)
        if (triggerGetArticleLinks) {
            triggerGetArticleLinks = false
            return
        }
        // console.log(`UserMetadataListView/watch All %s`, JSON.stringify(userData.metadataTypeByMetadata))
        console.log(`UserMetadataListView/watch Type %s`, JSON.stringify(userData.metadataTypeByMetadata[showMetdataTypeIdx]))
        if (newVal.length > 0) {
            // flagMetadataType.value[showMetdataTypeIdx] = false
            // showMetadataType(showMetdataTypeIdx)
            // if (showMetdataValueIdx > -1) {
            //     flagMetadataValue.value[showMetdataValueIdx] = false
            //     showMetadataValue(showMetdataTypeIdx, showMetdataValueIdx)
            // }
        }
    },
    { deep: true, immediate: true }
)
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
        showMetdataTypeIdx = -1
        return
    }
    // Otherwise open this type and close others
    flagMetadataType.value = Array.from(
        { length: totalTypes },
        (_, i) => i === idxType
    )
    console.log('UserMetdataListView showMetadataType', idxType)
    showMetdataTypeIdx = idxType
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
        showMetdataValueIdx = -1
        return
    }
    // Otherwise open the selected value (and close others)
    console.log("showMetadataValue ", flagMetadataValue.value[idxValue])
    flagMetadataValue.value = Array.from({ length: total }, (_, i) => i === idxValue)
    console.log("showMetadataValue ", flagMetadataValue.value[idxValue])
    // Check if there are Articles that haven't been loaded into Viewed Articles
    showMetdataValueIdx = idxValue
    console.log('UserMetdataListView showMetadataValue', idxType, idxValue, JSON.stringify(userData.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray))
    const getLinks = userData
        .metadataTypeByMetadata[idxType]
        .arrayMetadata[idxValue]
        .articleListArray
        .some(el => el.idxViewedArticle < 0)
    if (getLinks) getArticleLinks(idxType, idxValue)
}
//
async function getArticleLinks(idxType, idxMetadataValue) {
    triggerGetArticleLinks = true
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
        if (data.linkedArticleUrls.arrayArticleUrls.length > 0) {
            userData.metadataTypeByMetadata[idxType].arrayMetadata[idxMetadataValue].articleListArray = data.linkedArticleUrls.arrayArticleUrls
            console.log('UserMetadataListView/getArticleLinks ', JSON.stringify(userData.metadataTypeByMetadata[idxType].arrayMetadata[idxMetadataValue]))
            // data.linkedArticleUrls.forEach((el) => {
            //     el.articleArray.forEach((a, index) => {
            //         if (a.includes(":")) {
            //             userData.metadataTypeByMetadata[idxType].arrayMetadata[idxMetadataValue].articleListArray[index].troveArticleId = el
            //         }
            //     })
            // })
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
//
function flipStoryPrimaryEvent(idxValue) {
    // Event Metadata can have storyStatus - isPrimary
    const thisEvent = {
        ...userData.metadataTypeByMetadata[idxMetatypeEvent].arrayMetadata[idxValue]
    }
    console.log('UserMetadataListView/flipStoryPrimaryEvent Event ', JSON.stringify(thisEvent))
    var updateUserEvent = {
        'action': 'CHG',
        'userId': userData.troveDetails.troveUserId,
        'event': thisEvent.metadataValue,
        'isPrimary': !thisEvent.isPrimary
    };
    console.log('UserMetadataListView/flipStoryPrimaryEvent Flipped Event ', JSON.stringify(updateUserEvent))
    // console.log (updatedData);
    const url = import.meta.env.VITE_SERVER_URL + "/updUserMetaData/userEventMetadata";
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        //make sure to serialize your JSON body
        body: JSON.stringify(updateUserEvent)
    };
    // console.log (options);
    useDoFetch('flipStoryPrimaryEvent', url, options);
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
            <template v-if="idxType != idxMetatypePerson">
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
                            <template v-if="idxType == idxMetatypeEvent">
                                <span>&nbsp;-&nbsp;</span>
                                <button class="btn btn-outline-info btn-sm px-1 py-0" style="line-height: .75;"
                                    data-bs-toggle="tooltip" data-bs-placement="top" :title="titleForStoryEvent(value)"
                                    @click.prevent="flipStoryPrimaryEvent(idxValue)">{{ labelForStoryEvent(value)
                                    }}</button>
                            </template>
                        </div>
                        <div v-show="flagMetadataValue[idxValue]" class="card-body ml-3 px-0 py-0">
                            <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;</span>
                            <ArticleUrls :key="value.articleListArray.map(a => a.idxViewedArticle).join(',')"
                                :inline="true" :articleListArray="[...value.articleListArray]">
                            </ArticleUrls>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style></style>
