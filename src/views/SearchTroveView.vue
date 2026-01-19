<script setup>
import { ref, reactive } from 'vue';
import ArticleUrls from '@/components/ArticleUrls.vue'
import EditItem from '@/components/EditItem.vue'
import { useDoFetch } from '@/components/DoFetch.js';
import { unstringifyName } from '@/components/UnstringifyName.js';
import { useUserDataStore } from '@/stores/userdata';
import { useErrorsArrayStore } from '@/stores/errorsarray';
import { useRouter } from 'vue-router';
const router = useRouter();
import { useNavBarStore } from '@/stores/navbar';
const navStore = useNavBarStore();
const errorsStore = useErrorsArrayStore();
const userData = useUserDataStore();
//
let loading = ref(false);
let loadingText = ref("");
let showSearchToggle = ref(true);
let searchBlock = ref(false);
// let searchTypePerson = false;
let searchFor = ref("");
let searchProximate = ref(false);
const limitStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
let allStates = ref(true);
let limitState = ref("");
const limitDecades = ["1800-1809", "1810-1819", "1820-1829", "1830-1839", "1840-1849", "1850-1859", "1860-1869", "1870-1879", "1880-1889", "1890-1899", "1900-1909", "1900-1909", "1920-1929", "1930-1939", "1940-1949", "1950-1959", "1960-1969", "1970-1979"];
let showLimitToDecade = ref(false);
let limitDecade = ref("");
let allYears = ref(true);
let showLimitYear = ref(false);
let limitYears = reactive([]);
let limitYear = ref("");
let showNew = ref(true);
let showKnown = ref(false);
let showIgnored = ref(false);
let ignoreAction = ref('');
let ignoreIcon = ref('');
let showIgnoreActionFiller = '';
let hideAction = ref('');
let hideIcon = ref('');
let showReturnedYears = ref(false);
let disableSearch = ref(true);
let disableNext = ref(false);
let disableSaveIgnored = ref(true);
let disableSaveUnignore = ref(true);
let toggleNew = ref(true);
let refNewSwitch = ref(null);
let toggleKnown = ref(false);
let toggleRelevant = ref(false);
let toggleIgnored = ref(false);
let toggleHidden = ref(false);
let dupColour = "lightGreen";

