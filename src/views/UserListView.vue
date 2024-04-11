<script setup>
  import { useUserDataStore } from '@/stores/userdata'
  const userData = useUserDataStore()
  import { useNavBarStore } from '@/stores/navbar'
  const navStore = useNavBarStore()
  import { useErrorsArrayStore } from '@/stores/errorsarray'
  const errorsStore = useErrorsArrayStore()

  const props = defineProps(['listId'])
  console.log ('UserListView ', props.listId)
  navStore.listId = props.listId
  navStore.listHref = "/userListPage/" + props.listId
  navStore.listTabTitle = "List " + props.listId
  //
  var idxList = userData.userLists.findIndex((item) => item.TroveListId == props.listId);
  // console.log ('UserListView.viewIndex ', props.listId, idxList)
  //
  function haveLink (article) {
    var haveLink = true
    if (article.TroveListArticleMinedStatustext == "") haveLink = false;
    return haveLink
  }
  //
  // Async load of List Articles - they willbe SSE'd to App.vue
  //
  async function loadListArticles (firstLoad) {
    const url = "https://localhost:3000/userListPage/list/" + userData.userLists[idxList].TroveListId + "/" + firstLoad;
    const options = {                
              method: "get",
              mode: "cors", 
              credentials : "include", // to send HTTP only cookies
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              }
          };
    const request = new Request(url, options);
    const fetchPromise = fetch(request);
    const response = await fetchPromise
        .catch (error => {
            errorsStore.errors.push({msg : 'Server not available', param : ''});
            console.log('verifyServerUp: Error in event handler::', error);
            return
        });
    // console.log (response);
    // iterate over all headers
    // for (let [key, value] of response.headers) {
    // console.log(`${key} = ${value}`);
    // }
    console.log("loadListArticles: response.status =", response.status);
    if (response.status == 200) {
      const data = await response.json();
      console.log ('data ', data)
    } else {
        errorsStore.errors = response.error
    }             
  }
  //
  loadListArticles ('true')
</script>
<template>
  <h1>User {{userData.troveUserId}} Trove List -
      {{ userData.userLists[idxList].TroveListName }} ( {{userData.userLists[idxList].TroveListId}} )
  </h1>
  <div class="card">
    <div class="card-body">
      <div class="card">
        {{userData.userLists[idxList].TroveListItemCount}} Linked Articles
        <span v-if="userData.userLists[idxList].TroveListDescription.length > 1">
         - Description - {{userData.userLists[idxList].TroveListDescription}}
         </span>
         - Updated {{userData.userLists[idxList].TroveListUpdatedText}}
       </div>
      <div class="row">
        <div class="col">
          <div class="card">
            <a :href="userData.userLists[idxList].TroveListViewUrl" target="_blank" class="btn btn-primary" role="button">View List in Trove</a>
          </div>
        </div>
        <div class="col">
          <div class="card">
            <a @click="loadListArticles ('false')" class="btn btn-primary" role="button">Reload List from Trove</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <br>
  <div class="card">
    <div class="card-body w-100">
      <table> 
        <tr>
          <th>Trove Id</th> 
          <th>Article Name</th>
          <th>Article Source</th> 
          <th>Date</th> 
          <th>Article Status</th>
          <th>Link to Trove</th>
        </tr>
        <tr v-for="article in userData.userLists[idxList].TroveListArticles" :key="article.TroveListArticleId">
          <td class="text-nowrap">
            <router-link v-if="haveLink(article)" :to="'/editArticle/' + userData.userLists[idxList].TroveListId + '/' + article.TroveListArticleId"  class="active link-primary">{{ article.TroveListArticleId }}</router-link>
            <p v-else>
              {{article.TroveListArticleId}}
            </p>
          </td>
          <td>{{article.TroveListArticleHeading}}</td>
          <td>{{article.TroveListArticleSource}}</td>
          <td class="text-nowrap">{{article.TroveListArticlePubDate}}</td>
          <td>{{article.TroveListArticleMinedStatustext}}</td>
          <td><a :href="article.TroveListArticleViewUrl" target="_blank">Trove Link</a></td>
        </tr>
      </table>
    </div>
  </div>
</template>

<style>
</style>
