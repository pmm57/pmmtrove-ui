<script setup>
import { ref, reactive } from 'vue';
import ArticleUrls from '@/components/ArticleUrls.vue';
import RelatedTable from '@/components/RelatedTable.vue';
import ModalLists from '@/components/ModalLists.vue';
import ModalRelative from '@/components/ModalRelative.vue';
import ModalPartner from '@/components/ModalPartner.vue';
import { useCheckName } from '@/components/CheckName.js';
import { useDoFetch } from '@/components/DoFetch.js';
import { useSavePersonData } from '@/components/SavePersonData.js';
import { useUserDataStore } from '@/stores/userdata';
const userData = useUserDataStore();
import { useRouter } from 'vue-router';
const router = useRouter();
import { useNavBarStore } from '@/stores/navbar';
const navStore = useNavBarStore();
import { useErrorsArrayStore } from '@/stores/errorsarray';
const errorsStore = useErrorsArrayStore();
//
let sourceLoadPerson = null;
let eventSourceReadArticles = null;
let sourceLoadPersonStory = null;
let loadingPerson = ref(false);
let loadingPersonText = ref("");
let linkListText = ref("Link to a List");
let linkedListText = ref("Unlink from List ");
let linkedListIdx = ref(-1);
let showPersonDetails = ref(false);
let showSearchPerson = ref(false);
let showEditPersonName = ref(false);
let showEditRefInfo = ref(false);
let personStoryText = ref('Person Story')
let readArticlesText = ref('')
let notifyEditError = ref('inherit');
let popoverForMetadata = ref('');
let showDefaultPersonAction = ref(true);
let showEditPersonAction = ref(false);
let showEditRefInfoAction = ref(false);
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
const refInfoAdd = 'Add Reference Information';
const refInfoUpdate = 'Update Reference Information';
const refInfoEdit = 'Edit Reference Information';
let buttonRefInfo = ref(refInfoAdd);
let partners = ref([]);
//
let updatePerson = reactive({
    chgName: '',
    chgRefInfo: '',
    chgLinkedListId: 0,
    chgRelated: []
});
//
// navStore.savedPerson = {
//   action: "",
//   personIndex: -1,
//   readName: "",
//   readRefInfo: '',
//   linkedListId: 0,
//   storyShowWhat: 'ALL'/'INC'/'PRM',
//   personStoryStatus: 'None',
//   personStoryIdx: 0,
//   arrayRelated: []
// };
console.log('Passed Person: ', JSON.stringify(navStore.savedPerson));
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
        if ((userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[navStore.savedPerson.personIndex].articleListArray.length == 0) &&
            (navStore.savedPerson.arrayRelated.length == 0) &&
            (linkedListIdx.value == -1)) {
            // As no linked articles or Relatives or List - Person can be deleted
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
        showEditRefInfoAction.value = true
    } else {
        showEditPersonAction.value = false
        showEditRefInfoAction.value = false
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
function handleLoadPersonMessage(e, intervalApersonData) {
    var returnedData = JSON.parse(e.data);
    console.log('Return Loadperson', JSON.stringify(returnedData));
    navStore.savedPerson.readName = returnedData.readPerson;
    navStore.savedPerson.readRefInfo = ''
    if (returnedData.hasOwnProperty("referenceInformation")) {
        navStore.savedPerson.readRefInfo = returnedData.referenceInformation
    }
    // navStore.savedPerson.storyShowWhat = returnedData.storyShowWhat
    navStore.savedPerson.personStoryStatus = 'None'
    if (returnedData.hasOwnProperty("personStoryStatus")) {
        navStore.savedPerson.personStoryStatus = returnedData.personStoryStatus
    }
    navStore.savedPerson.storyShowWhat = returnedData.storyShowWhat
    navStore.savedPerson.personStoryIdx = -1
    if ((returnedData.hasOwnProperty("personStoryIdx") && (returnedData.personStoryIdx > -1))) {
        navStore.savedPerson.personStoryIdx = returnedData.personStoryIdx
        // userData.storyEventsForPersons[returnedData.personStoryIdx] = returnedData.storyEvents
    }
    navStore.savedPerson.linkedListId = returnedData.linkedListId;
    navStore.savedPerson.arrayRelated = returnedData.arrayRelated;
    navStore.savedPerson.personIndex = returnedData.personIndex;
    navStore.savedPerson.action = "LOAD";
    // console.log('Return Savedperson', JSON.stringify(navStore.savedPerson));
    // Updated Linked Article URLS
    if ((navStore.savedPerson.personStoryStatus == 'None') && (userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[navStore.savedPerson.personIndex].articleListArray.length > 0))
        navStore.savedPerson.personStoryStatus = 'Create'
    // console.log('Return Linked Article URLs ', JSON.stringify(userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[navStore.savedPerson.personIndex].articleListArray));
    sourceLoadPerson.close();
    clearInterval(intervalApersonData);
    initPersonScreen()
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
    // console.log('Return Load Partner', JSON.stringify(partners.value[idxPartner]));
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
    console.log(`UserPersonListView/loadPerson PersonIdx:%s PartnerIdx:%s`, idxValue, idxPartner);
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
            showDefaultPersonAction.value = true;
            showPersonDetails.value = false;
            showEditPersonName.value = false;
            showEditRefInfo.value = false;
            sourceLoadPerson.addEventListener("LoadPerson", (e) => handleLoadPersonMessage(e, intervalLoadPerson), false);
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
    navStore.savedPerson.action = 'ADD';
    navStore.savedPerson.personIndex = -1;
    navStore.savedPerson.readName = "";
    navStore.savedPerson.storyShowWhat = "ALL";
    navStore.savedPerson.linkedListId = 0;
    linkListText.value = "Link to a List";
    linkedListText.value = "";
    navStore.savedPerson.arrayRelated = [];
    updatePerson.chgName = "";
    updatePerson.chgLinkedListId = 0;
    updatePerson.chgRelated = [];
    loadingPerson.value = false;
    showPersonDetails.value = false;
    showEditPersonName.value = true;
    showEditRefInfo.value = false;
    setPersonNameActions('check restore');
    setPersonActions('');
}
// Set editPersonName editable
function editPersonClick() {
    showEditPersonName.value = true;
    showEditRefInfo.value = false;
    showPersonDetails.value = false;
    setPersonNameActions('check restore');
    setPersonActions('');
    navStore.savedPerson.action = 'CHG';
}
// Set editPersonName editable
function editRefInfoClick() {
    if (buttonRefInfo.value == refInfoUpdate) {
        console.log('editRefInfoClick Update');
        buttonRefInfo.value = refInfoEdit
        navStore.savedPerson.action = 'CHG';
        setPersonNameActions('restore');
        setPersonActions("chg");
        showEditRefInfoAction.value = false;
        showEditRefInfo.value = false;
        showPersonDetails.value = true;
    } else {
        buttonRefInfo.value = refInfoUpdate;
        showEditRefInfo.value = true;
        showPersonDetails.value = false;
        setPersonNameActions('restore edit');
        setPersonActions('');
        showEditRefInfoAction.value = true;
    }
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
        // if (errorTip.length > 0) {
        //   valid = false;
        // }
    }
    // 
    if (errorTip.length == 0) {
        for (const el of userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata) {
            // OK if Selected Person
            // console.log ('|' + updatePerson.readName + '|' + addPersonName +'|' + strPerson[0] + '|')
            if (el.metadataValue != navStore.savedPerson.readName) {
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
        showEditRefInfo.value = false;
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
    useSavePersonData('delete Person', deletePerson, emptyPerson);
    initScreen('clear');
}
//
function linkListToPerson(linkList) {
    linkListText.value = "Link to List " + linkList;
    updatePerson.chgLinkedListId = parseInt(linkList.split("|")[0].trim());
    console.log('Link List ', updatePerson.chgLinkedListId, linkList);
    showModalLists.value = false;
    setPersonActions("chg");
    setPersonNameActions('relatives restore');
    navStore.savedPerson.action = 'CHG';
}
//
function unlinkListToPerson() {
    updatePerson.chgLinkedListId = 0;
    console.log('UnLink List ', updatePerson.chgLinkedListId);
    setPersonActions("chg");
    setPersonNameActions('relatives restore');
    navStore.savedPerson.action = 'CHG';
}
//
function troveSearch() {
    navStore.troveSearchName = updatePerson.chgName
    console.log(`UserPersonListView/troveSearch - Person - %s Events %s`, updatePerson.chgName);
    router.push({ name: 'searchTrove' });
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
    navStore.savedPerson.action = 'CHG';
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
    navStore.savedPerson.action = 'CHG';
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
    useSavePersonData('Change Person', preChgDetails, chgDetails);
    if (firstCall) {
        initScreen('clear')
    }
}
// Person Story
function personStory() {
    switch (navStore.savedPerson.personStoryStatus) {
        case "Create":
            navStore.storyPersonNew = true
            navStore.savedPerson.personStoryStatus = "Generating"
            break;
        case "Editing":
        case "Review":
            editPersonStory()
            return;
        case "Load":
            navStore.savedPerson.personStoryStatus = "Loading"
            break;
        default:
            console.log(`UserPersonListView/personStory - Invalid personStoryStatus - %s`, navStore.savedPerson.personStoryStatus);
            return;
    }
    const storyPerson = {
        "action": "STORY",
        "personIndex": navStore.savedPerson.personIndex,
        "readName": navStore.savedPerson.readName,
        "personStoryStatus": navStore.savedPerson.personStoryStatus,
        "storyShowWhat": navStore.savedPerson.storyShowWhat,
        "linkedListId": navStore.savedPerson.linkedListId,
        "arrayRelated": navStore.savedPerson.arrayRelated
    }
    console.log(`UserPersonLstView/personStory %s`, JSON.stringify(storyPerson));
    useSavePersonData('Person Story', storyPerson, {})
    //
    console.log('Set SSE Person Story:', navStore.savedPerson.personIndex);
    var intervalLoadPersonStory = setInterval(function () {
        personStoryText.value += ' .'
    }, 500);
    if (!!window.EventSource) {
        //
        var streamId = 'ReadArticles:' + userData.troveDetails.troveUserId
        var streamName = import.meta.env.VITE_SERVER_URL + '/streamTrove/userSSE/' + streamId;
        console.log(`personStory ReadArticles %s`, streamName);
        eventSourceReadArticles = new EventSource(streamName, { withCredentials: true });
        eventSourceReadArticles.addEventListener('error', (e) => handleError(e), false);
        eventSourceReadArticles.addEventListener(streamId, (e) => handleReadArticlesMessage(e), false);
        //
        streamId = 'PersonStory:' + userData.troveDetails.troveUserId + ':' + navStore.savedPerson.personIndex
        streamName = import.meta.env.VITE_SERVER_URL + '/streamTrove/userSSE/' + streamId;
        // console.log(streamName);
        sourceLoadPersonStory = new EventSource(streamName, { withCredentials: true });
        sourceLoadPersonStory.addEventListener('error', (e) => handleError(e), false);
        sourceLoadPersonStory.addEventListener(streamId, (e) => handleLoadStoryMessage(e, intervalLoadPersonStory, navStore.savedPerson.personIndex), false);
    } else {
        errorsStore.arrayErrors.push({ msg: `Your browser doesn't support SSE`, param: '' });
        console.log("Your browser doesn't support SSE");
    }
}
//
function handleLoadStoryMessage(e, intervalLoadPersonStory, idxPerson) {
    readArticlesText.value = ''
    var returnedData = JSON.parse(e.data);
    console.log('Return Load Person Story', JSON.stringify(returnedData), userData.troveDetails.troveUserId, idxPerson);
    personStoryText.value = 'Person Story'
    // Check this message is for this Userr and Person
    if ((returnedData.checkUserId != userData.troveDetails.troveUserId) || (returnedData.personIdx != idxPerson)) {
        console.log('UserPersonListView/handleLoadStoryMessage ERROR');
        navStore.savedPerson.personStoryStatus = 'ERROR'
        return
    }
    navStore.savedPerson.personStoryStatus = 'Review'
    // navStore.savedPerson.storyShowWhat = returnedData.storyShowWhat
    navStore.savedPerson.personStoryIdx = returnedData.personStoryIdx
    userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[idxPerson].personStoryIdx = returnedData.personStoryIdx
    userData.storyEventsForPersons[returnedData.personStoryIdx] = returnedData.storyEvents
    sourceLoadPersonStory.close();
    eventSourceReadArticles.close();
    clearInterval(intervalLoadPersonStory);
    editPersonStory();
}
//
function handleReadArticlesMessage(e) {
    var returnedData = JSON.parse(e.data);
    console.log('Read Article Message', JSON.stringify(returnedData));
    personStoryText.value.replace('.', '')
    readArticlesText.value = returnedData.progressText
}
//
function editPersonStory() {
    navStore.savedPerson.personStoryStatus = "Editing"
    navStore.disablePersonStory = false
    console.log(`UserPersonListView/personStory - Person - %s Events %s`,
        JSON.stringify(navStore.savedPerson), JSON.stringify(userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx]));
    console.log(`storyShowWhat %s`, navStore.savedPerson.storyShowWhat)
    router.push({ name: 'userPersonStory' });
}
//  Post updated data and expect ssePersonChg to trigger reload
// function saveData(currentDetails, newDetails) {
//     console.log("saveData action " + currentDetails.action);
//     var updMetaData = {
//         'oldPersonData': currentDetails,
//         'updPersonData': newDetails
//     };
//     console.log('Sent to Server', JSON.stringify(updMetaData));
//     // console.log (updatedData);
//     const url = import.meta.env.VITE_SERVER_URL + "/updUserMetaData/updateUserPersonMetadata";
//     const options = {
//         method: "post",
//         mode: "cors",
//         credentials: "include", // to send HTTP only cookies
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//         },
//         //make sure to serialize your JSON body
//         body: JSON.stringify(updMetaData)
//     };
//     // console.log (options);
//     useDoFetch('UserPersonListView/saveData', url, options);
// }
//
function openList(listLink) {
    console.log('UserPersonListView/openList ', listLink)
    navStore.listId = listLink;
    router.push({ name: 'userListPage' });
}
// Initialise Screen
function initScreen(initAction) {
    if ((navStore.savedPerson.personIndex > -1) && (initAction == '')) {
        if (navStore.savedPerson.action == 'Load') {
            loadPerson(navStore.savedPerson.personIndex, -1)
        } else { // Already loaded
            initPersonScreen()
        }
        return
    }
    showEditPersonName.value = false;
    showEditRefInfo.value = false;
    showPersonDetails.value = false;
    setPersonActions('add');
    setPersonNameActions('start');
    navStore.savedPerson.action = "";
    navStore.savedPerson.personIndex = -1;
    navStore.savedPerson.readName = "";
    navStore.savedPerson.linkedListId = 0;
    navStore.savedPerson.arrayRelated = [];
    linkListText.value = "Link to a List";
    linkedListText.value = "";
    linkedListIdx.value = -1;
    updatePerson.chgName = "";
    updatePerson.chgLinkedListId = 0;
    updatePerson.chgRelated = [];
    partners.value = [];;
}
//
function initPersonScreen() {
    showEditRefInfo.value = false
    if (navStore.savedPerson.readRefInfo.length > 0) {
        buttonRefInfo.value = refInfoEdit
    }
    linkedListText.value = "Unlink from List " + navStore.savedPerson.linkedListId;
    linkedListIdx.value = -1;
    if (navStore.savedPerson.linkedListId > 0) {
        linkedListIdx.value = userData.userLists.findIndex((item) => item.TroveListId === navStore.savedPerson.linkedListId);
        if (linkedListIdx.value > -1) {
            linkedListText.value += " | " + userData.userLists[linkedListIdx.value].TroveListName;
        } else {
            linkedListText.value += " | No Name";
        }
        if (navStore.savedPerson.personStoryStatus == 'None') navStore.savedPerson.personStoryStatus = 'Create'
    }
    if (navStore.savedPerson.personStoryIdx > -1) navStore.savedPerson.personStoryStatus = 'Review'
    console.log(`UserPersonListView/initPersonScreen Load Person %s %s`, linkedListIdx.value, JSON.stringify(navStore.savedPerson));
    setPersonActions('');
    updatePerson.chgName = navStore.savedPerson.readName;
    updatePerson.chgRefInfo = navStore.savedPerson.readRefInfo;
    updatePerson.chgLinkedListId = navStore.savedPerson.linkedListId;
    updatePerson.chgRelated = [];
    if (navStore.savedPerson.hasOwnProperty('arrayRelated')) {
        updatePerson.chgRelated = JSON.parse(JSON.stringify(navStore.savedPerson.arrayRelated));
        partners.value = [];
        for (var relation of updatePerson.chgRelated) {
            // Need this for relation hyper link
            relation.relatedIdxPerson = userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata.findIndex((el) => el.metadataValue == relation.relatedPerson);
            if (relation.relatedType == 'ChildWith') {
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
    loadingPerson.value = false;
    showPersonDetails.value = true;
    showEditPersonName.value = false;
    setPersonNameActions('');
    // Load partner details
    console.log('UserPersonListView/initPersonScreen Load Person Partners', JSON.stringify(partners.value));
    for (var idx = 0; idx < partners.value.length; ++idx) {
        loadPerson(partners.value[idx].personIndex, idx);
    };
}
// Initaliase
initScreen('');
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
                        <div v-if="loadingPerson">
                            <div class="row">
                                <p>{{ loadingPersonText }}</p>
                            </div>
                        </div>
                        <div v-else-if="showEditPersonName" class="metadataPopover"
                            :style="{ 'background-color': notifyEditError }">
                            <form>
                                <div class="form-group">
                                    <label for="inputName">Enter a Name</label>
                                    <input v-model="updatePerson.chgName" id="inputName" style="width: 400px;">
                                    <span class="tooltiptext">{{ popoverForMetadata }}</span>
                                    </input>
                                </div>
                            </form>
                        </div>
                        <div v-else-if="showDefaultPersonAction">
                            <p>Select a Person to Edit or Add a new Person</p>
                            <div class="card">
                                <button @click.prevent="addPerson()" class="btn btn-primary">Add Person</button>
                            </div>
                        </div>
                        <div v-else class="fw-bold">
                            {{ updatePerson.chgName }}
                        </div>
                        <div v-show="!showDefaultPersonAction">
                            <div v-show="showRestorePersonAction" class="col">
                                <div class="card">
                                    <button @click.prevent="initScreen('clear')" class="btn btn-primary">Clear
                                        Details</button>
                                </div>
                            </div>
                            <div v-show="showLinkPersonAction" class="col">
                                <div v-if="navStore.savedPerson.linkedListId == 0" class="card">
                                    <button @click.prevent="showModalLists = true" class="btn btn-primary"
                                        :class="{ disabled: navStore.savedPerson.action == 'CHG' }">{{ linkListText
                                        }}</button>
                                </div>
                                <div v-else class="card">
                                    <button @click.prevent="unlinkListToPerson" class="btn btn-primary"
                                        :class="{ disabled: navStore.savedPerson.action == 'CHG' }">{{ linkedListText
                                        }}</button>
                                </div>
                            </div>
                            <div v-show="showEditRefInfoAction" class="col">
                                <div class="card">
                                    <button @click.prevent="editRefInfoClick()" class="btn btn-primary"
                                        :class="{ disabled: (buttonRefInfo == refInfoUpdate && updatePerson.chgRefInfo.length < 5) }">{{
                                            buttonRefInfo }}</button>
                                </div>
                            </div>
                            <div v-show="showSearchPerson" class="col">
                                <div class="card">
                                    <button @click.prevent="troveSearch()" class="btn btn-primary">
                                        Search in Trove
                                    </button>
                                </div>
                            </div>
                            <div v-show="showEditPersonAction" class="col">
                                <div class="card">
                                    <button @click.prevent="personStory()" class="btn btn-primary"
                                        :disabled="['Generating', 'None', 'Loading'].indexOf(navStore.savedPerson.personStoryStatus) > -1">{{
                                            navStore.savedPerson.personStoryStatus }} {{ personStoryText }}</button>
                                    <button v-if="readArticlesText.length > 0" class="btn btn-primary">
                                        <span>{{ readArticlesText }}</span>
                                    </button>
                                </div>
                                <div class="card">
                                    <button @click.prevent="editPersonClick()" class="btn btn-primary">Edit Person
                                        Name</button>
                                </div>
                            </div>
                            <div v-show="showCheckPersonNameAction" class="col">
                                <div class="card">
                                    <button @click.prevent="checkPersonNameClick()" class="btn btn-primary">Check
                                        Person Name</button>
                                </div>
                            </div>
                            <div v-show="showDeletePersonAction" class="col">
                                <div class="card">
                                    <button @click.prevent="delPersonClick()" class="btn btn-primary">Delete
                                        Person</button>
                                </div>
                            </div>
                            <div v-show="showAddRelativeAction" class="col">
                                <div class="card">
                                    <button @click.prevent="showModalRelative = true" class="btn btn-primary">Add
                                        Relative</button>
                                </div>
                            </div>
                            <div v-show="showAddPerson" class="col">
                            </div>
                            <!-- Buttons to confirm actions -->
                            <div v-show="showDelPerson" class="col">
                                <div class="card">
                                    <button @click.prevent="delPerson(navStore.savedPerson, updatePerson)"
                                        class="btn btn-primary">Confirm
                                        Delete
                                        Person</button>
                                </div>
                            </div>
                            <div v-show="showChgPerson" class="col">
                                <div class="card">
                                    <button @click.prevent="chgPerson(navStore.savedPerson, updatePerson, true)"
                                        class="btn btn-primary">Apply
                                        Updates to
                                        Person</button>
                                </div>
                            </div>
                            <div v-if="showEditRefInfo">
                                <form>
                                    <div class="form-group">
                                        <label for="inputRefInfo">{{ buttonRefInfo }}: </label>
                                        <input v-model="updatePerson.chgRefInfo" id="inputRefInfo">
                                        </input>
                                    </div>
                                </form>
                            </div>
                            <div v-show="showPersonDetails">
                                <div v-if="(updatePerson.chgRefInfo.length > 0)" class="card-body">Reference - {{
                                    updatePerson.chgRefInfo }}</div>
                                <div v-else class="card-body">No Reference Information</div>
                                <div v-if="(linkedListIdx > -1)" class="card-body">
                                    Linked List
                                    <a href="#"
                                        @click.prevent="openList(userData.userLists[linkedListIdx].TroveListId)">
                                        {{ userData.userLists[linkedListIdx].TroveListId + ' ' +
                                            userData.userLists[linkedListIdx].TroveListName
                                        }}
                                    </a>
                                    <br><span>List Has {{ userData.userListArticles[linkedListIdx].length }}
                                        Articles</span>
                                </div>
                                <div v-else class="card-body">No Other Linked List</div>
                                <div v-if="(navStore.savedPerson.personIndex > -1) && (userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[navStore.savedPerson.personIndex].articleListArray.length > 0)"
                                    class="card-body">
                                    <span>Other Linked Articles </span>
                                    <ArticleUrls
                                        :key="userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[navStore.savedPerson.personIndex].articleListArray.map(a => a.idxViewedArticle).join(',')"
                                        :inline="true"
                                        :articleListArray="userData.metadataTypeByMetadata[idxMetadataPerson].arrayMetadata[navStore.savedPerson.personIndex].articleListArray">
                                    </ArticleUrls>
                                </div>
                                <div v-else class="card-body">No Linked Articles</div>
                                <div v-if="updatePerson.chgRelated.length > 0" class="card-body overflow-auto">
                                    <RelatedTable :personName="updatePerson.chgName"
                                        :arrayRelated="updatePerson.chgRelated" :enableDel="true"
                                        @del-relative="(index) => delRelativeClick(index)"
                                        @load-person="(idxPerson) => loadPerson(idxPerson, -1)" />
                                    <div v-show="partners.length > 0" v-for="(partner, index) in partners">
                                        <div>Partner - {{ partner.readName }}</div>
                                        <RelatedTable :personName="partner.readName"
                                            :arrayRelated="partner.arrayRelated" :enableDel="false"
                                            @load-person="(idxPerson) => loadPerson(idxPerson, -1)" />
                                    </div>
                                </div>
                                <div v-else class="card-body">No Related People</div>
                                <Teleport to="#positionModals">
                                    <ModalLists v-if="showModalLists" @close="showModalLists = false"
                                        @link-list="(linkList) => linkListToPerson(linkList)"
                                        :listPerson="updatePerson.chgName" />
                                </Teleport>
                                <Teleport to="#positionModals">
                                    <ModalRelative v-if="showModalRelative" @close="showModalRelative = false"
                                        @add-relative="(relatedPerson) => addRelatedPerson(relatedPerson)"
                                        :savedPerson="navStore.savedPerson" :updatedPerson="updatePerson" />
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
    </div>
</template>

<style></style>
