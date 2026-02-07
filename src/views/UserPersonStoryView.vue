<script setup>
import { ref, watch, computed, reactive } from 'vue';
import { useDoFetch } from '@/components/DoFetch.js';
import { useRouter } from 'vue-router';
const router = useRouter();
import { useUserDataStore } from '@/stores/userdata';
const userData = useUserDataStore();
import { useNavBarStore } from '@/stores/navbar';
const navStore = useNavBarStore();
import { useSavePersonData } from '@/components/SavePersonData.js';
import EditItem from '@/components/EditItem.vue'

let storyEvents = ref([])
let updatesEnabled = ref(false)
let chgInclude = false
let chgWhat = false
let storyShowWhat = ref(true)
storyShowWhat.value = navStore.savedPerson.storyShowWhat
console.log(`storyShowWhat %s`, navStore.savedPerson.storyShowWhat)
const filteredEvents = computed(() =>
    storyEvents.value.filter(a => {
        const showWhat = storyShowWhat.value
        if (showWhat.includes('ALL')) return true
        if (showWhat.includes('INC')) return a.include
        if (showWhat.includes('PRM')) return a.isPrimary
    }
    )
)
const showWhat = reactive([
    { label: 'All', active: false },
    { label: 'Primary', active: false },
    { label: 'Included', active: false }
])
const inShowWhat = navStore.savedPerson.storyShowWhat
if (inShowWhat.includes('ALL')) showWhat[0].active = true
if (inShowWhat.includes('INC')) showWhat[2].active = true
if (inShowWhat.includes('PRM')) showWhat[1].active = true

