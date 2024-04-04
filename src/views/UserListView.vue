<script setup>
  import { useUserDataStore } from '@/stores/userdata'
  const userDataStore = useUserDataStore()
  import { useNavBarStore } from '@/stores/navbar'
  const navStore = useNavBarStore()

  const props = defineProps(['listId'])
  console.log ('UserListView ', props.listId)
  navStore.listId = props.listId
  navStore.listHref = "/userListPage/" + props.listId
  navStore.listTabTitle = "List " + props.listId
  //
  var idxList = userDataStore.userLists.findIndex((item) => item.TroveListId == props.listId);
  var thisList = userDataStore.userLists[idxList]
  // console.log ('UserListView.viewIndex ', props.listId, idxList, thisList)
  //
  function haveLink (list) {
    var haveLink = true
    if (list.TroveListItemCount == 0) haveLink = false;
    if (userDataStore.userDuplicateListIds.indexOf(Number(list.TroveListId)) > -1) haveLink = false;
    return haveLink
  }
  function linkToArticle (article) {
    // return "<a id='linkart' href='/dispArticle'" + article.TroveListArticleReqUrl + '/' + userDataStore.userLists[viewIndex].TroveListId + "'/false' target='_blank'>Article Link</a>"
    return "Article Link"
  }
  //
  // Async load of List Articles - they willbe SSE'd to App.vue
  //
  async function loadListArticles () {
    const url = "https://localhost:3000/userListPage/list/" + thisList.TroveListId + "/true";
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
        errorsStore.errors = data
    }             
  }
  //
  loadListArticles ()
</script>
<template>
  <h1>User {{userDataStore.troveUserId}} Trove List -
      {{ thisList.TroveListName }} ( {{thisList.TroveListId}} )
  </h1>
  <div class="card">
    <div class="card-body">
      <div class="card">
        {{thisList.TroveListItemCount}} Linked Articles
        <span v-if="thisList.TroveListDescription.length > 1">
         - Description - {{thisList.TroveListDescription}}
         </span>
         - Updated {{thisList.TroveListUpdatedText}}
       </div>
      <div class="row">
        <div class="col">
          <div class="card">
            <a :href="thisList.TroveListViewUrl" target="_blank" class="btn btn-primary" role="button">View List in Trove</a>
          </div>
        </div>
        <div class="col">
          <div class="card">
            <a :href="'/userListPage/list/' + thisList.TroveListId + '/false'" class="btn btn-primary" role="button">Reload List from Trove</a>
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
          <th>Edit Article</th>
          <th>Article Status</th>
          <th>Link to Trove</th>
        </tr>
        <tr v-for="article in thisList.TroveListArticles" :key="article.TroveListArticleId">
          <td>{{article.TroveListArticleId}}</td>
          <td>{{article.TroveListArticleHeading}}</td>
          <td>{{article.TroveListArticleSource}}</td>
          <td class="text-nowrap">{{article.TroveListArticlePubDate}}</td>
          <td>linkToArticle (article)</td>
          <td>{{article.TroveListArticleMinedStatustext}}</td>
          <td><a :href="article.TroveListArticleViewUrl" target="_blank">Trove Link</a></td>
        </tr>
      </table>
    </div>
  </div>
</template>

<style>
</style>
