<script setup>
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()

  const props = defineProps(['listId', 'articleId'])
  console.log ('Edit Article View ', props)
  navStore.articleId = props.articleId
  navStore.articleHref = "/editArticle/" + props.listId + "/" + props.articleId
  navStore.articleTabTitle = "Article " + props.articleId
  //
  var idxList = userData.userLists.findIndex((item) => item.TroveListId == props.listId);
  var idxListArticle = userData.userLists[idxList].TroveListArticles.findIndex((item) => item.TroveListArticleId == props.articleId);
  console.log ('Edit Article View  ', idxList, idxListArticle)
  // Has it been viewed previously
  const idxViewed = userData.userLists[idxList].TroveListArticles[idxListArticle].TroveListArticleViewedIdx
  // if (idxViewed < 0) {

  // }

  // Scroll to Search Word in Trove Article, identify by <mark>
  function scrollSearchWord (event) {
    var pattern = new RegExp("(<mark>)", "gi");
    const searchFound = userData.viewedArticles[idxViewed].ViewedArticleOriginalText.search(pattern)
    if (searchFound > 0) {
      const textLength = userData.viewedArticles[idxViewed].ViewedArticleOriginalText.length
      const scrollPercent = searchFound / textLength
      const scrollPixels = event.currentTarget.scrollHeight * scrollPercent;
      // console.log(pattern, searchFound, textLength, event.currentTarget.scrollHeight, scrollPixels);
      event.currentTarget.scrollTo({
        top: scrollPixels,
        left: 0,
        behavior: "smooth",
      });
    }
  }
  // Capture highlighted text in Trove Article
  function getSelectedText () {
    const selection = window.getSelection()
    const selectedText = selection.toString()
    console.log (selection, selectedText)
    if (userData.viewedArticles[idxViewed].ViewedArticleSelectedText.length > 0) {
      userData.viewedArticles[idxViewed].ViewedArticleSelectedText += '\n' + selectedText
    } else {
      userData.viewedArticles[idxViewed].ViewedArticleSelectedText = selectedText
    }
  }
  //
  // Async load of An Article - they will be SSE'd to App.vue
  //
  async function loadArticle (firstLoad) {
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
  loadArticle ('true')
  // markSearchWord (userData.viewedArticles[idxViewed].ViewedArticleSearchWord)
</script>
<template>
  <div class="container-fluid">
    <h1>Article {{ userData.viewedArticles[idxViewed].ViewedArticleId }} from {{ userData.troveUserId }} Trove List -
        {{ userData.userLists[idxList].TroveListName }}
    </h1>
    <div class="container-fluid">
      <div class="card">
        <div class="card-header">
        <p>       {{ userData.viewedArticles[idxViewed].ViewedArticleHeading }}</p>
         <p>Source - {{ userData.viewedArticles[idxViewed].viewedArticlesource }} published on {{ userData.viewedArticles[idxViewed].ViewedArticlePubDate }} </p>
         <p>Last Updated - {{ userData.viewedArticles[idxViewed].ViewedArticleLastTroveUpdatedText }}
         by {{ userData.viewedArticles[idxViewed].ViewedArticleUpdatedBy }} </p>
        </div>
        <br>
        <div class="container-fluid">
          <div class="row">
            <div class="col-6">
              <div class="card-header text-center">
                Trove Actions
              </div>
              <div class="card">
                <div class="container-fluid">
                  <div class="row">
                    <div class="col">
                      <div class="card">
                        <a class="btn btn-primary" :href="userData.viewedArticles[idxViewed].ViewedArticleViewUrl" target="_blank" role="button">View Trove Article</a>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card">
                        <button id = "getTrove" class="btn btn-primary">Refresh Trove Article</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style="display:none" id = "refreshTrove">{{ userData.viewedArticles[idxViewed].ViewedArticleRetrieveTrove }}</div>
            </div>
            <div class="col-6">
              <div class="card-header text-center">
                Your Data Actions
              </div>
              <div class="card">
                <div class="container-fluid">
                  <div class="row">
                    <div class="col">
                      <div class="card">
                        <button id = "duplicateArticles" type="button" class="btn btn-primary" data-toggle="modal" data-target="#modalDuplicateArticles" disabled>Possible Duplicates</button>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card">
                        <button id = "articleEntities" type="button" class="btn btn-primary" data-toggle="modal" data-target="#modalArticleEntities" disabled>Possible Metadata</button>
                      </div>
                    </div>
                    <div class="col-3">
                      <div class="card">
                        <div class="dropdown">
                          <button class="btn btn-primary dropdown-toggle" type="button" id="articleMinedStatusText" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{{ userData.viewedArticles[idxViewed].ViewedArticleMinedStatusText }}</button>
                          <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                            <!-- <% for(var i=0; i < ArticleMinedStatusArray[1].length; i++) { }<a class="dropdown-item articleMinedStatusMenu" data-name="{ArticleMinedStatusArray[1][i] }}" href="#">{ArticleMinedStatusArray[1][i] }}</a><% };  } -->
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col">
                      <div class="card">
                        <button id = "updateData" class="btn btn-primary" disabled>Update Data</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style="display:none" id = "refreshDB">{{ userData.viewedArticles[idxViewed].ViewedArticleRetrieveDB }}</div>
          </div>
          <br>
          <div class="row">
            <div class="col-sm-6">
              <div class="card-header text-center">
                Trove Note Data
              </div>
              <div class="card">
                <div class="card-body pre-scrollable" style="max-height: 35vh"  id="troveNote">{{ userData.viewedArticles[idxViewed].ViewedArticleNote ? userData.viewedArticles[idxViewed].ViewedArticleNote : 'No Trove Note for Article'  }}</div>
              </div>
            </div>
            <div class="col-sm-6">
              <div class="card-header text-center">
                Your Meta Data
              </div>
              <div id="divt-metadata" class="card-body pre-scrollable"  style="max-height: 35vh; line-height: 100%">
                <table style="display:none">
                  <tbody id = "addRow">
                        <tr ><td class="t-cell" id="t0-cell"></td><td class="t-cell" id="t1-cell"></td>
                            <td><a class="edit" title="Edit" data-toggle="tooltip"><i id="row-btn-edt" class="material-icons">edit</i></a>
                                <a class="check" title="Check Edit" data-toggle="tooltip" style="display:none"><i id="row-btn-done" class="material-icons">done</i></a>
                                <a class="delete" title="Delete" data-toggle="tooltip"><i id="row-btn-del" class="material-icons">clear</i></a>
                                <a class="add" title="Add" data-toggle="tooltip"><i id="row-btn-add" class="material-icons">add</i></a>
                            </td>
                        </tr>
                  </tbody>
                </table>
                <table id="t-metadata" class="table table-bordered">
                  <thead class="mbhead">
                      <tr class="mbrow">
                          <th>Type</th>
                          <th>Value</th>
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody id="t-rows">
                        <tr v-for="articleMetadata in userData.viewedArticles[idxViewed].ViewedArticleMetadata">
                            <td class="t-cell" id="t0-cell">{{ articleMetadata[0] }}</td>
                            <td class="t-cell" id="t1-cell">{{ articleMetadata[1] }}</td>
                            <td>
                              <template v-if="articleMetadata[2] == 'Sel'">
                                <a class="edit" title="Edit" data-toggle="tooltip"><i id="row-btn-edt" class="material-icons">edit</i></a>
                                <a class="check" title="Check Edit" data-toggle="tooltip" style="display:none"><i id="row-btn-done" class="material-icons">done</i></a>
                                <a class="delete" title="Delete" data-toggle="tooltip"><i id="row-btn-del" class="material-icons">clear</i></a>
                              </template>
                              <a class="add" title="Add" data-toggle="tooltip"><i id="row-btn-add" class="material-icons">add</i></a>
                            </td>
                        </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <br>
          <div class="row">
            <div class="col-sm-6">
              <div class="card-header text-center">
                Trove Original Text
              </div>
              <div class="card text-center">
                Search Word ({{ userData.viewedArticles[idxViewed].ViewedArticleSearchWord  }}) Occurs {{ userData.viewedArticles[idxViewed].ViewedArticleFoundCount  }}
              </div>
                <div class="card">
                  <div @scroll.once="scrollSearchWord"
                        @mouseup="getSelectedText"
                        id="textTrove"
                        class="card-body overflow-auto"
                        style="max-height: 75vh">
                    <span v-html="userData.viewedArticles[idxViewed].ViewedArticleOriginalText"></span>
                  </div>
                </div>
            </div>
            <div class="col-sm-6">
              <div class="card-header text-center">
                Your Selected Text
              </div>
                <div class="form-group pre-scrollable"  style="max-height: 75vh">
                  <textarea class="form-control" style="height:auto !important;" rows=40 placeholder="Select from left panel to copy here, then save" tabindex="1000">{{ userData.viewedArticles[idxViewed].ViewedArticleSelectedText }}</textarea>
                </div>
            </div>
          </div>
        </div>
        <br>
      </div>
    </div>
  </div>
</template>

<style>
mark {
   text-decoration: "underline" 
}
</style>
