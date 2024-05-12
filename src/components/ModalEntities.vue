<script setup>
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
const props = defineProps(['idxViewed'])
const emit = defineEmits(['added-metadata', 'close'])
console.log('ModalEntities:', props.idxViewed)
//
function processEntity (index) {
    // Find if in ViewedArticleMetadata
    var entity = userData.viewedArticles[props.idxViewed].ViewedArticleEntities[index]
    var idxMetadata = userData.viewedArticles[props.idxViewed].ViewedArticleMetadata.findIndex(arrayMetadata => arrayMetadata[1] == entity[1])
    // console.log ('processEntity Check ', entity, idxMetadata)
    if (idxMetadata > -1) { // Found
        if (!entity[2]) { // Was checked has been unchecked
            // console.log ('processEntities Del ', entity)
            userData.viewedArticles[props.idxViewed].ViewedArticleMetadata.splice(idxMetadata)
        }// else was checked still checked ignore
    } else { // Was not checked now checked so add
        if (entity[2]) {
            // console.log ('processEntities Add', entity)
            var metadataType = entity[0]
            switch (entity[0]) {
                case 'Date':
                    metadataType = 'EventDate'
                    break
                case 'Name':
                    metadataType = 'Person'
                    break
                case 'Place':
                    metadataType = 'EventPlace'
                    break
            }
            userData.viewedArticles[props.idxViewed].ViewedArticleMetadata.push([metadataType, entity[1], 'Sel'])
            emit('added-metadata', userData.viewedArticles[props.idxViewed].ViewedArticleMetadata.length - 1)
        }
    }
  }
//
function matchEntityToMetadata () {
    userData.viewedArticles[props.idxViewed].ViewedArticleEntities.forEach((entity) => {
        var idxMetadata = userData.viewedArticles[props.idxViewed].ViewedArticleMetadata.findIndex(arrayMetadata => arrayMetadata[1] == entity[1])
        // console.log ('matchEntityToMetadata Check ', entity, idxMetadata)
        if (idxMetadata > -1) { // Found
            entity[2] = true
        } else {
            entity[2] = false
        }
    })
}
//
matchEntityToMetadata ()
//
</script>
<template>
    <div class="modal">
        <div class="container-fluid"  style="width: 25rem;">
          <div class="row">
                <div class="card">
                    <h5>Apply Metadata with Check / Uncheck
                        <a @click="$emit('close')" href="#"><i class="bi-x-square"></i></a>
                    </h5>
                </div>
            </div>
            <div class="row">
                <div class="card pre-scrollable">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Add</th>
                                <th>Type</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(entity, index) in userData.viewedArticles[props.idxViewed].ViewedArticleEntities">
                                <td>
                                    <div @change="processEntity(index)" class="checkbox">
                                        <input type="checkbox" v-model="entity[2]" />
                                    </div>
                                </td>
                                <td>{{ entity[0] }}</td>
                                <td>{{ entity[1] }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>