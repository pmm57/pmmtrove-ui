<script setup>
import { useDoFetch } from '@/components/DoFetch.js';
import { ref } from 'vue'
import EditItem from '@/components/EditItem.vue'
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
var notifyEditError = ref('inherit')
var popoverForTroveId = ref('')
var notifyEditErrors = ref([[], []]);
var popoverEditErrors = ref([[], []]);
var editTroveId = ref(-1)
var savedTroveId = {}
var changeDefaultApiKey = ref(false)
var disableChangeDefaultApiKey = ref(false)
var disableUpdate = ref(true)
var localAuthUserTroveIds = ref([])
var chgAuthUserTroveIds = []
localAuthUserTroveIds.value = JSON.parse(JSON.stringify(userData.authUserTroveIds))
console.log(`ManageView Start %s`, JSON.stringify(localAuthUserTroveIds.value))
notifyEditErrors.value = Array.from({ length: 2 }, () => Array(localAuthUserTroveIds.value.length).fill("inherit"));
popoverEditErrors.value = Array.from({ length: 2 }, () => Array(localAuthUserTroveIds.value.length).fill(""));
//
async function validateInput(action, index) {
    disableChangeDefaultApiKey.value = true
    notifyEditError.value = 'inherit';
    popoverForTroveId.value = ''
    disableUpdate.value = true;
    console.log(`ManageView/validateInput index:%s action:%s`, index, action)
    console.log(`ManageView/validateInput localAuthUserTroveIds:%s stored:%s`, JSON.stringify(localAuthUserTroveIds.value), JSON.stringify(userData.authUserTroveIds))
    switch (action) {
        case 'Cancel':
            editTroveId.value = -1;
            if (savedTroveId.length == 0) { // Cancel Add
                localAuthUserTroveIds.value.splice(index, 1);
            } else {
                localAuthUserTroveIds.value[index] = { ...savedTroveId };
                savedTroveId = '';
            }
            disableChangeDefaultApiKey.value = false
            console.log(`ManageView/validateInput cancel index:%s saved:%s`, editTroveId.value, JSON.stringify(savedTroveId))
            return;
        case 'Check':
            if (localAuthUserTroveIds.value[index].troveUserId.length < 4) {
                popoverForTroveId.value = 'Trove Id must be at least 4 chars';
                notifyEditError.value = 'red';
            } else {
                if ((index > userData.authUserTroveIds.length - 1) ||
                    (localAuthUserTroveIds.value[index].troveUserId != userData.authUserTroveIds[index].troveUserId)) {
                    // Validate the entered Trove Id
                    const chkedTroveUserId = await ckhTroveUserId(localAuthUserTroveIds.value[index].troveUserId)
                    if (!chkedTroveUserId.validTroveUserId) {
                        popoverForTroveId.value = chkedTroveUserId.errorMsg
                        notifyEditError.value = 'red';
                        return
                    }
                    if ((chkedTroveUserId.linkedAuthUserName.length > 0) &&
                        (chkedTroveUserId.linkedAuthUserName != userData.authUserTroveIds[0].authUserName)) {
                        popoverForTroveId.value = 'Trove User Id already Linked to another Authorised User'
                        notifyEditError.value = 'red';
                        return
                    }
                }
                editTroveId.value = -1;
                disableUpdate.value = checkUpdate();
                savedTroveId = '';
            }
            console.log(`ManageView/validateInput check index:%s disableUpdate:%s`, editTroveId.value, disableUpdate.value)
            break;
        case 'Del':
            localAuthUserTroveIds.value.splice(index, 1);
            disableUpdate.value = checkUpdate();
            console.log(`ManageView/validateInput delete index:%s disaableUpdate:%s`, editTroveId.value, disableUpdate.value)
            break;
        case 'Edit':
            editTroveId.value = index;
            savedTroveId = { ...localAuthUserTroveIds.value[index] };
            console.log(`ManageView/validateInput edit index:%s saved:%s`, editTroveId.value, JSON.stringify(savedTroveId))
            return;
        case 'New':
            savedTroveId = '';
            const newAuthUser = {
                authUserName: localAuthUserTroveIds.value[0].authUserName,
                troveApiKey: localAuthUserTroveIds.value[0].troveApiKey,
                troveUserId: '',
                troveUserApiKey: ''
            }
            localAuthUserTroveIds.value.push(newAuthUser);
            notifyEditErrors.value[0].push("inherit");
            notifyEditErrors.value[1].push("inherit");
            popoverEditErrors.value[0].push('');
            popoverEditErrors.value[1].push('');
            editTroveId.value = index + 1;
            console.log(`ManageView/validateInput new index:%s disaableUpdate:%s`, editTroveId.value, JSON.stringify(localAuthUserTroveIds.value[editTroveId.value]))
            return;
        default:
            break;
    }
    if (!disableUpdate.value) disableChangeDefaultApiKey.value = false
}
//
//  Check if troveUserId is valid and not linked to another authUserName
async function ckhTroveUserId(chkTroveUserId) {
    console.log("ManageView/ckhTroveUserId ", chkTroveUserId)
    var updatedData = {
        'troveUserId': userData.troveDetails.troveUserId,
        'chkTroveUserId': chkTroveUserId
    }
    // console.log (updatedData);
    const url = import.meta.env.VITE_SERVER_URL + "/chkTroveUserId";
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        //make sure to serialize your JSON body
        body: JSON.stringify(updatedData)
    };
    console.log('ManageView/ckhTroveUserId ', JSON.stringify(options));
    return useDoFetch('ckhTroveUserId', url, options)
    //
}
//
// Default Api Key Functions
function updateDefaultApiKey() {
    changeDefaultApiKey.value = false;
    for (var i = 1; i < localAuthUserTroveIds.value.length; ++i) {
        localAuthUserTroveIds.value[i].troveApiKey = localAuthUserTroveIds.value[0].troveApiKey
    }
    chgAuthUserTroveIds.push({
        authUserName: localAuthUserTroveIds.value[0].authUserName,
        troveApiKey: localAuthUserTroveIds.value[0].troveApiKey,
        troveUserId: '',
        troveUserApiKey: '',
        action: 'DEFKEY'
    })
    saveData()
}
function cancelUpdateDefaultApiKey() {
    changeDefaultApiKey.value = false;
    localAuthUserTroveIds.value[0].troveApiKey = userData.authUserTroveIds[0].troveApiKey
}
//
// Only enable Update if there is a change
// Must be at least one Trove Id
function checkUpdate() {
    var chkAuthUserTroveIds = []
    for (var i = 0; i < localAuthUserTroveIds.value.length; ++i) {
        chkAuthUserTroveIds.push({ index: i, ...localAuthUserTroveIds.value[i] })
    }
    notifyEditErrors.value = Array.from({ length: 2 }, () => Array(localAuthUserTroveIds.value.length).fill("inherit"));
    popoverEditErrors.value = Array.from({ length: 2 }, () => Array(localAuthUserTroveIds.value.length).fill(""));
    console.log(`ManageView/checkUpdate Check AuthUsers %s`, JSON.stringify(chkAuthUserTroveIds))
    var tmpAuthUserTroveIds = []
    // Use the saved authUserTroveIds as basis for check
    for (var i = 0; i < userData.authUserTroveIds.length; ++i) {
        console.log(`ManageView/checkUpdate Start Index:%s Row:%s`, i, JSON.stringify(userData.authUserTroveIds[i]))
        if (userData.authUserTroveIds[i].troveUserId == '') continue // Ignore
        console.log('ManageView/checkUpdate Check userData.authUserTroveIds ', JSON.stringify(userData.authUserTroveIds[i]))
        // Check if removed from local copy
        const idxTroveId = chkAuthUserTroveIds.findIndex((id) => id.troveUserId == userData.authUserTroveIds[i].troveUserId)
        if (idxTroveId < 0) { // Deleted Link
            console.log('ManageView/checkUpdate Deleted ', JSON.stringify(userData.authUserTroveIds[i]))
            tmpAuthUserTroveIds.push({ index: i, ...userData.authUserTroveIds[i], action: 'DELLINK' })
            continue
        }
        console.log(`ManageView/checkUpdate Check troveUserApiKey idxTroveId:%s `, idxTroveId)
        console.log(`ManageView/checkUpdate Old-%s New-%s`, JSON.stringify(userData.authUserTroveIds[i]), JSON.stringify(chkAuthUserTroveIds[idxTroveId]))
        if (userData.authUserTroveIds[i].troveUserApiKey != chkAuthUserTroveIds[idxTroveId].troveUserApiKey) { // Update Trove Id API Key
            tmpAuthUserTroveIds.push({ index: i, ...chkAuthUserTroveIds[idxTroveId], action: 'CHG' })
            chkAuthUserTroveIds.splice(idxTroveId, 1)
            console.log(`ManageView/checkUpdate Change troveUserApiKey tmp-%s chk-%s`, JSON.stringify(tmpAuthUserTroveIds), JSON.stringify(chkAuthUserTroveIds))
            continue
        }
        // Unchanged - remove from Check Array - what's left are adds
        chkAuthUserTroveIds.splice(idxTroveId, 1)
    }
    // Any left are ADD
    chgAuthUserTroveIds = [...tmpAuthUserTroveIds, ...chkAuthUserTroveIds.map(item => ({ ...item, action: 'ADDLINK' }))]
    console.log(`ManageView/checkUpdate Updates chg-%s`, JSON.stringify(chgAuthUserTroveIds))
    if (chgAuthUserTroveIds.length > 0) return false
    return true;
}
//
//  Post updated AuthUser TroveIds
async function saveData() {
    console.log("ManageView/saveData updateData ", JSON.stringify(chgAuthUserTroveIds))

    // Only Send ones that have changed
    var updatedData = {
        'chgAuthUserTroveIds': chgAuthUserTroveIds
    }
    // console.log (updatedData);
    const url = import.meta.env.VITE_SERVER_URL + "/manageUserInf";
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        //make sure to serialize your JSON body
        body: JSON.stringify(updatedData)
    };
    console.log('ManageView/SaveData ', JSON.stringify(options));
    const authUserInf = await useDoFetch('saveAuthUserTroveIds', url, options)
    if (typeof data == 'boolean') {
        // Verification failed
        return
    }
    if (authUserInf.chkErrors.length > 0) {
        console.log("ManageView/saveData Errors ", JSON.stringify(authUserInf.chkErrors))
        for (i = 0; i < authUserInf.chkErrors.length; ++i) {
            const idxErrorRow = authUserInf.chkErrors[i].index
            var idxErrorCol = 9
            switch (authUserInf.errorField) {
                case 'troveUserId':
                    idxErrorCol = 0
                    break
                case 'authUserApiKey':
                    idxErrorCol = 1
                    break
            }
            if (idxErrorCol < 9) {
                popoverEditErrors.value[idxErrorCol][idxErrorRow] = authUserInf.chkErrors[i].errMsg
                notifyEditErrors.value[idxErrorCol][idxErrorRow] = 'red';
            }
        }
    }
    localAuthUserTroveIds.value = JSON.parse(JSON.stringify(authUserInf.authUsers))
    userData.authUserTroveIds = JSON.parse(JSON.stringify(localAuthUserTroveIds.value))
    //
    disableUpdate.value = true
    disableChangeDefaultApiKey.value = false
    chgAuthUserTroveIds = []
}
</script>
<template>
    <div>
        <h1>Overview</h1>
        <h2>About Trove Data Miner</h2>
        The source of the data is the National Library of Australia Trove<br>
        This is a node javascript ui and server that is design to manage the data in TROVE lists.<br>
        Organisation of data works best when Trove Lists have names that identify the primary reference person.<br>
        Name Trove Lists - "Surname (nee MaidenName), GivenName/Initial., b.yyyy-d.yyyy <br>
        <h2>Manage User</h2>
    </div>
    <div v-if="userData.verifiedTroveUserName">
        This is a Trove Data Miner for user {{ userData.troveDetails.troveUserId }}<br>
        <p v-if="userData.userLists.length > 0">There are {{ userData.userLists.length -
            userData.userDuplicateListIds.length }}
            Lists in Trove to manage in Trove Data Miner</p>
    </div>
    <div v-if="userData.verifiedAuthUserName">
        <h2>User {{ localAuthUserTroveIds[0].authUserName }} Configuration</h2>
        <div class="card col-sm-4 text-center">
            <div v-if="changeDefaultApiKey" class="card">
                <input v-model="localAuthUserTroveIds[0].troveApiKey" placeholder="Enter a Trove API Key" />
                <div style="display:flex; justify-content:center; gap:10px; margin-top:10px;">
                    <button :disabled="localAuthUserTroveIds[0].troveApiKey.length < 10"
                        @click.prevent="updateDefaultApiKey()" class="btn btn-primary">Save
                    </button>
                    <button @click.prevent="cancelUpdateDefaultApiKey()" class="btn btn-primary">Cancel
                    </button>
                </div>
            </div>
            <div v-else>
                Default Trove API Key <br> {{ localAuthUserTroveIds[0].troveApiKey }} <br>
                <button :disabled="disableChangeDefaultApiKey" @click.prevent="changeDefaultApiKey = true"
                    class="btn btn-primary">Change
                    Default Trove API Key</button>
            </div>
        </div>
        <br>
        <p v-if="(localAuthUserTroveIds.length == 1) && (localAuthUserTroveIds[0].troveUserId.length == 0)">
            Link a Trove User Id to this Authorised User to access Trove Data
        </p>
        <p v-else>Link additional Trove Ids and specify specific Trove Id API Key</p>
        <div class="card col-sm-4 text-center">
            <table class="table table-bordered">
                <thead class="mbhead">
                    <tr class="mbrow">
                        <th>Trove Id</th>
                        <th>Trove Api Key</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(troveId, index) in localAuthUserTroveIds">
                        <template v-if="editTroveId > -1"> <!-- In Edit Mode-->
                            <template v-if="editTroveId == index"> <!-- Row to Edit -->
                                <td :style="{ 'background-color': notifyEditError }"> <!-- Trove Id -->
                                    <input v-model="troveId.troveUserId" placeholder="Enter a Trove Id">
                                    <span v-if="popoverForTroveId.length > 0" class="tooltiptext">{{ popoverForTroveId
                                        }}</span>
                                    </input>
                                </td>
                                <td> <!-- troveUserApiKey -->
                                    <input v-model="troveId.troveUserApiKey" placeholder="Enter a Trove API Key" />
                                </td>
                                <td>
                                    <EditItem @click-item="validateInput('Check', index)" action="Check"
                                        icon="bi-check-square" />
                                    <EditItem @click-item="validateInput('Cancel', index)" action="Cancel"
                                        icon="bi-x-square" />
                                </td>
                            </template>
                            <template v-else>
                                <td>{{ troveId.troveUserId }}</td>
                                <td>{{ troveId.troveUserApiKey }}</td>
                                <td>
                                </td>
                            </template>
                        </template>
                        <template v-else> <!-- In Display Mode-->
                            <td :style="{ 'background-color': notifyEditErrors[0][index] }">{{ troveId.troveUserId }}
                                <span v-if="popoverEditErrors[0][index].length > 0" class="tooltiptext">{{
                                    popoverEditErrors[0][index]
                                }}</span>
                            </td>
                            <td :style="{ 'background-color': notifyEditErrors[1][index] }">{{ troveId.troveUserApiKey
                            }}
                                <span v-if="popoverEditErrors[1][index].length > 0" class="tooltiptext">{{
                                    popoverEditErrors[1][index]
                                }}</span>
                            </td>
                            <td>
                                <EditItem
                                    v-if="(index + 1 == localAuthUserTroveIds.length) && (localAuthUserTroveIds[0].troveUserId.length > 0)"
                                    @click-item="validateInput('New', index)" action="New" icon="bi-plus-square" />
                                <EditItem @click-item="validateInput('Edit', index)" action="Edit"
                                    icon="bi-pencil-square" />
                                <EditItem v-if="index > 0" @click-item="validateInput('Del', index)" action="Del"
                                    icon="bi-x-square" />
                            </td>
                        </template>
                    </tr>
                </tbody>
            </table>
            <div class="card">
                <button :disabled="disableUpdate" @click.prevent="saveData()" class="btn btn-primary">Update
                    Trove Id Data</button>
            </div>
        </div>
    </div>
    <div v-else>
        <p>No Authorised User entered.</p>
    </div>
</template>

<style></style>
