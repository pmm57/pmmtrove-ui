<script setup>
  import { useUserDataStore } from '@/stores/userdata'
  const userData = useUserDataStore()
  //
  //
</script>
//
<template>
  <div class="container-fluid">
    <h1>Metadata Items for User {{ userData.troveUserId}}
    </h1>
    <br> 
    <p>This is a table of the {{ userData.metadataTypeByMetadata.length }} Metadata Types that {{ userData.metadataValueTotal }} Metadata Items classify Articles
    </p>
    <div id="accordion">
      <div v-for="type in userData.metadataTypeByMetadata" :key="type.metadataType" class="card h-50" >
        <div class="card-header">
          <button class="btn btn-link" data-toggle="collapse" data-target="#collapse{{ type.metadataType }}" aria-expanded="false" aria-controls="collapse{{ type.metadataType }}">
            {{ type.metadataType }} [{{ type.arrayMetadata.length }}]
          </button>
        </div>
        <div class="collapse" aria-labelledby="heading{{ type.metadataType }}" data-parent="#accordion">
          <div class="card-body h-50" v-for="(item, index) in type.arrayMetadata" :key="item.metadataValue">
            <div class="row border-top" >
              <div class="col-sm-2">
                <p v-if="item.articleListArray.length < 1">{{ item.metadataValue }} [{{ item.articleListArray.length }}]</p>
                <a v-else href="#" class="card-link" metadataId-param="type.metadataType + ':' + index">{{ item.metadataValue }} [{{ item.articleListArray.length }}]</a>
              </div>
              <div class="col-sm-6"></div>  
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
</style>
