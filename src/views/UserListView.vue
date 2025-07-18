<script setup>
import { useDoFetch } from '@/components/DoFetch.js';
import { useRouter } from 'vue-router';
const router = useRouter();
import { useUserDataStore } from '@/stores/userdata';
const userData = useUserDataStore();
import { useNavBarStore } from '@/stores/navbar';
const navStore = useNavBarStore();
import { useErrorsArrayStore } from '@/stores/errorsarray';
const errorsStore = useErrorsArrayStore();

const props = defineProps(['listId']);
navStore.listId = props.listId;
navStore.listHref = "/userListPage/" + props.listId;
navStore.listTabTitle = "List " + props.listId;
//
var idxList = userData.userLists.findIndex((item) => item.TroveListId == props.listId);
console.log('Linked Person ', userData.userLists[idxList].TroveListLinkedPerson)
//
function haveLink(article) {
  var haveLink = true;
  // console.log(`ListView haveLink article.TroveListArticleViewedIdx:%s`, article.TroveListArticleViewedIdx)
  if (article.TroveListArticleViewedIdx === undefined || article.TroveListArticleViewedIdx < 0) haveLink = false;
  return haveLink;
}
//
function statusColour(status) {
  switch (status) {
    case 0:
      return "badge text-bg-dark";
    case 10:
      return "badge text-bg-secondary";
    case 20:
      return "badge text-bg-warning";
    case 30:
      return "badge text-bg-primary";
    case 40:
      return "badge text-bg-info";
    case 50:
      return "badge text-bg-success";
    case 60:
      return "badge  custom-badge";
    default:
      return "";
  }
}
//
// Async load of List Articles - they will be SSE'd to App.vue sseUserListWithArticles
//
async function loadListArticles(firstLoad) {
  console.log('UserListView ', props.listId, firstLoad);
  const url = import.meta.env.VITE_SERVER_URL + "/userListPage/list/" + userData.userLists[idxList].TroveListId + "/" + firstLoad;
  const options = {
    method: "get",
    mode: "cors",
    credentials: "include", // to send HTTP only cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  useDoFetch('loadListArticles', url, options)
}
//  Post array of Ignored Article Id's
function ignoreArticles() {
  var items = [];
  userData.userListArticles[idxList].forEach((article) => {
    items.push({ id: article.TroveListArticleId });
  });
  // console.log("clicked Save Ignored action " + JSON.stringify(items));
  const ignored = { ignoreArticles: items };
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
// Get best Article Title
function getArticleTitle(article) {
  // Needs to have been read into viewedArticles
  if (article.TroveListArticleViewedIdx === undefined || article.TroveListArticleViewedIdx < 0) return article.TroveListArticleHeading;
  //
  const viewedArticle = userData.viewedArticles[article.TroveListArticleViewedIdx];
  if ((viewedArticle.hasOwnProperty("ViewedArticleSummaryText")) && (viewedArticle.ViewedArticleSummaryText.length > 0)) {
    // console.log('Article Title - SUmmary Text ', viewedArticle.ViewedArticleSummaryText)
    return viewedArticle.ViewedArticleSummaryText
  }
  //
  // console.log('Artilcle Title - Event ', JSON.stringify(viewedArticle.ViewedArticleMetadata))
  const idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "Event");
  if (idxEvent < 0) return article.TroveListArticleHeading;
  return viewedArticle.ViewedArticleMetadata[idxEvent][1];
}
//
loadListArticles('true')
</script>
<template>
  <h1>Trove List - {{ userData.userLists[idxList].TroveListId }} </h1>
  <h2>{{ userData.userLists[idxList].TroveListName }}</h2>
  <div class="card">
    <div class="card-body">
      <div class="card">
        - Linked Articles : {{ userData.userLists[idxList].TroveListItemCount }}
        <span v-if="userData.userLists[idxList].TroveListDescription.length > 1">
          - Description : {{ userData.userLists[idxList].TroveListDescription }}
        </span>
        - Updated : {{ userData.userLists[idxList].TroveListUpdatedText }}
        <span v-if="userData.userLists[idxList].TroveListLinkedPerson.length > 0">
          - Linked Person :
          <router-link
            :to="'/userPersonList/' + userData.userLists[idxList].TroveListLinkedPerson.replaceAll(' ', '%20')"
            class="link-primary">
            {{ userData.userLists[idxList].TroveListLinkedPerson }}
          </router-link>
        </span>
        <span v-else>
          - Link a <RouterLink to="/userPersonList/blank" class="link-primary"
            :class="{ disabled: navStore.disablePersonList }">
            Person</RouterLink>
        </span>
      </div>
      <div class="row">
        <div class="col">
          <div class="card">
            <a :href="userData.userLists[idxList].TroveListViewUrl" target="_blank" class="btn btn-primary"
              role="button">View List in Trove</a>
          </div>
        </div>
        <div class="col">
          <div class="card">
            <a @click.prevent="loadListArticles('false')" class="btn btn-primary" role="button">Reload List from
              Trove</a>
          </div>
        </div>
        <div class="col">
          <div class="card">
            <a @click.prevent="ignoreArticles()" class="btn btn-primary" role="button">Ignore All Articles</a>
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
            <th>Trove Id</th>
            <th>Date</th>
            <th>Article Status</th>
            <th>Article Name</th>
            <th>Article Source</th>
            <th>Link to Trove</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in userData.userListArticles[idxList]" :key="article.TroveListArticleId">
            <td class="text-nowrap">
              <router-link v-if="haveLink(article)"
                :to="'/editArticle/' + userData.userLists[idxList].TroveListId + '/' + article.TroveListArticleId"
                class="active link-primary">{{ article.TroveListArticleId }}</router-link>
              <p v-else>
                {{ article.TroveListArticleId }}
              </p>
            </td>
            <td class="text-nowrap">{{ article.TroveListArticlePubDate }}</td>
            <td><span :class="statusColour(article.TroveListArticleMinedStatus)">{{
              article.TroveListArticleMinedStatustext }}</span>
            </td>
            <td>{{ getArticleTitle(article) }}</td>
            <td>{{ article.TroveListArticleSource }}</td>
            <td><a :href="article.TroveListArticleViewUrl" target="_blank">Trove Link</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style></style>
