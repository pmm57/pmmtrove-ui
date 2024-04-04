<script setup>
  import { useUserDataStore } from '@/stores/userdata'
  const userDataStore = useUserDataStore()
  //
  function haveListLink (list) {
    var haveLink = userDataStore.userListsReady
    if (list.TroveListItemCount == 0) haveLink = false;
    if (userDataStore.userDuplicateListIds.indexOf(Number(list.TroveListId)) > -1) haveLink = false;
    return haveLink
  }
  //
</script>
<template>
  <div>
    <h1>Trove Lists for User {{ userDataStore.troveUserId }}
      <!-- <%= troveDetails.troveUserId ? troveDetails.troveUserId : strLoading %> -->
    </h1>
    <br> 
    <div class="card">
      <div class="card-body">
        <p>This is a table of the {{ userDataStore.troveQueryTotal }} lists currently stored in Your Lists in Trove that have {{ userDataStore.troveQueryArticleTotal }} Articles linked
        </p>
        <table class="table w-100">
          <tr>
            <th>List Name</th>
            <th>Description</th> 
            <th style="text-align:right">Trove List Id (Articles)</th>
            <th style="text-align:center">Article Status</th>
            <th style="text-align:center" class="text-nowrap">Link to Trove</th>
          </tr>
          <tr v-for="list in userDataStore.userLists" :key="list.TroveListId" class="align-top">
            <td class="text-nowrap">
              <router-link v-if="haveListLink(list)" :to="'/userListPage/' + list.TroveListId"  class="active link-primary">{{ list.TroveListName }}</router-link>
              <p v-else>
                {{ list.TroveListName }}
              </p>
            </td>
            <td>{{ list.TroveListDescription }}</td>
            <td style="text-align:right">{{ list.TroveListId }}({{ list.TroveListItemCount }})</td>
            <td style="text-align:center" class="text-nowrap">
              <span class="badge text-bg-dark">{{ list.TroveListArticleMinedStatusCounts[0] }}</span>
              <span class="badge text-bg-secondary">{{ list.TroveListArticleMinedStatusCounts[1] }}</span>
              <span class="badge text-bg-warning">{{ list.TroveListArticleMinedStatusCounts[2] }}</span>
              <span class="badge text-bg-primary">{{ list.TroveListArticleMinedStatusCounts[3] }}</span>
              <span class="badge text-bg-info">{{ list.TroveListArticleMinedStatusCounts[4] }}</span>
              <span class="badge text-bg-success">{{ list.TroveListArticleMinedStatusCounts[5] }}</span>
              <span class="badge text-bg-danger">{{ list.TroveListArticleMinedStatusCounts[6] }}</span>
            </td>
            <td style="text-align:center"><a :href="list.TroveListViewUrl" target='_blank' class="link-primary">TroveLink</a></td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<style>
</style>
