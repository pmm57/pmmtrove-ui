<script setup>
import { ref, reactive } from 'vue';
import ArticleUrls from '@/components/ArticleUrls.vue';
import RelatedTable from '@/components/RelatedTable.vue';
import ModalLists from '@/components/ModalLists.vue';
import ModalRelative from '@/components/ModalRelative.vue';
import ModalPartner from '@/components/ModalPartner.vue';
import { useCheckName } from '@/components/CheckName.js';
import { useDoFetch } from '@/components/DoFetch.js';
import { useUserDataStore } from '@/stores/userdata';
import { useErrorsArrayStore } from '@/stores/errorsarray';
const errorsStore = useErrorsArrayStore();
const userData = useUserDataStore();
const props = defineProps(['person']);
//
let sourceLoadPerson = null;
let loadingPerson = ref(false);
let loadingPersonText = ref("");
let linkListText = ref("Link to a List");
let linkedListText = ref("Unlink from List ");
let linkedListIdx = ref(-1);
let showPersonDetails = ref(false);
let showSearchPerson = ref(false);
let showEditPersonName = ref(false);
let notifyEditError = ref('inherit');
let popoverForMetadata = ref('');
let showDefaultPersonAction = ref(true);
let showEditPersonAction = ref(false);
let showCheckPersonNameAction = ref(false);
let showDeletePersonAction = ref(false);
let showRestorePersonAction = ref(false);
let showLinkPersonAction = ref(false);
let showAddRelativeAction = ref(false);
let showAddPerson = ref(false);
let showChgPerson = ref(false);
let showDelPerson = ref(false);
let showModalLists = ref(false);
let showModalRelative = ref(false);
let showModalPartner = ref(false);
let savedPerson = reactive({
  action: "",
  personIndex: -1,
  readName: "",
  linkedListId: 0,
  arrayRelated: []
});
let partners = ref([]);
//
let updatePerson = reactive({
  chgName: [],
  chgLinkedListId: 0,
  chgRelated: []
});
//