let searchCounts = reactive({
  nbrNew: 0,
  nbrKnown: 0,
  nbrLessRelevant: 0,
  nbrIgnored: 0,
  nbrToIgnore: 0,
  nbrToUnignore: 0,
  nbrHidden: 0
});
let newSearch = reactive({})
// {searchId: 0,
// searchString: '',  
// next: false,
//   total: 0,
//   pageNbr: 1,
//   maxPageNbr: n,
// nextURL: '',
// showNew: true,
// showKnown: false,
// showIgnored: false,
// searchAllStates: true,
// searchLimitState: '',
// searchAllYears: true,
// searchLimitDecade: '',
// searchLimitYear: ''};
let searchData = reactive({});
// {  searchId: 0,  
//   searchString: '',  
//   next: false,
//   total: 0,
//   pageNbr: 1,
//   maxPageNbr: n,
//   nextURL: '',
//   showNew: true,
//   showKnown: false,
//   showIgnored: false,
//   searchAllStates: true,
//   searchLimitState: '',
//   searchAllYears: true,
//   searchLimitDecade: '',
//   searchLimitYear: '',
//   searchResults: [],
//   searchCountState :[],
//   searchCountDecade :[],
//   searchCountYear : []}
//
//  Post array of Ignored Article Id's
function postIgnoredArticles() {
  var items = [];
  searchData.searchResults.forEach((el, index) => {
    if (el.status == 'IgnoreArticle') {
      // console.log ('Ignore Article ', el)
      searchData.searchResults[index].status = 'Ignored';
      items.push(el);
    }
  });
  // console.log("clicked Save Ignored action " + JSON.stringify(items));
  const ignored = {
    ignoreArticles: items,
    reloadArticle: true
  };
  //
  const url = import.meta.env.VITE_SERVER_URL + "/searchTrove/updateIgnored";
  const options = {
    method: "post",
    mode: "cors",
    credentials: "include", // to send HTTP only cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    //make sure to serialize your JSON body
    body: JSON.stringify(ignored)
  };
  useDoFetch('Ignore Articles', url, options)
  refNewSwitch.value.focus();
  searchCounts.nbrToIgnore = 0;
  disableSaveIgnored.value = true;
  // searchBlock.value = false;
}
//
//  Post array of Ignored Article Id's to Unignore
function postUnignoreArticles() {
  var items = [];
  searchData.searchResults.forEach((el, index) => {
    if (el.status == 'UnignoreArticle') {
      // console.log ('Ignore Article ', el)
      searchData.searchResults[index].status = 'New';
      items.push(el);
    }
  });
  // console.log("clicked Save Ignored action " + JSON.stringify(items));
  const unignored = {
    unignoreArticles: items,
    reloadArticle: true
  };
  //
  const url = import.meta.env.VITE_SERVER_URL + "/searchTrove/updateUnignored";
  const options = {
    method: "post",
    mode: "cors",
    credentials: "include", // to send HTTP only cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    //make sure to serialize your JSON body
    body: JSON.stringify(unignored)
  };
  useDoFetch('Unignore Articles', url, options)
  refNewSwitch.value.focus();
  searchCounts.nbrIgnored = searchCounts.nbrIgnored + searchCounts.nbrToUnignore;
  searchCounts.nbrToUnignore = 0;
  disableSaveUnignore.value = true;
  // searchBlock.value = false;
}
//
function checkSearchProximate() {
  console.log('checkSearchProximate', searchProximate.value);
  var isProximate = false;
  if (searchFor.value.includes('~')) {
    console.log('isProximate');
    isProximate = true;
  }
  if (searchProximate.value) {
    if (!(isProximate)) {
      // need at least two words
      var words = searchFor.value.split(' ');
      if (words.length < 2) {
        alert('Need two or more words for Proximate Search');
      } else {
        searchFor.value += "~2";
      }
    }
  } else {
    //remove ~
    if (isProximate) {
      var str = searchFor.value.split('~');
      // console.log (str);
      searchFor.value = str[0];
    }
  }
  changeSearch()
}
//
function checkIfLimitState() {
  // console.log ("Check Limit State:", allStates.value)
  if (allStates.value) {
    limitState.value = "";
  } else {
    limitState.value = "SA";
  }
  changeSearch()
}
//
function checkIfLimitYears() {
  limitYears = [];
  // console.log ("Check Limit Year:", allYears.value)
  if (allYears.value) {
    limitDecade.value = "";
    showLimitToDecade.value = false;
    showLimitYear.value = false;
  } else {
    showLimitToDecade.value = true;
    limitDecade.value = "187";
    // If there is a search result with a decade limit
    // then there should be Year Counts to use for radio buttons
    if ((searchData.hasOwnProperty('searchCountYear'))
      && (searchData.searchCountYear.length > 0)) {
      showLimitYear.value = true;
    }
  }
  changeSearch()
}
// On clicking the hide row
function hideRowClick(index) {
  switch (searchData.searchResults[index].status) {
    case 'HideArticle':
      searchData.searchResults[index].status = 'New';
      --searchCounts.nbrHidden;
      break;
    default:
      searchData.searchResults[index].status = 'HideArticle';
      ++searchCounts.nbrHidden;
  }
}
// On clicking the ignore row
// New => IgnoreArticle => Remove from TO Ignore
//                      => OR Save => Ignored
// Ignored => UnignoreArticle
//
function ignoreArticleClick(index) {
  // console.log ('ignoreArticleClick ', searchData.searchResults[index].status);
  switch (searchData.searchResults[index].status) {
    case 'Ignored':
      searchData.searchResults[index].status = 'UnignoreArticle';
      ++searchCounts.nbrToUnignore;
      ignoreAction = "UnIgnore";
      ignoreIcon = "bi bi-file-earmark-arrow-up";
      break;
    case 'UnignoreArticle':
      searchData.searchResults[index].status = 'Ignored';
      --searchCounts.nbrToUnignore;
      ignoreAction = "UnIgnore";
      ignoreIcon = "bi bi-file-earmark-arrow-up";
      break;
    case 'IgnoreArticle':
      searchData.searchResults[index].status = 'New';
      --searchCounts.nbrToIgnore;
      ignoreAction = "Add to Ignore List";
      ignoreIcon = "bi bi-file-earmark-arrow-down";
      break;
    default:
      ignoreAction = "Remove from TO Ignore List";
      ignoreIcon = "bi bi-file-earmark-arrow-up";
      searchData.searchResults[index].status = 'IgnoreArticle';
      ++searchCounts.nbrToIgnore;
  }
  if (searchCounts.nbrToIgnore > 0) {
    disableSaveIgnored.value = false;
  }
  if (searchCounts.nbrToUnignore > 0) {
    disableSaveUnignore.value = false;
  }
}
//
function getSearch() {
  var aSearch = {
    searchId: 0,
    searchString: searchFor.value,
    next: false,
    total: 0,
    pageNbr: 0,
    maxPageNbr: 0,
    nextURL: '',
    showNew: showNew.value,
    showKnown: showKnown.value,
    showIgnored: showIgnored.value,
    searchAllStates: allStates.value,
    searchLimitState: '',
    searchAllYears: allYears.value,
    searchLimitDecade: '',
    searchLimitYear: ''
  }
  if (!aSearch.searchAllStates) {
    aSearch.searchLimitState = limitState.value;
  }
  if (!aSearch.searchAllYears) {
    aSearch.searchLimitDecade = limitDecade.value;
    aSearch.searchLimitYear = limitYear.value;
  }
  // Generate SearchId
  var strSearchFields = JSON.stringify(aSearch);
  [...strSearchFields].forEach((aChar, index) => {
    aSearch.searchId = aSearch.searchId + (aChar.codePointAt(0) * index)
  });
  return aSearch;
}
//
function changeSearchText() {
  // Save for later to reset the keyup.once
  // console.log ('Change Search test ', searchFor.value.length, disableSearch.value)
  if ((searchFor.value.length > 4) && (disableSearch.value)) {
    changeSearch();
  }
}
// Has user changed the search
function changeSearch() {
  //
  newSearch = getSearch();
  // console.log (`Check Same Search %s %s`, newSearch.searchId, searchData.searchId);
  if (newSearch.searchId != searchData.searchId) {
    disableSearch.value = false;
  } else {
    disableSearch.value = true;
  }
}
//
function outputSearch() {
  // Get counts
  searchData.searchCountState = [];
  searchData.searchCountDecade = [];
  searchData.searchCountYear = [];
  searchCounts.nbrNew = 0;
  searchCounts.nbrKnown = 0;
  searchCounts.nbrIgnored = 0;
  searchCounts.nbrToIgnored = 0;
  searchCounts.nbrToUnignore = 0;
  searchCounts.nbrLessRelevant = 0;
  searchCounts.nbrHidden = 0;
  searchData.searchResults.forEach(element => {
    //
    switch (element.status) {
      case 'HideArticle':
        ++searchCounts.nbrHidden;
        break;
      case 'Known':
      case 'KnownStored':
        ++searchCounts.nbrKnown;
        break;
      case 'Ignored':
      case 'IgnoreArticle':
        ++searchCounts.nbrIgnored;
        break;
      case 'LowRelevance':
        ++searchCounts.nbrLessRelevant;
        break;
      default:
        // Setup for Show New
        ++searchCounts.nbrNew;
    }
    //
    var stateIndex = searchData.searchCountState.findIndex(item => item.label == element.state);
    if (stateIndex == -1) { // Sort Insert
      var newState = {
        label: element.state,
        nbrFound: 0
      };
      stateIndex = 0;
      var listLen = searchData.searchCountState.length;
      if (listLen > 0) {
        while (searchData.searchCountState[stateIndex].label < element.state) {
          ++stateIndex;
          if (stateIndex == listLen) {
            break;
          }
        }
        searchData.searchCountState.splice(stateIndex, 0, newState);
      } else {
        searchData.searchCountState.push(newState);
      }
    }
    ++searchData.searchCountState[stateIndex].nbrFound;
    //
    var resDecade = element.date.slice(0, 3);
    var decadeIndex = searchData.searchCountDecade.findIndex(item => item.label == resDecade);
    if (decadeIndex == -1) { // Sort Insert
      var newDecade = {
        label: resDecade,
        nbrFound: 0,
        arrayYear: []
      };
      decadeIndex = 0;
      var listLen = searchData.searchCountDecade.length;
      if (listLen > 0) {
        while (searchData.searchCountDecade[decadeIndex].label < resDecade) {
          ++decadeIndex;
          if (decadeIndex == listLen) {
            break;
          }
        }
        searchData.searchCountDecade.splice(decadeIndex, 0, newDecade);
      } else {
        searchData.searchCountDecade.push(newDecade);
      }
    }
    ++searchData.searchCountDecade[decadeIndex].nbrFound;
    //
    // Only Count Years if a Decade Limit has been done
    if (!(searchData.searchAllYears)) {
      var resYear = element.date.slice(0, 4);
      var yearIndex = searchData.searchCountYear.findIndex(item => item.label == resYear);
      if (yearIndex == -1) { // Sort Insert
        var newYear = {
          label: resYear,
          nbrFound: 0
        };
        yearIndex = 0;
        var listLen = searchData.searchCountYear.length;
        if (listLen > 0) {
          while (searchData.searchCountYear[yearIndex].label < resYear) {
            ++yearIndex;
            if (yearIndex == listLen) {
              break;
            }
          }
          searchData.searchCountYear.splice(yearIndex, 0, newYear);
        } else {
          searchData.searchCountYear.push(newYear);
        }
      }
      ++searchData.searchCountYear[yearIndex].nbrFound;
    }
  });
  //
  showKnown.value = searchData.showKnown;
  showIgnored.value = searchData.showIgnored;
  showNew.value = searchData.showNew;
  // 
  // If there is a search result with a decade limit
  // then there should be Year Counts
  if ((searchData.hasOwnProperty('searchCountYear'))
    && (searchData.searchCountYear.length > 0)) {
    limitYears = searchData.searchCountYear
    showReturnedYears.value = true;
    showLimitYear.value = true;
  } else {
    showReturnedYears.value = false;
    showLimitYear.value = false;
  }
  //
  disableNext.value = false;
  if (searchData.nextURL == 'done') {
    disableNext.value = true;
  }
  //
  loading.value = false;
  searchBlock.value = true;
  showSearchToggle.value = false;
}
//
function showResultRow(status) {
  // console.log ('showResult:', JSON.stringify(status))
  switch (status) {
    case 'HideArticle':
      if (toggleHidden.value) {
        return true;
      } else {
        return false;
      }
      break;
    case 'Known':
    case 'KnownStored':
      if (toggleKnown.value) {
        return true;
      } else {
        return false;
      }
      break;
    case 'Ignored':
    case 'IgnoreArticle':
      if (toggleIgnored.value) {
        return true;
      } else {
        return false;
      }
      break;
    case 'LowRelevance':
      if (toggleRelevant.value) {
        return true;
      } else {
        return false;
      }
      break;
    default:
      // Setup for Show New
      if (toggleNew.value) {
        return true;
      } else {
        return false;
      }
  }
}
//
function haveListLink(listId) {
  let haveLink = userData.userListsReady
  let idxList = userData.userLists.findIndex((item) => item.TroveListId == Number(listId));
  if ((idxList > -1) && (userData.userLists[idxList].TroveListItemCount == 0)) haveLink = false;
  if (userData.userDuplicateListIds.indexOf(Number(listId)) > -1) haveLink = false; // Disable Link if it is the list holding duplicate articles
  return haveLink
}
//
function showStatus(status) {
  // Setup for Show Known-KnownStored / Ignored / New
  switch (status) {
    case 'Known':
    case 'KnownStored':
      return "Known";
    case 'Ignored':
    case 'IgnoreArticle':
      return "Ignored";
    case 'LowRelevance':
      return "Low Relevance";
    case 'HideArticle':
    default:
      return "No";
  }
}
//
function showIgnoreAction(status) {
  showIgnoreActionFiller = ' - ';
  switch (status) {
    case 'HideArticle':
    case 'Known':
    case 'KnownStored':
      showIgnoreActionFiller = '';
      return false;
    case 'Ignored':
      ignoreAction = "UnIgnore";
      ignoreIcon = "bi bi-file-earmark-arrow-up";
      return true;
    case 'IgnoreArticle':
      ignoreAction = "Remove from TO Ignore List";
      ignoreIcon = "bi bi-file-earmark-arrow-up";
      return true;
    case 'LowRelevance':
    default:
      ignoreAction = "Add to Ignore List";
      ignoreIcon = "bi bi-file-earmark-arrow-down";
      return true;
  }
}
//
function showHideAction(status) {
  switch (status) {
    case 'HideArticle':
      hideAction = "Unhide Row";
      hideIcon = "bi bi-toggle-on";
      break;
    // case 'Known':
    // case 'KnownStored':
    // case 'Ignored':
    // case 'IgnoreArticle':
    // case 'LowRelevance':
    default:
      hideAction = "Hide Row";
      hideIcon = "bi bi-toggle-off";
  }
  return true;
}
//
function foundCount(which, countInfo, last) {
  // console.log ('foundCount', which, countInfo, last)
  let foundCountOut = '';
  if (countInfo.nbrFound > 0) {
    foundCountOut = ((which == 'D') ? countInfo.label + '0-' + countInfo.label + '9' + ' (' + countInfo.nbrFound + ')' : countInfo.label + ' (' + countInfo.nbrFound + ')');
    if (last > 0) {
      foundCountOut += ' -';
    }
  }
  return foundCountOut
}
//
function identifyDuplicate(index) {
  let dupFound = false;
  if (searchData.searchResults[index].articleMatch < 50) {
    dupFound = true;
  } else {
    if (index == (searchData.searchResults.length - 1)) return {};
    if (searchData.searchResults[index + 1].articleMatch > 50) return {};
    // Are the dates close enough
    const thisDateParts = searchData.searchResults[index].date.split('-');
    const thisDate = new Date(thisDateParts[0], thisDateParts[1], thisDateParts[2]);
    const thisDate_ms = thisDate.getTime();
    const nextDateParts = searchData.searchResults[index + 1].date.split('-');
    const nextDate = new Date(nextDateParts[0], nextDateParts[1], nextDateParts[2]);
    const nextDate_ms = nextDate.getTime();
    const daysApart = Math.round(Math.abs((thisDate_ms) - (nextDate_ms)) / 8.64e7);
    if (daysApart < 6) {
      if (dupColour == "lightYellow") {
        dupColour = "lightGreen";
      } else {
        dupColour = "lightYellow";
      }
      dupFound = true;
    }
  }
  //
  if (dupFound) {
    // console.log ("identifyDuplicate:", dupFound)
    return { background: dupColour };
  }
  return {};
}
//
function waitSearch() {
  loading.value = true;
  searchBlock.value = false;
  loadingText.value = "Loading Search Results ";
  let intervalLoading = setInterval(function () {
    loadingText.value += '.';
  }, 500);
  if (!!window.EventSource) {
    var searchName = userData.troveDetails.troveUserId + ':searchNbr' + newSearch.searchId;
    var streamName = import.meta.env.VITE_SERVER_URL + '/streamTrove/loadSearch/' + searchName;
    // console.log(streamName);
    var source = new EventSource(streamName, { withCredentials: true });
    // Close if still open when window closed
    // $(window).bind('beforeunload', function(){
    //   if (source.readyState != EventSource.CLOSED) {
    //     // console.log('stop ' + streamName);
    //     source.close();
    //   }
    // });
    //console.log('start ' + streamName);
    source.addEventListener(searchName, function (e) {
      clearInterval(intervalLoading);
      var returnData = JSON.parse(e.data);
      if (returnData.next) {
        searchData.next = returnData.next;
        searchData.maxPageNbr = returnData.maxPageNbr;
        searchData.pageNbr = returnData.pageNbr;
        searchData.nextURL = returnData.nextURL;
        searchData.searchResults.push(...returnData.searchResults);
      } else {
        searchData = JSON.parse(e.data);
        searchData.maxPageNbr = Math.ceil(searchData.total / 50.0);
        searchData.pageNbr = 1;
        console.log('Pages ', searchData.total, searchData.pageNbr, searchData.maxPageNbr);
      }
      console.log('Return Result', searchData);
      source.close();
      outputSearch();
    }, false);
    source.addEventListener('error', function (e) {
      if (e.target.readyState == EventSource.CLOSED) {
        console.log("Disconnected");
      }
      else if (e.target.readyState == EventSource.CONNECTING) {
        console.log("Connecting...");
      }
    }, false);
  } else {
    console.log("Your browser doesn't support SSE")
  }
}
//
function postSearch(blnNew) {
  // searchField.blur();
  disableSearch.value = true;
  disableNext.value = true;
  disableSaveIgnored.value = true;
  //
  // console.log('Post Search ', blnNew, JSON.stringify(searchData.nextURL))
  newSearch = getSearch();
  if (!(blnNew)) { // Next
    newSearch.next = true;
    newSearch.maxPageNbr = searchData.maxPageNbr;
    newSearch.pageNbr = ++searchData.pageNbr;
    newSearch.nextURL = searchData.nextURL;
  }
  console.log('Post this Search', JSON.stringify(newSearch));
  const url = import.meta.env.VITE_SERVER_URL + "/searchTrove/";
  const options = {
    method: "post",
    mode: "cors",
    credentials: "include", // to send HTTP only cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    //make sure to serialize your JSON body
    body: JSON.stringify(newSearch)
  };
  console.log(options);
  useDoFetch('Search', url, options)
  waitSearch();
}
//
function openList(listLink) {
  console.log('SearchTroveView/openList ', listLink)
  navStore.listId = listLink;
  router.push({ name: 'userListPage' });
}
// Initialisation
searchData.searchId = 0;
// Get passed Data
// console.log ('Passed Person: ', navStore.troveSearchName);
if (navStore.troveSearchName != '') {
  console.log('Passed Person: ', navStore.troveSearchName);
  const searchPerson = unstringifyName(navStore.troveSearchName);
  var nameParts = searchPerson.familyName.split(' ');
  var searchStr = nameParts[0];
  if (searchPerson.hasOwnProperty('givenNames')) {
    nameParts = searchPerson.givenNames.split(' ');
    searchStr += ' ' + nameParts[0];
  }
  searchFor.value = '"' + searchStr + '"~2';
  searchProximate.value = true
  allStates.value = false;
  limitState.value = 'SA';
  if (searchPerson.hasOwnProperty('yearOfBirth')) {
    allYears.value = false;
    showLimitToDecade.value = true;
    limitDecade.value = searchPerson.yearOfBirth.slice(2, 5);
    if (limitDecade.value < '180') {
      limitDecade.value = '184';
    }
  }
  postSearch(true);
}
</script>
//
<template>
  <div class="card">
    <details :open="showSearchToggle">
      <summary>Trove Search</summary>
      <div class="card-body">
        <!-- Search Input -->
        <div class="form-group">
          <input type="text" class="form-control" v-model="searchFor" @keyup="changeSearchText()"
            placeholder="Enter Search" autofocus>
        </div>
        <div>Restrict Search To</div>
        <div class="form-check form-check-inline">
          <input type="checkbox" class="form-check-input" v-model="searchProximate" @change="checkSearchProximate"
            id="checkboxSearchProximate">
          <label class="form-check-label" for="checkboxSearchProximate">Search Proximate</label>
        </div>
        <div class="fform-check form-check-inline">
          <input type="checkbox" class="form-check-input" v-model="allStates" @change="checkIfLimitState"
            id="checkboxAllStates">
          <label class="form-check-label" for="checkboxAllStates">Include All States</label>
        </div>
        <div class="form-check form-check-inline">
          <input type="checkbox" class="form-check-input" v-model="allYears" @change="checkIfLimitYears"
            id="checkboxAllYears">
          <label class="form-check-label" for="checkboxAllYears">Include All Years</label>
        </div>
        <!--Radio group of States to Limit Search -->
        <div v-show="!allStates">
          <div class="form-check form-check-inline" v-for="state in limitStates" @change="changeSearch()">
            <input class="form-check-input" type="radio" name=stateLimit :id="'radioState' + state" :value="state"
              v-model="limitState">
            <label class="form-check-label form-nowrap" :for="'radioState' + state">{{ state }}</label>
          </div>
        </div>
        <div v-show="showLimitToDecade">
          <!--Radio group of Decade to Limit Search -->
          <div v-for="decade in limitDecades" @change="changeSearch()" class="form-check form-check-inline">
            <input type="radio" class="form-check-input" name=decadeLimit :id="'radioDecade' + decade"
              :value="decade.substring(0, 3)" v-model="limitDecade">
            <label class="form-check-label form-nowrap" :for="'radioDecade' + decade">{{ decade }}</label>
          </div>
        </div>
        <div v-show="showLimitYear">
          <!--Radio group of Years to Limit Search -->
          <div v-for="year in limitYears" @change="changeSearch()" class="form-check form-check-inline">
            <input type="radio" class="form-check-input" name=yearLimit :id="'radioYear' + year.label"
              :value="year.label" v-model="limitYear">
            <label class="form-check-label form-nowrap" :for="'radioYear' + year.label">{{ year.label }}</label>
          </div>
        </div>
        <div id="showSwitches1">
          <div>Process Search Results</div>
          <div class="form-check-inline">
            <input type="checkbox" class="form-check-input" id="showNewSwitch" v-model="showNew">
            <label class="form-check-label" for="showNewSwitch">Show New Articles</label>
          </div>
          <div class="form-check-inline">
            <input type="checkbox" class="form-check-input" id="showKnownSwitch" v-model="showKnown">
            <label class="form-check-label" for="showKnownSwitch">Show Known Articles</label>
          </div>
          <div class="form-check-inline">
            <input type="checkbox" class="form-check-input" id="showIgnoredSwitch" v-model="showIgnored">
            <label class="form-check-label" for="showIgnoredSwitch">Show Ignored Articles</label>
          </div>
        </div>
        <div class="form-group">
          <input @click.prevent="postSearch(true)" :class="{ disabled: disableSearch }" class="btn btn-primary"
            type="button" value="Search">
        </div>
      </div>
    </details>
  </div>
  <div class="card">
    <div v-show="loading" class="container-fluid">
      <div class="card-body">
        {{ loadingText }}
      </div>
    </div>
    <div v-show="searchBlock" class="card-body">
      <div>
        <div v-show="searchData.maxPageNbr > 1" id="currentPage">
          Page {{ searchData.pageNbr }} of {{ searchData.maxPageNbr }}
        </div>
        <button @click.prevent="postSearch(false)" type="button" :class="{ disabled: disableNext }"
          class="btn btn-primary">Next
          Page</button>
        - <button @click.prevent="postIgnoredArticles" type="button" class="btn btn-primary"
          :class="{ disabled: disableSaveIgnored }">Save {{ searchCounts.nbrToIgnore }} Ignored Articles</button>
        - <button @click.prevent="postUnignoreArticles" type="button" class="btn btn-primary"
          :class="{ disabled: disableSaveUnignore }">Save {{ searchCounts.nbrToUnignore }} Unignore Articles</button>
        <br>
        <div class="form-check-inline">
          <input type="checkbox" class="form-check-input" id="toggleNewSwitch" v-model="toggleNew" ref="refNewSwitch">
          <label class="form-check-label" for="toggleNewSwitch">Show New Articles</label>
        </div>
        <div class="form-check-inline">
          <input type="checkbox" class="form-check-input" id="toggleKnownSwitch" v-model="toggleKnown">
          <label class="form-check-label" for="toggleKnownSwitch">Show Known Articles</label>
        </div>
        <div class="form-check-inline">
          <input type="checkbox" class="form-check-input" id="toggleRelevantSwitch" v-model="toggleRelevant">
          <label class="form-check-label" for="toggleRelevantSwitch">Show Less Relevant</label>
        </div>
        <div class="form-check-inline">
          <input type="checkbox" class="form-check-input" id="toggleIgnoredSwitch" v-model="toggleIgnored">
          <label class="form-check-label" for="toggleIgnoredSwitch">Show Ignored Articles</label>
        </div>
        <div class="form-check-inline">
          <input type="checkbox" class="form-check-input" id="toggleHiddenSwitch" v-model="toggleHidden">
          <label class="form-check-label" for="toggleHiddenSwitch">Show Hidden Articles</label>
        </div>
        <div id="returnedStates">
          <span v-for="state in searchData.searchCountState">
            <span v-if="state.nbrFound > 0" v-text="state.label + ' (' + state.nbrFound + ')'"></span>
          </span>
        </div>
        <div id="returnedDecade">
          <span v-for="(decade, index) in searchData.searchCountDecade">
            <span>{{ foundCount('D', decade, searchData.searchCountDecade.length - index - 1) }}</span>
          </span>
        </div>
        <div id="returnedYears" v-show="showReturnedYears">
          <span v-for="(year, index) in searchData.searchCountYear">
            <span>{{ foundCount('Y', year, searchData.searchCountYear.length - index - 1) }}</span>
          </span>
        </div>
        <div id="searchResultsCounts">
          Articles Found <b>{{ searchData.total }}</b> - New <b>{{ searchCounts.nbrNew }}</b>
          - Known <b>{{ searchCounts.nbrKnown }}</b> - Less Relevant <b>{{ searchCounts.nbrLessRelevant }}</b> - To
          Ignore <b>{{ searchCounts.nbrToIgnore }}</b>
          - Ignored <b>{{ searchCounts.nbrIgnored }}</b> - To Unignore <b>{{ searchCounts.nbrToUnignore }}</b> - Hidden
          <b>{{ searchCounts.nbrHidden }}</b>
        </div>
      </div>
      <div class="card-body pre-scrollable" style="max-height: 65vh; line-height: 100%">
        <table id="tableResults" class="table table-bordered">
          <thead class="mbhead">
            <tr class="mbrow">
              <th>Row</th>
              <th>Date</th>
              <th>Article ID</th>
              <th>Action</th>
              <th>Known</th>
              <th>Relevant</th>
              <th>Link</th>
              <th>Newspaper</th>
              <th>Heading / Snippet</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, index) in searchData.searchResults">
              <tr v-show="showResultRow(row.status)">
                <!-- Row -->
                {{ index + 1 }}
                <!-- Date -->
                <td :style="identifyDuplicate(index)">
                  {{ row.date }}
                </td>
                <!-- Article Id -->
                <td v-if="row.viewedIndex > -1">
                  <ArticleUrls :key="value.articleListArray.map(a => a.idxViewedArticle).join(',')" :inline="false"
                    :articleListArray="[{ idxViewedArticle: row.viewedIndex, troveListId: row.dbListId, troveArticleId: row.id }]">
                    ></ArticleUrls>
                </td>
                <td v-else-if="row.dbListId != 0">
                  {{ row.id }}
                  <!-- <router-link v-if="haveListLink(row.dbListId)" :to="'/userListPage/' + row.dbListId"
                    class="active link-primary">{{ row.listName }}</router-link> -->
                  <a href="#" v-if="haveListLink(row.dbListId)" @click.prevent="openList(row.dbListId)">
                    {{ row.listName }}
                  </a>
                  <p v-else>
                    {{ row.listName }}
                  </p>
                </td>
                <td v-else>
                  {{ row.id }}
                </td>
                <!-- Action -->
                <td>
                  <EditItem v-if="showIgnoreAction(row.status)" @click-item="ignoreArticleClick(index)"
                    :action="ignoreAction" :icon="ignoreIcon" />
                  {{ showIgnoreActionFiller }}
                  <EditItem v-if="showHideAction(row.status)" @click-item="hideRowClick(index)" :action="hideAction"
                    :icon="hideIcon" />
                </td>
                <!-- Known -->
                <td>
                  {{ showStatus(row.status) }}
                </td>
                <!-- Relevent -->
                <td v-if="row.relevance === 'very relevant'">
                  Yes
                </td>
                <td v-else>
                  No
                </td>
                <!-- Link -->
                <td>
                  <a :href="row.troveUrl" target="_blank">Trove</a>
                </td>
                <!-- Newspaper -->
                <td>
                  {{ row.title.title }}
                </td>
                <!-- Heading / Snippet -->
                <td>
                  {{ row.heading }}</br>{{ row.snippet }}</br>{{ row.textSnip }}</br>{{ row.articleMatch }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style></style>
