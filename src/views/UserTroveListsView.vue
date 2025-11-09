<script setup>
import StatusCount from '@/components/StatusCount.vue'
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
//
function haveListLink(list) {
  // var haveLink = userData.userListsReady
  var haveLink = true
  // console.log(`TroveListView haveLink LoadState:%s, Items:%s`, list.TroveListLoadState, list.TroveListItemCount)
  if (!(list.TroveListLoadState == 'Cached' || list.TroveListLoadState == 'Loaded' || list.TroveListLoadState == 'Partial' || list.TroveListLoadState == 'Inited')) {
    // console.log(`TroveListView haveLink LoadState:%s`, list.TroveListLoadState)
    haveLink = false;
  }
  if (list.TroveListItemCount == 0) {
    if (list.TroveListLoadState != 'Inited') haveLink = false
  };
  if (userData.userDuplicateListIds.indexOf(Number(list.TroveListId)) > -1) haveLink = false; // Disable Link if it is the list holding duplicate articles
  // console.log(`TroveListView haveLink LoadState:%s ItemCount:%s`, list.TroveListLoadState, list.TroveListItemCount)
  return haveLink
}
//
function statusBadge(status, count) {
  var classCount = 'badge ';
  if (Number(count) == 0) {
    classCount += 'text-bg-light';
  } else {
    switch (Number(status)) {
      case 0:
        classCount += 'text-bg-dark';
        break;
      case 1:
        classCount += 'text-bg-secondary';
        break;
      case 2:
        classCount += 'text-bg-warning';
        break;
      case 3:
        classCount += 'text-bg-primary';
        break;
      case 4:
        classCount += 'text-bg-info';
        break;
      case 5:
        classCount += 'text-bg-success';
        break;
      default:
        classCount += 'custom-badge';
        break;
    }
  }
  return classCount
}
//
</script>
<template>
  <div>
    <h1>Trove Lists for User {{ userData.troveDetails.troveUserId }}
    </h1>
    <br>
    <div class="card">
      <div class="card-body">
        <p>This is a table of the {{ userData.troveQueryTotal }} lists currently stored in Your Lists in Trove that have
          {{ userData.troveQueryArticleTotal }} Articles linked
        </p>
        <table class="table w-100">
          <thead>
            <tr>
              <th>List Name</th>
              <th>Description</th>
              <th style="text-align:right">Trove List Id (Articles)</th>
              <th style="text-align:center">Article Status</th>
              <th style="text-align:center" class="text-nowrap">Link to Trove</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="list in userData.userLists" :key="list.TroveListId" class="align-top">
              <td class="text-nowrap">
                <router-link v-if="haveListLink(list)" :to="'/userListPage/' + list.TroveListId"
                  class="active link-primary">{{ list.TroveListName }}</router-link>
                <p v-else>
                  {{ list.TroveListName }}
                </p>
              </td>
              <td>{{ list.TroveListDescription }}</td>
              <td style="text-align:right">{{ list.TroveListId }}({{ list.TroveListItemCount }})</td>
              <td style="text-align:center" class="text-nowrap">
                <template v-for="(count, index) in list.TroveListArticleMinedStatusCounts">
                  <span :class="statusBadge(index, count)">{{ count > 0 ? count : '-' }}</span>
                </template>
              </td>
              <td style="text-align:center"><a :href="list.TroveListViewUrl" target='_blank'
                  class="link-primary">TroveLink</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style></style>
