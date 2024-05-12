<script setup>
  import { ref, reactive } from 'vue'
  import EditItem from '@/components/EditItem.vue'
  import ArticleUrls from '@/components/ArticleUrls.vue'
  import RelatedTable from '@/components/RelatedTable.vue'
  import ModalRelative from '@/components/ModalRelative.vue'
  import ModalPartner from '@/components/ModalPartner.vue'
  import { useCheckName } from '@/components/CheckName.js'
  import { useDoFetch } from '@/components/DoFetch.js'
  import { useUserDataStore } from '@/stores/userdata'
  import { useErrorsArrayStore } from '@/stores/errorsarray'
  const errorsStore = useErrorsArrayStore()
  const userData = useUserDataStore()
  //
  var sourceLoadPerson = null
  var loadingPerson = ref(false)
  var loadingPersonText = ref("")
  var showPersonDetails = ref(false)
  var showSearchPerson = ref(false)
  var showEditPersonName = ref(false)
  var notifyEditError = ref('inherit')
  var popoverForMetadata = ref('')
  var showDefaultPersonAction = ref(true)
  var showEditPersonAction = ref(false)
  var showCheckPersonNameAction = ref(false)
  var showDeletePersonAction = ref(false)
  var showRestorePersonAction = ref(false)
  var showAddRelativeAction = ref(false)
  var showAddPerson = ref(false)
  var showChgPerson = ref(false)
  var showDelPerson = ref(false)
  var showModalRelative = ref(false)
  var showModalPartner = ref(false)
  var savedPerson = reactive({
    action: "",
    personIndex: -1,
    readName: "",
    arrayRelated: []
  });
  var arrayPartner = ref([])
  //
  var updatePerson = reactive({
    chgName: [],
    chgRelated: []
  });
  //
  const idxMetadataPerson = userData.metadataTypeByMetadata.findIndex((el) => el.metadataType === "Person")  
  const popoverPersonMetadata = 'Enter as Familyname (nee Maidenname), GivenName Initial As N. b.9999-d.9999'
  popoverForMetadata.value = popoverPersonMetadata
  //
  // These become active as confirmation buttons after a Person Name Action button
  function setPersonActions (showActions) {
    if (showActions.includes("add")) {
      showAddPerson.value = true;
    } else {
      showAddPerson.value = false;
    }  
    if (showActions.includes("del")) {
      showDelPerson.value = true;
    } else {
      showDelPerson.value = false;
    }  
    if (showActions.includes("chg")) {
      showChgPerson.value = true;
    } else {
      showChgPerson.value = false;
    }
  }  
  //
  function setPersonNameActions (showActions) {
    // 
    if (showActions.length ==0) {
      showActions = 'edit relatives restore';
      if ((userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[savedPerson.personIndex].articleListArray.length == 0) &&
       (savedPerson.arrayRelated.length == 0)) {
        // As not linked articles or Relatives - Person can be deleted
        showActions += ' delete';
      }
    }
    console.log ('setPersonNameAction ' + showActions);
    if (showActions.includes("start")) {
      showDefaultPersonAction.value = true
    } else {      
      showDefaultPersonAction.value = false
    }
    if (showActions.includes("edit")) {
      showEditPersonAction.value = true
    } else {      
      showEditPersonAction.value = false
    }
    if (showActions.includes("check")) {
      showCheckPersonNameAction.value = true
    } else {      
      showCheckPersonNameAction.value = false
    }
    if (showActions.includes("delete")) {
      showDeletePersonAction.value = true
    } else {      
      showDeletePersonAction.value = false
    }
    if (showActions.includes("restore")) {
      showRestorePersonAction.value = true
    } else {      
      showRestorePersonAction.value = false
    }
    if (showActions.includes("relatives")) {
      showAddRelativeAction.value = true
    } else {      
      showAddRelativeAction.value = false
    }
    return
  }
