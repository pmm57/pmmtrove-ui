<script setup>
import { ref, nextTick, watch } from 'vue'
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
// var showMetdataValueIdx = -1
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
        const uiId = userData.getCurrentInteractionId()
        console.log(`UserMetadataListView/watch ${uiId} triggerGetArticleLinks:`, triggerGetArticleLinks)
        if (triggerGetArticleLinks) {
            triggerGetArticleLinks = false
            return
        }
        // console.log(`UserMetadataListView/watch All %s`, JSON.stringify(userData.metadataTypeByMetadata))
        console.log(`UserMetadataListView/watch ${uiId} Type:`, JSON.stringify(userData.metadataTypeByMetadata[showMetdataTypeIdx]))
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
    const uiId = userData.getNextInteractionId()
    console.log(`UserMetadataListView/showMetadataType ${uiId}`, idxType)
    // Wait for Vue to apply the latest metadata update
    await nextTick()
    // console.log('showMetadataType ', idxType, flagMetadataType.value, flagMetadataType.value[idxType])  const totalTypes = userData.metadataTypeByMetadata.length  const totalTypes = userData.metadataTypeByMetadata.length
    const totalTypes = userData.metadataTypeByMetadata.length
    // Toggle: if already open, close it
    if (flagMetadataType.value[idxType]) {
        console.log(`UserMetadataListView/showMetadataType ${uiId} closing accordion`)
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
    console.log(`UserMetadataListView/showMetadataType ${uiId} opening type at index`, idxType)
    showMetdataTypeIdx = idxType
    if (idxType > -1) {
        // Resize value accordion for this type (all closed initially)
        const valueCount = userData.metadataTypeByMetadata[idxType].arrayMetadata.length
        flagMetadataValue.value = Array(valueCount).fill(false)
    }
}
//
function showMetadataValue(idxType, idxValue) {
    const uiId = userData.getNextInteractionId()
    console.log(`UserMetadataListView/showMetadataValue ${uiId}`, idxType, idxValue)
    const total = userData.metadataTypeByMetadata[idxType].arrayMetadata.length
    // Toggle: if already open, close it
    if (flagMetadataValue.value[idxValue]) {
        console.log(`UserMetadataListView/showMetadataValue ${uiId} closing value`)
        flagMetadataValue.value = Array(total).fill(false)
        // showMetdataValueIdx = -1
        return
    }
    // Otherwise open the selected value (and close others)
    console.log(`UserMetadataListView/showMetadataValue ${uiId} opening value at index`, idxValue)
    flagMetadataValue.value = Array.from({ length: total }, (_, i) => i === idxValue)
    // Check if there are Articles that haven't been loaded into Viewed Articles
    // showMetdataValueIdx = idxValue
    console.log(`UserMetadataListView/showMetadataValue ${uiId} articleListArray:`, JSON.stringify(userData.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray))
    const getLinks = userData
        .metadataTypeByMetadata[idxType]
        .arrayMetadata[idxValue]
        .articleListArray
        .some(el => el.idxViewedArticle < 0)
    if (getLinks) getArticleLinks(idxType, idxValue, uiId)
}
//
async function getArticleLinks(idxType, idxMetadataValue, uiId) {
    console.log(`UserMetadataListView/getArticleLinks ${uiId} fetching metadata type:`, userData.metadataTypeByMetadata[idxType].metadataType, 'value index:', idxMetadataValue)
    triggerGetArticleLinks = true
    errorsStore.arrayErrors = [];
    const url = '/streamTrove/MetadataLinks/' + userData.metadataTypeByMetadata[idxType].metadataType + ':' + idxMetadataValue + '?uiInteractionId=' + uiId;
    console.log(`UserMetadataListView/getArticleLinks ${uiId} url:`, url)
    const options = {
        method: "get",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const data = await useDoFetch('metadatarticleLinks', url, options, uiId);
    if (typeof data != 'boolean'){
        console.log(`UserMetadataListView/getArticleLinks ${uiId} received data:`, JSON.stringify(data))
        // Update Dup-licate and Ignored modifier
        if (data.linkedArticleUrls.arrayArticleUrls.length > 0) {
            userData.metadataTypeByMetadata[idxType].arrayMetadata[idxMetadataValue].articleListArray = data.linkedArticleUrls.arrayArticleUrls
            console.log(`UserMetadataListView/getArticleLinks ${uiId} updated articleListArray:`, JSON.stringify(userData.metadataTypeByMetadata[idxType].arrayMetadata[idxMetadataValue]))
        }
    }
}
//
function flipStoryPrimaryEvent(idxValue) {
    const uiId = userData.getNextInteractionId()
    // Event Metadata can have storyStatus - isPrimary
    const thisEvent = {
        ...userData.metadataTypeByMetadata[idxMetatypeEvent].arrayMetadata[idxValue]
    }
    console.log(`UserMetadataListView/flipStoryPrimaryEvent ${uiId} current Event:`, JSON.stringify(thisEvent))
    var updateUserEvent = {
        'action': 'CHG',
        'userId': userData.troveDetails.troveUserId,
        'event': thisEvent.metadataValue,
        'isPrimary': !thisEvent.isPrimary,
        'uiInteractionId': uiId
    };
    console.log(`UserMetadataListView/flipStoryPrimaryEvent ${uiId} flipped Event:`, JSON.stringify(updateUserEvent))
    // console.log (updatedData);
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
    console.log(`UserMetadataListView/flipStoryPrimaryEvent ${uiId} sending POST to backend`)
    // console.log (options);
    useDoFetch('flipStoryPrimaryEvent', "/updUserMetaData/userEventMetadata", options, uiId);
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
                            <ArticleUrls :key="value.articleListArray.map(a => `${a.troveListId}-${a.troveArticleId}-${a.idxViewedArticle}`).join(',')"
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
