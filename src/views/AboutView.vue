<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
import NavBar from '@/components/NavBar.vue'
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
//
var troveDetails = userData.troveDetails
</script>
<template>
    <div>
        <h1>This is an about page for Trove Data Miner</h1>
        <p>This is a node javascript ui and server that is design to manage the data in TROVE lists.</p>
        <p>The source of the data is the National Library of Australia Trove</p>
    </div>
    <div v-if="userData.troveDetails.hasOwnProperty('troveUserId')">
        <p>This is a Trove Data Miner for user {{ userData.troveDetails.troveUserId }}</p>
        <p v-if="userData.userLists.length > 0">There are {{ userData.userLists.length }} Lists in Trove to manage</p>
        <div class="card col-sm-4 text-center">
            <label for="UserConfig" class="form-label h2">User Configuration</label>
            <!-- <input v-model="troveDetails.troveUserId" @keyup.enter="verifyUser()" class="form-control" id="UserConfig"
                placeholder="Enter Trove User Id" autofocus> -->
            <p>User Trove API:
                <input v-model="troveDetails.troveApiKey" @keyup.enter="updateUser()" class="form-control"
                    id="UserConfig" placeholder="Enter Trove User API" autofocus>
                <button @click="updateUser()" id="UserConfig" class="btn btn-primary">Update</button>
            </p>
        </div>
    </div>
    <div v-else>
        <p>No user entered.</p>
    </div>
</template>

<style></style>