//
  function handleLoadPersonMessage(e, intervalApersonData, idxPartner) {
    var returnedData = JSON.parse(e.data)
    console.log('Return Loadperson', JSON.stringify(returnedData));
    // savedPerson = JSON.parse(e.data);
    savedPerson.readName = returnedData.readPerson
    savedPerson.arrayRelated = returnedData.arrayRelated
    savedPerson.personIndex = returnedData.personIndex
    savedPerson.action = "LOAD";
    console.log('Return Loadperson', savedPerson);
    setPersonActions('');
    updatePerson.chgName = savedPerson.readName
    updatePerson.chgRelated = [];
    if (savedPerson.hasOwnProperty('arrayRelated')) {
      updatePerson.chgRelated = JSON.parse(JSON.stringify(savedPerson.arrayRelated));
      arrayPartner.value = []
      for (var relation of updatePerson.chgRelated) {
        // Need this for relation hyper link
        relation.relatedIdxPerson = userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata.findIndex((el) => el.metadataValue == relation.relatedPerson)
        if ((idxPartner == -1) && (relation.relatedType == 'ChildWith')) {
          //Get partner details to link new ChildOf relations for current displayed person
          arrayPartner.value.push({
              action: "LOAD",
              personIndex: relation.relatedIdxPerson,
              readName: relation.relatedPerson,
              arrayRelated: []
            })
        }
      }
    }
    sourceLoadPerson.close();
    clearInterval(intervalApersonData);
    loadingPerson.value = false
    showPersonDetails.value = true
    showSearchPerson.value = true
    showEditPersonName.value = false
    setPersonNameActions ('')
    // Load partner details
    console.log ('Load Person Partners', arrayPartner.value)
    for (var idx = 0; idx < arrayPartner.value.length; ++idx) {
      loadPerson(arrayPartner.value[idx].personIndex, idx)
    }
  }