//
// Load Person Story Event Article information from viewedArticles
//
async function loadArticleInfo(firstLoad) {
    console.log('UserPersonStoryView Person', JSON.stringify(navStore.savedPerson), firstLoad);
    const strPersonDob = navStore.savedPerson.readName.replace(/.*b\.(\d{4}).*/, "$1");
    const personDob = strPersonDob.length == 0 ? 0 : Number(strPersonDob)
    console.log('UserPersonStoryView Person DOB, Reference', personDob, navStore.savedPerson.readRefInfo);
    storyEvents.value = JSON.parse(JSON.stringify(
        userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx]
    ));
    console.log('UserPersonStoryView Events Articles', JSON.stringify(storyEvents.value.map((el) => el.articleId)));
    // console.log('UserPersonStoryView Events Articles', JSON.stringify(storyEvents));
}
//  Post array of Story Events
function updateStory() {
    userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx] = storyEvents.value
    navStore.savedPerson.storyShowWhat = storyShowWhat.value
    const oldPersonData = {
        "action": "STORY",
        "personIndex": navStore.savedPerson.personIndex,
        "readName": navStore.savedPerson.readName,
        "storyStatus": 'Update',
        "storyShowWhat": navStore.savedPerson.storyShowWhat,
        "linkedListId": navStore.savedPerson.linkedListId,
        "arrayRelated": navStore.savedPerson.arrayRelated,
        "personStoryIdx": navStore.savedPerson.personStoryIdx
    }
    if (navStore.storyPersonNew) {
        oldPersonData.storyStatus = 'Create'
    }
    const updateEvents = {
        "updatedEvents": storyEvents.value.map((el) => ({ articleId: el.articleId, include: el.include })),
        "chgPersonStoryShowWhat": storyShowWhat.value
    }
    useSavePersonData('Save Story', oldPersonData, updateEvents);
    // console.log(`clicked Update Story %s`, + JSON.stringify(updateEvents));
    // //
    // const url = import.meta.env.VITE_SERVER_URL + "/updUserMetaData/updateUserPersonMetadata";
    // const options = {
    //     method: "post",
    //     mode: "cors",
    //     credentials: "include", // to send HTTP only cookies
    //     headers: {
    //         'Accept': 'application/json',
    //         'Content-Type': 'application/json'
    //     },
    //     //make sure to serialize your JSON body
    //     body: JSON.stringify(updateEvents)
    // };
    // useDoFetch('updateStory', url, options);
    navStore.storyPersonNew = false
    updatesEnabled.value = false
    chgInclude = false
    chgWhat = false
}
//  
function reloadStory() {
    //
    const reload = {}
    reload.oldPersonData = {
        "action": "STORY",
        "personIndex": navStore.savedPerson.personIndex,
        "readName": navStore.savedPerson.readName,
        "storyStatus": 'Reload',
        "storyShowWhat": navStore.savedPerson.storyShowWhat,
        "linkedListId": navStore.savedPerson.linkedListId,
        "arrayRelated": navStore.savedPerson.arrayRelated,
        "personStoryIdx": navStore.savedPerson.personStoryIdx
    }
    useSavePersonData('Reload Story', reload, {});
    // console.log(`UserPersonStoryView/reloadStory %s`, JSON.stringify(reload));
    // //
    // const url = import.meta.env.VITE_SERVER_URL + "/updUserMetaData/updateUserPersonMetadata";
    // const options = {
    //     method: "post",
    //     mode: "cors",
    //     credentials: "include", // to send HTTP only cookies
    //     headers: {
    //         'Accept': 'application/json',
    //         'Content-Type': 'application/json'
    //     },
    //     //make sure to serialize your JSON body
    //     body: JSON.stringify(reload)
    // };
    // useDoFetch('loadStory', url, options);
}
//
function updateFromViewedArticles() {
    console.log('UserPersonStoryView/updateFromViewedArticles Watch Trigger');
    for (let event of storyEvents.value) {
        const viewedIdx = userData.viewedArticles.findIndex((el) => el.ViewedArticleId == event.articleId)
        if (viewedIdx == -1) {
            console.log('UserPersonStoryView/updateFromViewedArticles Event article not found in Viewed Articles ', JSON.stringify(event));
            continue
        }
        const viewedArticle = userData.viewedArticles[viewedIdx]
        // console.log('UserPersonStoryView Event Include ', event.include);
        event.story = getArticleStory(event, viewedArticle)
        event.eventDate = getArticleDate(viewedArticle)
        event.age = personDob == 0 ? '-' : Number(event.eventDate.slice(0, 4)) - personDob
        event.isPrimary = getArticleEventIsPrimary(event, viewedArticle)
        event.eventLocation = getArticleLocation(viewedArticle)
        // console.log('viewed: ', JSON.stringify(viewedArticle))
        event.ViewedArticleViewUrl = viewedArticle.ViewedArticleViewUrl
    }
    userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx] = storyEvents.value;
    console.log('UserPersonStoryView/updateFromViewedArticles Watch Trigger', JSON.stringify(storyEvents.value));
}
// Get best Article Story
function getArticleStory(event, viewedArticle) {
    //
    var story = ''
    if ((viewedArticle.hasOwnProperty("ViewedArticleSummaryText")) && (viewedArticle.ViewedArticleSummaryText.length > 0)) {
        // console.log('Article story - Summary Text ', viewedArticle.ViewedArticleSummaryText)
        story = viewedArticle.ViewedArticleSummaryText
    } else {
        // console.log('Article story - Event ', JSON.stringify(viewedArticle.ViewedArticleMetadata))
        const idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "Event");
        if (idxEvent > -1) {
            story = viewedArticle.ViewedArticleMetadata[idxEvent][1];
        } else {
            story = viewedArticle.TroveListArticleHeading;
        }
    }
    if (event.eventKinship == 'self') return story
    story += '\n<u>From</u> "' + event.eventPerson + '" ( ' + event.eventKinship + ' )'
    return story
}
// Idnitfy if a Primary Event
function getArticleEventIsPrimary(event, viewedArticle) {
    //
    console.log(`getArticleEventIsPrimary - Event %s - Metadata`, JSON.stringify(event), JSON.stringify(viewedArticle.ViewedArticleMetadata))
    if (event.eventKinship == 'self') return true
    var eventIsPrimary = false
    const idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "Event");
    if (idxEvent > -1) eventIsPrimary = viewedArticle.ViewedArticleMetadata[idxEvent][3];
    return eventIsPrimary
}
// Get best Article Date
function getArticleDate(viewedArticle) {
    //
    // console.log('Article Date - Event ', JSON.stringify(viewedArticle.ViewedArticleMetadata))
    const idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "EventDate");
    if (idxEvent < 0) return viewedArticle.ViewedArticlePubDate;
    return viewedArticle.ViewedArticleMetadata[idxEvent][1];
}
// Get best Article Location
function getArticleLocation(viewedArticle) {
    //
    // console.log('Article Location - Event ', JSON.stringify(viewedArticle.ViewedArticleMetadata))
    var idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "EventPlace");
    if (idxEvent > -1) return viewedArticle.ViewedArticleMetadata[idxEvent][1];
    idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "PublishLocation");
    if (idxEvent > -1) {
        // console.log('Article Location - Event ', idxEvent, JSON.stringify(viewedArticle.ViewedArticleMetadata[idxEvent]))
        return viewedArticle.ViewedArticleMetadata[idxEvent][1];
    }
    return ''
}
function updateInclude(action, index) {
    const storyIdx = storyEvents.value.findIndex(e => e.articleId == filteredEvents.value[index].articleId)
    console.log(`UserPersonStory/updateInclude index %s Filtered Line %s`, storyIdx, JSON.stringify(filteredEvents.value[index]))
    switch (action) {
        case 'Include':
            storyEvents.value[storyIdx].include = true
            // filteredEvents.value[index].include = true
            break;
        case 'Exclude':
            storyEvents.value[storyIdx].include = false
            // filteredEvents.value[index].include = false
            break;
        default:
            break;
    }
    // Are we back to where we started
    const same = userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx].every((item, i) => item.include === storyEvents.value[i].include);
    if (same) {
        chgInclude = false
        if (!chgWhat) updatesEnabled.value = false
    } else {
        chgInclude = true
        updatesEnabled.value = true
    }
    // console.log(`UserPersonStory/updateInclude action %s index %s include %s same %s chgInclude %s chgWhat %s updatesEnable %s`,
    //     action, index, storyEvents[index].include, same, chgInclude, chgWhat, updatesEnabled.value)
}
//
function openArticle(articleLink) {
    console.log('UserPersonStory/openArticle ', JSON.stringify(articleLink))
    navStore.listId = articleLink.listId;
    navStore.articleId = articleLink.articleId;
    router.push({ name: 'editArticle' });
}
//
function setShowWhat(btnIdx) {
    console.log(`UserPersonStory/setShowWhat %s`, btnIdx, JSON.stringify(showWhat[btnIdx]))
    switch (btnIdx) {
        case 0: // Show All
            showWhat[0].active = !showWhat[0].active
            if (showWhat[0].active) { //Flipped True
                showWhat[1].active = false
                showWhat[2].active = false
            }
            break
        case 1: // Show All isPrimary
            showWhat[1].active = !showWhat[1].active
            if (showWhat[1].active) { //Flipped True
                showWhat[0].active = false
                showWhat[2].active = false
            } else {
                if (!showWhat[2].active) showWhat[0].active = true
            }
            break
        case 2: // Included / Excluded - Overides isPrimary
            showWhat[2].active = !showWhat[2].active
            if (showWhat[2].active) { //Flipped True
                showWhat[0].active = false
                showWhat[1].active = false
            } else {
                if (!showWhat[1].active) showWhat[0].active = true
            }
            break
        default:
    }
    // Setup 
    if (showWhat[0].active) storyShowWhat.value = 'ALL'
    if (showWhat[1].active) storyShowWhat.value = 'PRM'
    if (showWhat[2].active) storyShowWhat.value = 'INC'
    if (storyShowWhat.value == navStore.savedPerson.storyShowWhat) {
        chgWhat = false
        if (!chgInclude) updatesEnabled.value = false
    } else {
        chgWhat = true
        updatesEnabled.value = true
    }
    console.log(`UserPersonStory/setShowWhat showWhat %s - %s`, JSON.stringify(showWhat), storyShowWhat.value)
}
//
watch(
    () => useUserDataStore().viewedArticles,
    () => {
        updateFromViewedArticles()
    },
    { deep: false } // ✅ array reference changes only (immutable-friendly)
)
//
function openPdfTab(html) {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
}
//
function printStory() {
    let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>PDF Preview</title>
        <meta charset="utf-8" />
        <style>
        @page {
          size: A4 landscape;
          margin: 20mm;
        }

        body {
          font-family: Arial, sans-serif;
          font-size: 12pt;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 4px 6px;
          vertical-align: top;
        }

        .text-center { text-align: center; }
        .text-nowrap { white-space: nowrap; }
        .preserve { white-space: pre-wrap; 
        </style>
      </head>
      <body>`
    html += `<h1>` + navStore.savedPerson.readName + `</h1>`
    if (navStore.savedPerson.readRefInfo.length > 0) html += `<h3> Reference: ` + navStore.savedPerson.readRefInfo + `</h3>`
    html += `<table>
                <thead>
                    <tr>
                        <th class="text-center">Date</th>
                        <th class="text-center">Age</th>
                        <th class="text-center">Location</th>
                        <th class="text-center">Trove Link</th>
                        <th class="text-center">Event</th>
                    </tr>
                </thead>
                <tbody>`
    for (const article of filteredEvents.value) {
        html += `<tr><td class="text-nowrap">` + article.eventDate + `</td>`
        html += `<td class="text-center">` + article.age + `</td>`
        html += `<td class="text-nowrap">` + article.eventLocation + `</td>`
        html += `<td class="text-center"><a href="` + article.ViewedArticleViewUrl + `" target="_blank">Link</a></td>`
        html += `<td class="preserve" style="border-bottom: .5px solid;">` + article.story + `</td>`
    }
    html += `<script>
          window.onload = () => window.print();
        <\/script>`
    html += `</body>
    </html>
  `;
    openPdfTab(html);
}
//
loadArticleInfo('true')
</script>
<template>
    <h1>Story Of</h1>
    <h2>{{ navStore.savedPerson.readName }}</h2>
    <h3 v-if="navStore.savedPerson.readRefInfo.length > 0">Reference: {{ navStore.savedPerson.readRefInfo }}</h3>
    <div class="card">
        <div class="card-body">
            <div class="row">
                <div class="col">
                    <div class="card">
                        <router-link :to="'/userPersonList'" custom v-slot="{ navigate }">
                            <button class="btn btn-primary" :disabled="updatesEnabled" @click="navigate()">
                                View Person
                            </button>
                        </router-link>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button @click.prevent="updateStory()" class="btn btn-primary half-height-text"
                            :disabled="!updatesEnabled">Save
                            Show Event Change</button>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button type="button" class="btn btn-primary no-hover half-height-btn">
                            Show Events
                        </button>
                        <div class="btn-group" role="group">
                            <button v-for="(btn, i) in showWhat" :key="i"
                                class="btn btn-primary push-btn half-height-btn" :class="{ active: btn.active }"
                                @click="setShowWhat(i)">
                                {{ btn.label }}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button @click.prevent="reloadStory()" class="btn btn-primary" :disabled="updatesEnabled">Reload
                            Story</button>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button @click.prevent="printStory()" class="btn btn-primary">PDF
                            Story</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <br>
    <div class="card">
        <div class="card-body w-100">
            <table>
                <thead>
                    <tr>
                        <th>Include</th>
                        <th class="text-center">Date</th>
                        <th class="text-center">Age</th>
                        <th class="text-center">Primary</th>
                        <th class="text-center">Location</th>
                        <th class="text-center">Article</th>
                        <th class="text-center">Trove</th>
                        <th class="text-center">Event</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(article, index) in filteredEvents" :key="article.articleId">
                        <td class="text-center">
                            <EditItem v-if="article.include" @click-item="updateInclude('Exclude', index)"
                                action="Included" icon="bi-check-square" />
                            <EditItem v-if="!article.include" @click-item="updateInclude('Include', index)"
                                action="Excluded" icon="bi-x-square" />
                        </td>
                        <td class="text-nowrap">{{ article.eventDate }}</td>
                        <td class="text-center">{{ article.age }}</td>
                        <td class="text-center">
                            <span v-if="article.isPrimary">
                                <i class="bi-check-circle-fill"></i>
                            </span>
                            <span v-else>
                                <i class="bi-circle"></i>
                            </span>
                        </td>
                        <td class="text-nowrap">{{ article.eventLocation }}</td>
                        <td class="text-nowrap">
                            <a href="#" @click.prevent="openArticle(article)">
                                {{ article.articleId }}
                            </a>
                        </td>
                        <td class="text-center"><a :href="article.ViewedArticleViewUrl" target="_blank">Link</a></td>
                        <td v-html="article.story" class="preserve" style="border-bottom: .5px solid;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style>
.preserve {
    white-space: pre-line;
    /* respects \n as line breaks */
}

.half-height-text {
    font-size: 0.9rem;
    /* slightly smaller text */
    padding-top: 0.5rem;
    /* matches Bootstrap’s natural height */
    padding-bottom: 0.5rem;

}

.no-hover:hover {
    background-color: var(--bs-primary) !important;
    border-color: var(--bs-primary) !important;
    color: #fff !important;
    cursor: default !important;
}

.half-height-btn {
    padding-top: 0.15rem;
    padding-bottom: 0.15rem;
    font-size: 0.75rem;
    line-height: 1rem;
    height: 1.25rem;
    /* optional: forces consistent height */
}

.push-btn {
    background-color: var(--bs-primary);
    color: #fff;
    border: 1px solid var(--bs-primary);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.4);
    transition: all 0.1s ease;
}


.push-btn.active {
    background-color: #b6f7b6;
    /* light green */
    color: #000;
    box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.6);
    transform: translateY(2px);
}
</style>