console.log('Passed Person: ', props);
const idxMetadataPerson = userData.metadataTypeByMetadata.findIndex((el) => el.metadataType === "Person");
const popoverPersonMetadata = 'Enter as Familyname (nee Maidenname), GivenName Initial As N. b.9999-d.9999';
popoverForMetadata.value = popoverPersonMetadata;
//
// These become active as confirmation buttons after a Person Name Action button
function setPersonActions(showActions) {
  if (showActions.includes("add")) {
    showAddPerson.value = true;
  } else {
    showAddPerson.value = false;
  };
  if (showActions.includes("del")) {
    showDelPerson.value = true;
  } else {
    showDelPerson.value = false;
  };
  if (showActions.includes("chg")) {
    showChgPerson.value = true;
  } else {
    showChgPerson.value = false;
  };
}
//
function setPersonNameActions(showActions) {
  // 
  if (showActions.length == 0) {
    showActions = 'edit link relatives restore search';
    if ((userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[savedPerson.personIndex].articleListArray.length == 0) &&
      (savedPerson.arrayRelated.length == 0) &&
      (linkedListIdx.value == -1)) {
      // As not linked articles or Relatives or List - Person can be deleted
      showActions += ' delete';
    };
  };
  console.log('setPersonNameAction ' + showActions);
  if (showActions.includes("start")) {
    showDefaultPersonAction.value = true
  } else {
    showDefaultPersonAction.value = false
  };
  if (showActions.includes("edit")) {
    showEditPersonAction.value = true
  } else {
    showEditPersonAction.value = false
  };
  if (showActions.includes("search")) {
    showSearchPerson.value = true
  } else {
    showSearchPerson.value = false
  };
  if (showActions.includes("check")) {
    showCheckPersonNameAction.value = true
  } else {
    showCheckPersonNameAction.value = false
  };
  if (showActions.includes("delete")) {
    showDeletePersonAction.value = true
  } else {
    showDeletePersonAction.value = false
  };
  if (showActions.includes("restore")) {
    showRestorePersonAction.value = true
  } else {
    showRestorePersonAction.value = false
  };
  if (showActions.includes("link")) {
    showLinkPersonAction.value = true
  } else {
    showLinkPersonAction.value = false
  };
  if (showActions.includes("relatives")) {
    showAddRelativeAction.value = true
  } else {
    showAddRelativeAction.value = false
  };
  return;
}
//
function handleLoadPersonMessage(e, intervalApersonData, idxPartner) {
  var returnedData = JSON.parse(e.data);
  console.log('Return Loadperson', JSON.stringify(returnedData));
  // savedPerson = JSON.parse(e.data);
  savedPerson.readName = returnedData.readPerson;
  savedPerson.linkedListId = returnedData.linkedListId;
  linkedListText.value = "Unlink from List " + savedPerson.linkedListId;
  linkedListIdx.value = -1;
  if (savedPerson.linkedListId > 0) {
    linkedListIdx.value = userData.userLists.findIndex((item) => item.TroveListId === returnedData.linkedListId.toString());
    if (linkedListIdx.value > -1) {
      linkedListText.value += " | " + userData.userLists[linkedListIdx.value].TroveListName;
    } else {
      linkedListText.value += " | No Name";
    }
  }
  savedPerson.arrayRelated = returnedData.arrayRelated;
  savedPerson.personIndex = returnedData.personIndex;
  savedPerson.action = "LOAD";
  console.log('Return Savedperson', JSON.stringify(savedPerson));
  // Updated Linked Article URLS
  // userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[savedPerson.personIndex].articleListArray = returnedData.linkedArticleUrls.arrayArticleUrls
  console.log('Return Linked Article URLs ', JSON.stringify(userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[savedPerson.personIndex].articleListArray));
  setPersonActions('');
  updatePerson.chgName = savedPerson.readName;
  updatePerson.chgLinkedListId = savedPerson.linkedListId;
  updatePerson.chgRelated = [];
  if (savedPerson.hasOwnProperty('arrayRelated')) {
    updatePerson.chgRelated = JSON.parse(JSON.stringify(savedPerson.arrayRelated));
    partners.value = [];
    for (var relation of updatePerson.chgRelated) {
      // Need this for relation hyper link
      relation.relatedIdxPerson = userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata.findIndex((el) => el.metadataValue == relation.relatedPerson);
      if ((idxPartner == -1) && (relation.relatedType == 'ChildWith')) {
        //Get partner details to link new ChildOf relations for current displayed person
        partners.value.push({
          action: "LOAD",
          personIndex: relation.relatedIdxPerson,
          readName: relation.relatedPerson,
          arrayRelated: []
        });
      };
    };
  };
  sourceLoadPerson.close();
  clearInterval(intervalApersonData);
  loadingPerson.value = false;
  showPersonDetails.value = true;
  showEditPersonName.value = false;
  setPersonNameActions('');
  // Load partner details
  console.log('Load Person Partners', partners.value);
  for (var idx = 0; idx < partners.value.length; ++idx) {
    loadPerson(partners.value[idx].personIndex, idx);
  };
}
//
function handleLoadPartnerMessage(e, intervalApersonData, idxPartner) {
  var returnedData = JSON.parse(e.data);
  // console.log('Return Load Partner', JSON.stringify(returnedData));
  partners.value[idxPartner].readName = returnedData.readPerson;
  partners.value[idxPartner].personIndex = returnedData.personIndex;
  for (var relation of returnedData.arrayRelated) {
    // Need this for relation hyper link
    relation.relatedIdxPerson = userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata.findIndex((el) => el.metadataValue == relation.relatedPerson);
  }
  partners.value[idxPartner].arrayRelated = returnedData.arrayRelated;
  console.log('Return Load Partner', JSON.stringify(partners.value[idxPartner]));
  sourceLoadPerson.close();
  clearInterval(intervalApersonData);
}
//
function handleError(e) {
  if (e.target.readyState == EventSource.CLOSED) {
    console.log("Disconnected sourceUserCache");
  }
  else if (e.target.readyState == EventSource.CONNECTING) {
    console.log("Connecting sourceUserCache...");
  }
}
//
function loadPerson(idxValue, idxPartner) {
  console.log('Load Person Person:', idxValue, idxPartner);
  var intervalLoadPerson = setInterval(function () {
    loadingPersonText.value += ' .'
  }, 500);
  if (!!window.EventSource) {
    var streamName = import.meta.env.VITE_SERVER_URL + '/streamTrove/LoadPerson/Person:' + idxValue;
    // console.log(streamName);
    sourceLoadPerson = new EventSource(streamName, { withCredentials: true });
    sourceLoadPerson.addEventListener('error', (e) => handleError(e), false);
    if (idxPartner > -1) {
      sourceLoadPerson.addEventListener("LoadPerson", (e) => handleLoadPartnerMessage(e, intervalLoadPerson, idxPartner), false);
    } else {
      loadingPerson.value = true;
      loadingPersonText.value = "Loading Person Details";
      showPersonDetails.value = false;
      showEditPersonName.value = false;
      sourceLoadPerson.addEventListener("LoadPerson", (e) => handleLoadPersonMessage(e, intervalLoadPerson, idxPartner), false);
    }
    // Close if still open when window closed
    // $(window).bind('beforeunload', function(){
    //   if (source.readyState != EventSource.CLOSED) {
    //     // console.log('stop ' + streamName);
    //     source.close();
    //   }
    // });
  } else {
    errorsStore.arrayErrors.push({ msg: `Your browser doesn't support SSE`, param: '' });
    console.log("Your browser doesn't support SSE");
  }
}
//
// Setup Screen so a new Person Can be added
// Show Prompt with Check and Restore Actions
// If the Check Person test is OK the 'Update Person' button is shown
// If they click "Update Person" then chgPerson function is called
function addPerson() {
  savedPerson.action = 'ADD';
  savedPerson.personIndex = -1;
  savedPerson.readName = "";
  savedPerson.linkedListId = 0;
  linkListText.value = "Link to a List";
  linkedListText.value = "";
  savedPerson.arrayRelated = [];
  updatePerson.chgName = "";
  updatePerson.chgLinkedListId = 0;
  updatePerson.chgRelated = [];
  loadingPerson.value = false;
  showPersonDetails.value = false;
  showEditPersonName.value = true;
  setPersonNameActions('check restore');
  setPersonActions('');
}
// Set editPersonName editable
function editPersonClick() {
  showEditPersonName.value = true;
  showPersonDetails.value = false;
  setPersonNameActions('check restore');
  setPersonActions('');
  savedPerson.action = 'CHG';
}
// On clicking the check edit button
function checkPersonNameClick() {
  var errorTip = '';
  // Trim Blanks
  updatePerson.chgName = updatePerson.chgName.trim();;
  // Check Non-Blank
  if (updatePerson.chgName.length < 1) {
    errorTip = 'Is Blank';
  } else {
    errorTip = useCheckName(updatePerson.chgName);
    if (errorTip.length > 0) {
      valid = false;
    }
  }
  // 
  if (errorTip.length == 0) {
    for (const el of userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata) {
      // OK if Selected Person
      // console.log ('|' + updatePerson.readName + '|' + addPersonName +'|' + strPerson[0] + '|')
      if (el.metadataValue != savedPerson.readName) {
        if ((el.metadataValue.startsWith(updatePerson.chgName))
          || (updatePerson.chgName.startsWith(el.metadataValue))) {
          errorTip = 'Matches Person-' + el.metadataValue;
          break;
        }
      }
    }
  }
  //
  if (errorTip.length == 0) {
    notifyEditError.value = 'inherit';
    popoverForMetadata.value = popoverPersonMetadata;
    showEditPersonName.value = false;
    showPersonDetails.value = true;
    setPersonNameActions("restore");
    setPersonActions("chg");
  } else {
    notifyEditError.value = 'red';
    popoverForMetadata.value = errorTip;
  }
}
//
function delPersonClick() {
  setPersonNameActions('restore');
  setPersonActions('del');
}
// //
function delPerson(deletePerson, emptyPerson) {
  deletePerson.action = 'DEL';
  emptyPerson.chgName = [];
  emptyPerson.chgRelated = [];
  saveData(deletePerson, emptyPerson, true);
  initScreen();
}
//
function linkListToPerson(linkList) {
  linkListText.value = "Link to List " + linkList;
  updatePerson.chgLinkedListId = parseInt(linkList.split("|")[0].trim());
  console.log('Link List ', updatePerson.chgLinkedListId, linkList);
  showModalLists.value = false;
  setPersonActions("chg");
  setPersonNameActions('relatives restore');
  savedPerson.action = 'CHG';
}
//
function unlinkListToPerson() {
  updatePerson.chgLinkedListId = 0;
  console.log('UnLink List ', updatePerson.chgLinkedListId);
  setPersonActions("chg");
  setPersonNameActions('relatives restore');
  savedPerson.action = 'CHG';
}
//
function addRelatedPerson(relatedPerson) {
  console.log('Add Relative ', JSON.stringify(relatedPerson));
  showModalRelative.value = false;
  updatePerson.chgRelated.push(relatedPerson);
  // If partners
  if (partners.value.length > 0) {
    // If relation type is ChildOf - check Partner details and ask to link
    if (relatedPerson.relatedType == 'ChildOf') {
      // Find Which Partner
      var childWithPartner = -1
      for (var idx = 0; idx < partners.value.length; ++idx) {
        if (relatedPerson.relatedPerson == partners.value[idx].readName) {
          childWithPartner = idx;
          break;
        }
      }
      if (childWithPartner == -1) {
        console.log('UserPersonListView addRelatedPerson No Partner');
        showModalPartner.value = true;
      }
    }
  }
  setPersonActions("chg");
  setPersonNameActions('relatives restore');
  savedPerson.action = 'CHG';
}
//
function addToRelatedPartner(idxOtherParent) {
  console.log('UserPersonListView addToRelatedPartner ', idxOtherParent, partners.value[idxOtherParent]);
  partners.value[idxOtherParent].action = 'CHG';
  partners.value[idxOtherParent].arrayRelated.push(updatePerson.chgRelated[updatePerson.chgRelated.length - 1]);
  showModalPartner.value = false;
}
//
function delRelativeClick(idxRelation) {
  // Find if in Partners
  let idxPartner = -1;
  let idxPartnerRelation = -1;
  console.log('UserPersonListView delRelativeClick:', updatePerson.chgRelated[idxRelation].relatedPerson);
  for (let idxP = 0; idxP < partners.value.length; ++idxP) {
    idxPartnerRelation = partners.value[idxP].arrayRelated.findIndex((related) => related.relatedPerson === updatePerson.chgRelated[idxRelation].relatedPerson);
    if (idxPartnerRelation > -1) {
      idxPartner = idxP;
      break;
    }
  }
  console.log('UserPersonListView delRelativeClick found:', idxPartner, idxPartnerRelation);
  //
  if (updatePerson.chgRelated[idxRelation].relatedAction == 'ADD') {
    // Not updated yet - so remove from array
    updatePerson.chgRelated.splice(idxRelation, 1);
    if (idxPartner > -1) {
      partners.value[idxPartner].arrayRelated.splice(idxPartnerRelation, 1)
    }
  } else {
    updatePerson.chgRelated[idxRelation].relatedAction = 'DEL';
    if (idxPartner > -1) {
      if (partners.value[idxPartner].arrayRelated[idxPartnerRelation].action === 'ADD') {
        partners.value[idxPartner].arrayRelated.splice(idxPartnerRelation, 1);
      } else {
        partners.value[idxPartner].arrayRelated[idxPartnerRelation].action = 'DEL';
      }
    }
  }
  setPersonNameActions('relatives restore');
  setPersonActions("chg");
  savedPerson.action = 'CHG';
  if (idxPartner > -1) {
    partners.value[idxPartner].action = 'CHG';
  }
}
//
function chgPerson(preChgDetails, chgDetails, firstCall) {
  // Could be ADD or CHG
  console.log('chgPerson Pre-Change ', JSON.stringify(preChgDetails));
  console.log('chgPerson Changed ', JSON.stringify(chgDetails));
  //
  if ((firstCall) && (partners.value.length > 0)) {
    // Check Partners Array for any changes
    console.log('chgPerson  Check Partners', JSON.stringify(partners.value));
    for (const partner of partners.value) {
      if (partner.action == 'CHG') {
        let partnerChange = {
          chgName: partner.readName,
          chgRelated: partner.arrayRelated
        };
        chgPerson(partner, partnerChange, false);
      }
    }
  }
  //
  switch (preChgDetails.action) {
    case "ADD":
      // Add a new Person
      break;
    case "CHG":
      // Change an Existing Person
      // Cleanup the chgRelated array
      var clnRelated = [];
      for (var i = 0; i < chgDetails.chgRelated.length; ++i) {
        if (!(chgDetails.chgRelated[i].relatedAction == "READ")) {
          clnRelated.push(chgDetails.chgRelated[i]);
        }
      }
      if ((clnRelated.length == 0) && (chgDetails.chgName == preChgDetails.readName) && (chgDetails.chgLinkedListId == preChgDetails.linkListId)) {
        // Nothing Changed
        return;
      }
      chgDetails.chgRelated = clnRelated;
      break;
    default:
      console.log(`chgPerson - Invalid Action for Update - %s`, preChgDetails.action);
      return;
  }
  //
  saveData(preChgDetails, chgDetails);
  if (firstCall) {
    initScreen()
  }
}
//  Post updated data and expect ssePersonChg to trigger reload
function saveData(currentDetails, newDetails) {
  console.log("saveData action " + currentDetails.action);
  var updMetaData = {
    'oldPersonData': currentDetails,
    'updPersonData': newDetails
  };
  console.log('Sent to Server', JSON.stringify(updMetaData));
  // $.post( "/updUserMetaData/updateMetaData", updMetaData);
  // console.log (updatedData);
  const url = import.meta.env.VITE_SERVER_URL + "/updUserMetaData/updateMetaData";
  const options = {
    method: "post",
    mode: "cors",
    credentials: "include", // to send HTTP only cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    //make sure to serialize your JSON body
    body: JSON.stringify(updMetaData)
  };
  // console.log (options);
  useDoFetch('UserPersonListView/saveData', url, options);
}
// Initialise Screen
function initScreen() {
  showEditPersonName.value = false;
  showPersonDetails.value = false;
  setPersonActions('add');
  setPersonNameActions('start');
  savedPerson.action = "";
  savedPerson.personIndex = -1;
  savedPerson.readName = "";
  savedPerson.linkedListId = 0;
  linkListText.value = "Link to a List";
  linkedListText.value = "";
  linkedListIdx.value = -1;
  savedPerson.arrayRelated = [];
  updatePerson.chgName = "";
  updatePerson.chgLinkedListId = 0;
  updatePerson.chgRelated = [];
  partners.value = [];;
}
// Initaliase
initScreen();
// console.log("UserPersonListView - persons ", userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata);
//
</script>