//
  function handleLoadPartnerMessage(e, intervalApersonData, idxPartner) {
    var returnedData = JSON.parse(e.data)
    console.log('Return Load Partner', JSON.stringify(returnedData));
    arrayPartner.value[idxPartner].readName = returnedData.readPerson
    arrayPartner.value[idxPartner].personIndex = returnedData.personIndex
    for (var relation of returnedData.arrayRelated) {
      // Need this for relation hyper link
      relation.relatedIdxPerson = userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata.findIndex((el) => el.metadataValue == relation.relatedPerson)
    }
    arrayPartner.value[idxPartner].arrayRelated = returnedData.arrayRelated
    console.log('Return Load Partner', JSON.stringify(arrayPartner.value[idxPartner]));
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
    console.log ('Load Person Person:', idxValue, idxPartner);
    var intervalLoadPerson = setInterval(function(){
      loadingPersonText.value += ' .'
      },500);
    if (!!window.EventSource) {
      var streamName = 'https://localhost:3000/streamTrove/LoadPerson/Person:' + idxValue;
      // console.log(streamName);
      sourceLoadPerson = new EventSource(streamName, { withCredentials: true });
      sourceLoadPerson.addEventListener('error', (e) => handleError(e), false);
      if (idxPartner > -1) {
        sourceLoadPerson.addEventListener("LoadPerson", (e) => handleLoadPartnerMessage(e, intervalLoadPerson, idxPartner), false);
      } else {
        loadingPerson.value = true
        loadingPersonText.value = "Loading Person Details"
        showPersonDetails.value = false
        showEditPersonName.value = false
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
      errorsStore.arrayErrors.push({msg : `Your browser doesn't support SSE`, param : ''});
      console.log("Your browser doesn't support SSE")
    }
  }
  //
  // Setup Screen so a new Person Can be added
  // Show Prompt with Check and Restore Actions
  // If the Check Person test is OK the 'Update Person' button is shown
  // If they click "Update Person" then chgPerson function is called
  function addPerson () {
    savedPerson.action = 'ADD'
    savedPerson.personIndex = -1
    savedPerson.readName = ""
    savedPerson.arrayRelated = []
    updatePerson.chgName = ""
    updatePerson.chgRelated = []
    loadingPerson.value = false
    showPersonDetails.value = false
    showEditPersonName.value = true
    setPersonActions('');
    setPersonNameActions('check restore');
  }
  // Set editPersonName editable
  function editPersonClick () {
    showEditPersonName.value = true
    showPersonDetails.value = false
    setPersonActions('');
    setPersonNameActions('check restore');
    savedPerson.action = 'CHG';
  }
    // On clicking the check edit button
  function checkPersonNameClick() {
    var errorTip = ''
    // Check Non-Blank
    if (updatePerson.chgName.length < 1) {
      errorTip =  'Is Blank';
    } else{
      errorTip = useCheckName (updatePerson.chgName);
      if (errorTip.length > 0) {
        valid = false
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
      notifyEditError.value = 'inherit'
      popoverForMetadata.value = popoverPersonMetadata
      showEditPersonName.value = false
      showPersonDetails.value = true
      showSearchPerson.value = true
      setPersonNameActions("restore");
      setPersonActions ("chg");
    }	else {
      notifyEditError.value = 'red'
      popoverForMetadata.value = errorTip
    }
  }
  //
  function delPersonClick () {
    showSearchPerson.value = false
    setPersonActions('del');
    setPersonNameActions ('restore');
  }
  // //
  function delPerson () {
    savedPerson.action = 'DEL';
    updatePerson.chgName = []
    updatePerson.chgRelated = []
    saveData ();
  }
  //
  function addRelatedPerson (relatedPerson) {
    console.log ('Add Relative ', JSON.stringify(relatedPerson));
    showModalRelative.value = false
    updatePerson.chgRelated.push(relatedPerson)
    // If partners
    if (arrayPartner.value.length > 0) {
    // If relation type is ChildOf - check Partner details and ask to link
      if (relatedPerson.relatedType == 'ChildOf') {
        // Find Which Partner
        var childWithPartner = -1
        for (var idx = 0; idx < arrayPartner.value.length; ++idx) {
          if (relatedPerson.relatedPerson == arrayPartner.value[idx].readName) {
            childWithPartner = idx
            break
          }
        }
        if (childWithPartner == -1) {
          console.log ('UserPersonListView addRelatedPerson No Partner')
          showModalPartner.value = true
        }
      }
    }
    setPersonActions ("chg");
    setPersonNameActions ('relatives restore');
    savedPerson.action = 'CHG';
  }
  //
  function addToRelatedPartner (otherParent) {

  }
  //
  function delRelativeClick(idx) {
    if (updatePerson.chgRelated[idx].relatedAction == 'ADD') {
      // Not updated yet - so remove from array
      updatePerson.chgRelated.splice(idx,1);
    } else {
      updatePerson.chgRelated[idx].relatedAction = 'DEL';
    }
    setPersonNameActions ('edit relatives restore');
    setPersonActions ("chg");
    savedPerson.action = 'CHG';
  }
  //
  function chgPerson () {
    // Could be ADD or CHG
    console.log ('Changed ', JSON.stringify(updatePerson));
    console.log('Pre-Change ', JSON.stringify(savedPerson))
    switch (savedPerson.action)
    {
      case "ADD":
        // Add a new Person
        break;
      case "CHG":
        // Change an Existing Person
        // Cleanup the chgRelated array
        var clnRelated = [];
        for (var i=0; i<updatePerson.chgRelated.length; ++i) {
          if (!(updatePerson.chgRelated[i].relatedAction == "READ")) {
            clnRelated.push(updatePerson.chgRelated[i]);
          }
        }
        if ((clnRelated.length == 0) && (updatePerson.chgName == savedPerson.readName)) {
          // Nothing Changed
          return;
        }
        updatePerson.chgRelated = clnRelated;
        break;
      default:
        console.log (`Invalid Action for Update - %s`, savedPerson.action);
        return
    }
    saveData ();
  }
  //  Post updated data and expect ssePersonChg to trigger reload
  function saveData () {
    console.log("click updateData action " + savedPerson.action);
    var updMetaData = {'oldPersonData' : savedPerson,
                      'updPersonData' : updatePerson
                      }
    console.log ('Sent to Server', JSON.stringify(updMetaData));
    // $.post( "/updUserMetaData/updateMetaData", updMetaData);
    // console.log (updatedData);
    const url = "https://localhost:3000/updUserMetaData/updateMetaData" ;
    const options = {                
              method: "post",
              mode: "cors", 
              credentials : "include", // to send HTTP only cookies
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              },
            //make sure to serialize your JSON body
            body: JSON.stringify(updMetaData)
          };
    // console.log (options);
    useDoFetch ('UserPersonListView/saveData', url, options)
    initScreen ()
  }
  // Initialise Screen
  function initScreen () {
    showEditPersonName.value = false
    showPersonDetails.value = false
    setPersonActions ('add');
    setPersonNameActions ('start');
    savedPerson.action = ""
    savedPerson.personIndex = -1
    savedPerson.readName = ""
    savedPerson.arrayRelated = []
    updatePerson.chgName = ""
    updatePerson.chgRelated = []
  }
  // Initaliase
  initScreen ()
  console.log ("UserPersonListView - persons ", userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata)
//
</script>

<template>
  <div class="container-fluid">
    <h1>People identified by {{ userData.troveUserId }}</h1>
    <br> 
    <div class="container">
      <div class="row">
        <div class="card col-6 pre-scrollable" style="max-height: 75vh" >
          <div class="card border-0" >
            <a
              v-for="(metadataValue, idxValue) in userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata"
              @click="loadPerson (idxValue, -1)"
              href="#" 
            >
              {{ metadataValue.metadataValue }} [{{metadataValue.articleListArray.length}}]
            </a>
          </div>
        </div>
        <div class="card col-6" style="max-height: 75vh">
          <div class="row">
            <div class="card-body">
              <p v-show="showDefaultPersonAction">Select a Person to Edit or Add a new Person</p>
              <p v-show="!showDefaultPersonAction">
                <span v-show="showEditPersonAction">Edit Person 
                  <EditItem @click-item="editPersonClick" action="Edit" icon="bi-pencil-square"/>
                </span>
                <span v-show="showCheckPersonNameAction">
                  <span v-show="showEditPersonAction"> OR </span>
                  Check Person 
                  <EditItem @click-item="checkPersonNameClick" action="Check" icon="bi-check-square"/>
                </span>
                <span v-show="showDeletePersonAction">
                  <span v-show="showEditPersonAction"> OR </span>
                  Delete Person 
                  <EditItem @click-item="delPersonClick" action="Delete" icon="bi-x-square"/>
                </span>
                <span v-show="showRestorePersonAction">
                  <span v-show="showEditPersonAction || showCheckPersonNameAction"> OR </span>
                  Go Back 
                  <EditItem @click-item="initScreen" action="Restore" icon="bi-arrow-counterclockwise"/>
                </span>
                <span v-show="showAddRelativeAction">
                  <span v-show="showRestorePersonAction"> OR </span>
                  Add Relative
                  <EditItem @click-item="showModalRelative=true" action="Add Relative" icon="bi-plus-square"/>
                </span>
              </p>
            </div>
          </div>
          <div class="row"> <!-- Buttons to confiirm actions -->
            <div v-show="showDelPerson" class="col">
              <div class="card">
                <button @click="delPerson()" class="btn btn-primary">Confirm Delete Person</button>
              </div>
            </div>
            <div v-show="showAddPerson" class="col">
              <div class="card">
                <button @click="addPerson()" class="btn btn-primary">Add Person</button>
              </div>
            </div>
            <div v-show="showChgPerson" class="col">
              <div class="card">
                <button @click="chgPerson()" class="btn btn-primary" >Apply Updates to Person</button>
              </div>
            </div>
          </div>
          <div class="row">
            <div v-show="loadingPerson" >
              <div class="row"><p>{{ loadingPersonText }}</p></div>
            </div>
            <div v-show="showEditPersonName" class="metadataPopover" :style="{ 'background-color': notifyEditError }">
              <input v-model="updatePerson.chgName">
              <span class="tooltiptext">{{ popoverForMetadata }}</span>
              </input>
            </div>
            <div v-show="showPersonDetails">
              <span> {{ updatePerson.chgName }}
                <a 
                  v-show="showSearchPerson"
                  href="'https://localhost:3000/searchTrove/person/' {{ updatePerson.chgName.replaceAll(' ', '%20') }} '" 
                  target="_blank" 
                  class="btn btn-primary btn-sm" 
                  role="button"
                >Search in Trove</a>
              </span>
              <div v-if="(savedPerson.personIndex > -1) && (userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[savedPerson.personIndex].articleListArray.length > 0)">
                <span>Linked Articles</span>
                <ArticleUrls :articleListArray="userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[savedPerson.personIndex].articleListArray"></ArticleUrls>
              </div>
              <div v-else>No Linked Articles</div>
              <div v-if="updatePerson.chgRelated.length > 0" class="card-body">
                  <RelatedTable
                    :arrayRelated="updatePerson.chgRelated"
                    :enableDel="true" 
                    @del-relative="(index) => delRelativeClick (index)"
                    @load-person="(idxPerson) => loadPerson(idxPerson, -1)"
                  />
                  <div v-show="arrayPartner.length > 0" v-for="(partner, index) in arrayPartner">
                    <div>Partner - {{partner.readName}}</div>
                    <RelatedTable
                      :arrayRelated="partner.arrayRelated"
                      :enableDel="false"
                      @load-person="(idxPerson) => loadPerson(idxPerson, -1)"
                    />
                  </div>
              </div>
              <div v-else>No Related People</div>
              <Teleport to="#positionModals">
                <ModalRelative
                  v-if="showModalRelative"
                  @close="showModalRelative=false"
                  @add-relative="(relatedPerson) => addRelatedPerson (relatedPerson)"
                  :savedPerson="savedPerson"
                  :updatedPerson="updatePerson"
                />
              </Teleport>
              <Teleport to="#positionModals">
                <ModalPartner
                  v-if="showModalPartner"
                  @close="showModalPartner=false"
                  @add-to-partner="(otherParent) => addToRelatedPartner (otherParent)"
                  :chgRelations="updatePerson.chgRelated"
                  :arrayPartner="arrayPartner"
                />
              </Teleport>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
</style>
