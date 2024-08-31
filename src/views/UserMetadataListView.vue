<script setup>
  import { ref } from 'vue'
  import ArticleUrls from '@/components/ArticleUrls.vue'
  import { useErrorsArrayStore } from '@/stores/errorsarray'
  const errorsStore = useErrorsArrayStore()
  import { useUserDataStore } from '@/stores/userdata'
  const userData = useUserDataStore()
  // Array to do accorian transition by Metadata Type
  var flagMetadataType = ref([])
  var flagMetadataValue = ref([])
  showMetadataType (-1)
  //
  function showMetadataType (idxType) {
    console.log('showMetadataType ', idxType, flagMetadataType.value, flagMetadataType.value[idxType])
    if ((idxType > -1) && (flagMetadataType.value[idxType])) {
      flagMetadataType.value[idxType] = false;
      return;
    }
    for (var i=0; i<userData.metadataTypeByMetadata.length; ++i) {
      flagMetadataType.value[i] = false;
    }
    console.log('showMetadataType ', idxType, flagMetadataType.value)
    if (idxType > -1) {
      flagMetadataType.value[idxType] = true
    // console.log ("showMetadataType ", flagMetadataType)
      showMetadataValue (idxType, -1)
    }
  }
  //
  function showMetadataValue (idxType, idxValue) {
    for (var j=0; j<userData.metadataTypeByMetadata[idxType].arrayMetadata.length; ++j) {
      flagMetadataValue.value[j] =false
    }
    if (idxValue > -1) {
      flagMetadataValue.value[idxValue] = true
      // console.log ("showMetadataValue ", flagMetadataValue)
      // Check if there are Articles that haven't been loaded into Viewed Articles
      const getLinks = userData.metadataTypeByMetadata[idxType].arrayMetadata[idxValue].articleListArray.findIndex((el) => el.idxViewedArticle < 0)
      if (getLinks > -1) getArticleLinks (idxType, idxValue)
    }
  }
  //
  async function getArticleLinks (idxType, idxMetadataValue) {
    errorsStore.arrayErrors = [];
    const url = 'https://localhost:3000/streamTrove/MetadataLinks/' + userData.metadataTypeByMetadata[idxType].metadataType + ':' + idxMetadataValue;
    console.log('getArticleLinks -', url)
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
        errorsStore.arrayErrors.push({msg : 'Server not available', param : ''});
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
        console.log ('data ', data)
        // Update Dup-licate and Ignored modifier
        data.linkedArticleUrls.arrayArticleUrls.forEach((el, index)=> {
          if (el.includes(":")) {
            userData.metadataTypeByMetadata[idxType].arrayMetadata[idxMetadataValue].articleListArray[index].troveArticleId = el
          }
        })
    } else {
        console.log ('UserMetadataListView ', response)
        if (response.hasOwnProperty('errors')) {
          errorsStore.arrayErrors = response.errors
        } else {
          errorsStore.arrayErrors.push({msg : response.statusText, param : response.status});
        }
    }
  }
</script>
//
<template>
  <div class="container-fluid">
    <h1>Metadata Items for User {{ userData.troveUserId}}
    </h1>
    <br> 
    <p>This is a table of the {{ userData.metadataTypeByMetadata.length }} Metadata Types that {{ userData.metadataValueTotal }} Metadata Items classify Articles
    </p>
    <div v-for="(type, idxType) in userData.metadataTypeByMetadata" :key="type.metadataType" class="card" >
      <div class="card-header px-0 py-0">
        <button class="btn btn-link" @click="showMetadataType(idxType)">{{ type.metadataType }} [{{ type.arrayMetadata.length }}]
        </button>
      </div>
      <div v-show="flagMetadataType[idxType]">
        <div class="card-body px-0 py-0" v-for="(value, idxValue) in type.arrayMetadata" :key="value.metadataValue">
          <div>
            <span>&nbsp;&nbsp;&nbsp;-&nbsp;</span>
            <span v-if="value.articleListArray.length < 1">{{ value.metadataValue }} [{{ value.articleListArray.length }}]</span>
            <button v-else class="btn btn-link px-0 py-0" @click="showMetadataValue (idxType, idxValue)">{{ value.metadataValue }} [{{ value.articleListArray.length }}]</button>
          </div>
          <div v-show="flagMetadataValue[idxValue]" class="card-body ml-3 px-0 py-0">
            <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;</span>
            <ArticleUrls
              :inline="true"
              :articleListArray="value.articleListArray"
              :troveListId="0">
            </ArticleUrls>
          </div>  
        </div>
      </div>
    </div>
  </div>
</template>

<style>
</style>