<template>
  <div class="container-fluid">
    <h1>People identified by {{ userData.troveDetails.troveUserId }}</h1>
    <br>
    <div class="container">
      <div class="row">
        <div class="card col-6 pre-scrollable" style="max-height: 75vh">
          <div class="card border-0 overflow-auto">
            <a v-for="(metadataValue, idxValue) in userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata"
              @click.prevent="loadPerson(idxValue, -1)" href="#">
              {{ metadataValue.metadataValue }} [{{ metadataValue.articleListArray.length }}]
            </a>
          </div>
        </div>
        <div class="card col-6" style="max-height: 75vh">
          <div class="card-body">
            <p v-show="showDefaultPersonAction">Select a Person to Edit or Add a new Person</p>
            <div v-if="loadingPerson">
              <div class="row">
                <p>{{ loadingPersonText }}</p>
              </div>
            </div>
            <div v-if="showEditPersonName" class="metadataPopover" :style="{ 'background-color': notifyEditError }">
              <form>
                <div class="form-group">
                  <label for="inputName">Enter a Name</label>
                  <input v-model="updatePerson.chgName" id="inputName">
                  <span class="tooltiptext">{{ popoverForMetadata }}</span>
                  </input>
                </div>
              </form>
            </div>
            <div v-else class="font-weight-bold">
              {{ updatePerson.chgName }}
            </div>
            <div v-show="!showDefaultPersonAction">
              <div v-show="showRestorePersonAction" class="col">
                <div class="card">
                  <button @click.prevent="initScreen()" class="btn btn-primary">Clear Details</button>
                </div>
              </div>
              <div v-show="showLinkPersonAction" class="col">
                <div v-if="savedPerson.linkedListId == 0" class="card">
                  <button @click.prevent="showModalLists = true" class="btn btn-primary"
                    :class="{ disabled: savedPerson.action == 'CHG' }">{{ linkListText }}</button>
                </div>
                <div v-else class="card">
                  <button @click.prevent="unlinkListToPerson" class="btn btn-primary"
                    :class="{ disabled: savedPerson.action == 'CHG' }">{{ linkedListText }}</button>
                </div>
              </div>
              <div v-show="showSearchPerson" class="col">
                <div class="card">
                  <router-link :to="'/searchTrove/' + updatePerson.chgName.replaceAll(' ', '%20')"
                    class="btn btn-primary">
                    Search in Trove
                  </router-link>
                </div>
              </div>
              <div v-show="showEditPersonAction" class="col">
                <div class="card">
                  <button @click.prevent="editPersonClick()" class="btn btn-primary">Edit Person</button>
                </div>
              </div>
              <div v-show="showCheckPersonNameAction" class="col">
                <div class="card">
                  <button @click.prevent="checkPersonNameClick()" class="btn btn-primary">Check Person</button>
                </div>
              </div>
              <div v-show="showDeletePersonAction" class="col">
                <div class="card">
                  <button @click.prevent="delPersonClick()" class="btn btn-primary">Delete Person</button>
                </div>
              </div>
              <div v-show="showAddRelativeAction" class="col">
                <div class="card">
                  <button @click.prevent="showModalRelative = true" class="btn btn-primary">Add Relative</button>
                </div>
              </div>
            </div>
            <div v-show="showAddPerson" class="col">
              <div class="card">
                <button @click.prevent="addPerson()" class="btn btn-primary">Add Person</button>
              </div>
            </div>
            <!-- Buttons to confirm actions -->
            <div v-show="showDelPerson" class="col">
              <div class="card">
                <button @click.prevent="delPerson(savedPerson, updatePerson)" class="btn btn-primary">Confirm Delete
                  Person</button>
              </div>
            </div>
            <div v-show="showChgPerson" class="col">
              <div class="card">
                <button @click.prevent="chgPerson(savedPerson, updatePerson, true)" class="btn btn-primary">Apply
                  Updates to
                  Person</button>
              </div>
            </div>
            <div v-show="showPersonDetails">
              <div v-if="(linkedListIdx > -1)" class="card-body">
                Linked List <router-link :to="'/userListPage/' + userData.userLists[linkedListIdx].TroveListId"
                  class="active link-primary">
                  {{ userData.userLists[linkedListIdx].TroveListId + ' ' +
                    userData.userLists[linkedListIdx].TroveListName
                  }}
                </router-link>
                <br><span>List Articles </span>
                <ArticleUrls :inline="true" :articleListArray="userData.userListArticles[linkedListIdx]"
                  :troveListId="userData.userLists[linkedListIdx].TroveListId">
                </ArticleUrls>
              </div>
              <div v-else class="card-body">No Linked List</div>
              <div
                v-if="(savedPerson.personIndex > -1) && (userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[savedPerson.personIndex].articleListArray.length > 0)"
                class="card-body">
                <span>Linked Articles </span>
                <ArticleUrls :inline="true"
                  :articleListArray="userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[savedPerson.personIndex].articleListArray"
                  :troveListId="0">
                </ArticleUrls>
              </div>
              <div v-else class="card-body">No Linked Articles</div>
              <div v-if="updatePerson.chgRelated.length > 0" class="card-body overflow-auto">
                <RelatedTable :personName="updatePerson.chgName" :arrayRelated="updatePerson.chgRelated"
                  :enableDel="true" @del-relative="(index) => delRelativeClick(index)"
                  @load-person="(idxPerson) => loadPerson(idxPerson, -1)" />
                <div v-show="partners.length > 0" v-for="(partner, index) in partners">
                  <div>Partner - {{ partner.readName }}</div>
                  <RelatedTable :personName="partner.readName" :arrayRelated="partner.arrayRelated" :enableDel="false"
                    @load-person="(idxPerson) => loadPerson(idxPerson, -1)" />
                </div>
              </div>
              <div v-else class="card-body">No Related People</div>
              <Teleport to="#positionModals">
                <ModalLists v-if="showModalLists" @close="showModalLists = false"
                  @link-list="(linkList) => linkListToPerson(linkList)" :listPerson="updatePerson.chgName" />
              </Teleport>
              <Teleport to="#positionModals">
                <ModalRelative v-if="showModalRelative" @close="showModalRelative = false"
                  @add-relative="(relatedPerson) => addRelatedPerson(relatedPerson)" :savedPerson="savedPerson"
                  :updatedPerson="updatePerson" />
              </Teleport>
              <Teleport to="#positionModals">
                <ModalPartner v-if="showModalPartner" @close="showModalPartner = false"
                  @add-to-partner="(idxOtherParent) => addToRelatedPartner(idxOtherParent)"
                  :chgRelations="updatePerson.chgRelated" :partners="partners" />
              </Teleport>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
