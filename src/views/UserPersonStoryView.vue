<script setup>
import { ref, reactive } from 'vue';
import { useDoFetch } from '@/components/DoFetch.js';
import { useRouter } from 'vue-router';
const router = useRouter();
import { useUserDataStore } from '@/stores/userdata';
const userData = useUserDataStore();
import { useNavBarStore } from '@/stores/navbar';
const navStore = useNavBarStore();
import { useErrorsArrayStore } from '@/stores/errorsarray';
const errorsStore = useErrorsArrayStore();
import EditItem from '@/components/EditItem.vue'

// navStore.listId = props.listId;
// navStore.listHref = "/userListPage/" + props.listId;
// navStore.listTabTitle = "List " + props.listId;
let storyEvents = []
let updateDisabled = ref(true)

//
// Load Person Story Event Article information from viewedArticles
//
async function loadArticleInfo(firstLoad) {
  console.log('UserPersonStoryView Person', JSON.stringify(navStore.savedPerson), firstLoad);
  const strPersonDob = navStore.savedPerson.readName.replace(/.*b\.(\d{4}).*/, "$1");
  const personDob = strPersonDob.length == 0 ? 0 : Number(strPersonDob)
  console.log('UserPersonStoryView Person DOB, Reference', personDob, navStore.savedPerson.readRefInfo);
  storyEvents = userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx];
  console.log('UserPersonStoryView Events', JSON.stringify(storyEvents));
  for (let event of storyEvents) {
    const viewedIdx = userData.viewedArticles.findIndex((el) => el.ViewedArticleId == event.articleId)
    if (viewedIdx == -1) {
      console.log('UserPersonStoryView Event article not found in Viewed Articles ', JSON.stringify(event));
      continue
    }
    const viewedArticle = userData.viewedArticles[viewedIdx]
    // console.log('UserPersonStoryView Event Include ', event.include);
    event.story = getArticleStory(event, viewedArticle)
    event.eventDate = getArticleDate(viewedArticle)
    event.age = personDob == 0 ? '-' : Number(event.eventDate.slice(0, 4)) - personDob
    event.eventLocation = getArticleLocation(viewedArticle)
    // console.log('viewed: ', JSON.stringify(viewedArticle))
    event.ViewedArticleViewUrl = viewedArticle.ViewedArticleViewUrl
  }
  storyEvents.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx] = storyEvents;
  console.log('UserPersonStoryView Updated Sorted Events', JSON.stringify(storyEvents));
}
//  Post array of Story Events
function updateStory() {
  userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx] = storyEvents
  const oldPersonData = {
    "action": "STORY",
    "personIndex": navStore.savedPerson.personIndex,
    "readName": navStore.savedPerson.readName,
    "storyStatus": 'Update',
    "linkedListId": navStore.savedPerson.linkedListId,
    "arrayRelated": navStore.savedPerson.arrayRelated,
    "personStoryIdx": navStore.savedPerson.personStoryIdx
  }
  const updateEvents = {
    "oldPersonData": oldPersonData,
    "updatedEvents": storyEvents.map((el) => ({ articleId: el.articleId, include: el.include }))
  }
  if (navStore.storyPersonNew) {
    updateEvents.storyStatus = 'Create'
  }
  console.log(`clicked Update Story %s`, + JSON.stringify(updateEvents));
  //
  const url = import.meta.env.VITE_SERVER_URL + "/updUserMetaData/updateMetaData";
  const options = {
    method: "post",
    mode: "cors",
    credentials: "include", // to send HTTP only cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    //make sure to serialize your JSON body
    body: JSON.stringify(updateEvents)
  };
  useDoFetch('updateStory', url, options);
  navStore.storyPersonNew = false
  updateDisabled.value = true
}
//  
function reloadStory() {
  //
  const url = import.meta.env.VITE_SERVER_URL + "/searchTrove/updateIgnored";
  const options = {
    method: "post",
    mode: "cors",
    credentials: "include", // to send HTTP only cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    //make sure to serialize your JSON body
    body: JSON.stringify(ignored)
  };
  useDoFetch('Ignore List Articles', url, options);
  navStore.listId = 0;
  navStore.listHref = "";
  navStore.listTabTitle = "List";
  router.push({ name: 'userTroveLists' });
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
  updateDisabled.value = false
  switch (action) {
    case 'Include':
      storyEvents[index].include = true
      break;
    case 'Exclude':
      storyEvents[index].include = false
      break;
    default:
      break;
  }
}
//
function openArticle(articleLink) {
  console.log('serPersonStory/openArticle ', articleLink)
  navStore.listId = articleLink.articleId;
  navStore.articleId = articleLink.articleId;
  router.push({ name: 'editArticle' });
}
//
loadArticleInfo('true')
</script>
<template>
  <h1>Story Of</h1>
  <h2>{{ navStore.savedPerson.readName }}</h2>
  <h3>{{ navStore.savedPerson.readRefInfo }}</h3>
  <div class="card">
    <div class="card-body">
      <div class="row">
        <div class="col">
          <div class="card">
            <router-link :to="'/userPersonList'" custom v-slot="{ navigate }">
              <button class="btn btn-primary" :disabled="!updateDisabled" @click="navigate()">
                View Person
              </button>
            </router-link>
          </div>
        </div>
        <div class="col">
          <div class="card">
            <button @click.prevent="updateStory()" class="btn btn-primary" :disabled="updateDisabled">Update
              Story</button>
          </div>
        </div>
        <div class="col">
          <div class="card">
            <button @click.prevent="reloadStory()" class="btn btn-primary" :disabled="!updateDisabled">Reload
              Story</button>
          </div>
        </div>
        <div class="col">
          <div class="card">
            <button @click.prevent="reloadStory()" class="btn btn-primary" :disabled="!updateDisabled">PDF
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
            <th class="text-center">Location</th>
            <th class="text-center">Article</th>
            <th class="text-center">Trove</th>
            <th class="text-center">Event</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(article, index) in storyEvents" :key="article.articleId">
            <td class="text-center">
              <EditItem v-if="article.include" @click-item="updateInclude('Exclude', index)" action="Included"
                icon="bi-check-square" />
              <EditItem v-if="!article.include" @click-item="updateInclude('Include', index)" action="Excluded"
                icon="bi-x-square" />
            </td>
            <td class="text-nowrap">{{ article.eventDate }}</td>
            <td class="text-center">{{ article.age }}</td>
            <td class="text-nowrap">{{ article.eventLocation }}</td>
            <td class="text-nowrap">
              <!-- <router-link :to="'/editArticle/' + article.listId + '/' + article.articleId"
                class="active link-primary">{{ article.articleId }}</router-link> -->
              <a v-if="articleLink.idxViewedArticle" href="#" @click.prevent="openArticle(article)">
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
</style>
