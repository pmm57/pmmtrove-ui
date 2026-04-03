<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import ArticleUrls from '@/components/ArticleUrls.vue'
import EditItem from '@/components/EditItem.vue'
import { useDoFetch } from '@/components/DoFetch.js';
import { unstringifyName } from '@/components/UnstringifyName.js';
import { useUserDataStore } from '@/stores/userdata';
import { useRouter } from 'vue-router';
const router = useRouter();
import { useNavBarStore } from '@/stores/navbar';
const navStore = useNavBarStore();
const userData = useUserDataStore();
//
import { useMagicKeys, whenever, useActiveElement } from '@vueuse/core'
import { logicAnd, logicOr } from '@vueuse/math'
const { i, u, t, h, s} = useMagicKeys()
const activeElement = useActiveElement()
const notTyping = computed(() =>
    !['INPUT', 'TEXTAREA'].includes(activeElement.value?.tagName)
)
const firstVisibleRow = computed(() => visibleRows.value[0] ?? null);
whenever(
    logicAnd(logicOr(i,u), notTyping),
    () => {
        if (firstVisibleRow.value) {
            ignoreArticleClick(firstVisibleRow.value.idxSearch)
        }
    }
)
whenever(
    logicAnd(logicOr(h,s), notTyping),
    () => {
        if (firstVisibleRow.value) {
            hideRowClick(firstVisibleRow.value.idxSearch)
        }
    }
)
// T → open first row Trove link
whenever(
  logicAnd(t, notTyping),
  () => {
    const row = firstVisibleRow.value
    if (row) window.open(row.troveUrl, '_blank')
  }
)
//
let loading = ref(false);
let loadingText = ref("");
let showSearchToggle = ref(true);
let searchBlock = ref(false);
// let searchTypePerson = false;
let searchFor = ref("");
let searchPhrase = ref(false);
const limitStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
let allStates = ref(true);
let limitState = ref("");
let allYears = ref(true);
const limitDecades = ["1800-1809", "1810-1819", "1820-1829", "1830-1839", "1840-1849", "1850-1859", "1860-1869", "1870-1879", "1880-1889", "1890-1899", "1900-1909", "1900-1909", "1920-1929", "1930-1939", "1940-1949", "1950-1959", "1960-1969", "1970-1979"];
let showLimitToDecade = ref(false);
let limitDecade = ref("");
let showLimitToYear = ref(false);
let allDecadeYears = ref(false);
let showLimitYear = ref(false);
let limitYears = ref([]);
let limitYear = ref("");
let ignoreAction = ref('');
let ignoreIcon = ref('');
let showReturnedYears = ref(false);
let disableSearch = ref(true);
let disablePrev = ref(false);
let disableNext = ref(false);
let disableUpdateIgnored = ref(true);
let toggleNew = ref(true);
let refNewSwitch = ref(null);
let toggleKnown = ref(false);
let toggleRelevant = ref(false);
let toggleIgnored = ref(false);
let toggleHidden = ref(false);
let currentSearchId = 0;
let searchPageSize = 50;
let searchTotal = 0;
let searchMaxPageNbr = 0;
let visiblePageNbr = ref(0);
let searchCounts = reactive({
    nbrNew: 0,
    nbrKnown: 0,
    nbrLessRelevant: 0,
    nbrToIgnore: 0,
    nbrIgnored: 0,
    nbrToUnignore: 0,
    nbrHidden: 0
});
let thisSearch = reactive({})
// {searchId: 0,
// searchString: ''
// searchAllStates: true,
// searchLimitState: '',
// searchAllYears: true,
// searchLimitDecade: '',
// searchLimitYear: ''};
let searchResults = ref([])
let searchCountState = ref([])
let searchCountDecade = ref([])
let searchCountYear = ref([])
//
const visibleRows = computed(() => {
  const startIndex = (visiblePageNbr.value - 1) * searchPageSize;
  const endIndex = startIndex + searchPageSize;
  return searchResults.value
    .slice(startIndex, endIndex)
    .map((row, index) => {
      const globalIndex = startIndex + index;
      return {
        ...row,
        idxSearch: globalIndex,
        dateBackground: {
          backgroundColor: identifyDuplicate(globalIndex),
        },
      };
    })
    .filter(item => showResultRow(item.status));
});
//  Post array of Ignored Article Id's
function updateIgnoredArticles() {
    var items = [];
    var action = ''
    searchResults.value.forEach((el, index) => {
        if (el.status == 'IgnoreArticle') {
            // console.log ('Ignore Article ', el)
            searchResults.value[index].status = 'Ignored';
            action = 'add'
        }
        if (el.status == 'UnignoreArticle') {
            // console.log ('Ignore Article ', el)
            searchResults.value[index].status = 'New';
            action = 'remove'
        }
        if (action.length > 0) {
            items.push({ id: el.id, action: action });
            action = ''
        }
    });
    console.log("clicked Save Ignored action " + JSON.stringify(items));
    const ignored = {
        ignoreArticlesInfo: items,
        reloadArticle: false
    };
    //
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
    useDoFetch('Ignore Articles', "/searchTrove/updateIgnored", options)
    refNewSwitch.value.focus();
    searchCounts.nbrIgnored = searchCounts.nbrIgnored + searchCounts.nbrToIgnore - searchCounts.nbrToUnignore;
    searchCounts.nbrToIgnore = 0;
    searchCounts.nbrToUnignore = 0;
    disableUpdateIgnored.value = true;
}
//
function checkSearchPhrase() {
    console.log('checkSearchPhrase', searchPhrase.value);
    var isPhrase = false;
    if (searchFor.value.includes(' ')) {
        console.log('isPhrase');
        isPhrase = true;
    }
    if (searchPhrase.value) {
        if (!(isPhrase)) {
            // need at least two words
            var words = searchFor.value.split(' ');
            if (words.length < 2) {
                alert('Need two or more words for Phase Search');
            } else {
                searchFor.value = '"' + searchFor.value + '"';
            }
        }
    } else {
        //remove "
        if (isPhrase) {
            var str = searchFor.value.replaceAll('"','');
            // console.log (str);
            searchFor.value = str;
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
function checkIfAllYears() {
    console.log ("Check All Year:", allYears.value)
    if (allYears.value) {
        limitDecade.value = "";
        showLimitToDecade.value = false;
        showLimitToYear.value = false;
        allDecadeYears.value = false;
        showLimitYear.value = false;
        changeSearch()
        return
    } 
    showLimitToDecade.value = true;
    showLimitToYear.value = true;
    allDecadeYears.value = true;
    limitDecade.value = "187";
     checkLimitDecade ()
     return
}
//
function checkLimitDecade () {
    // Populate with years of decade
    console.log ("checkLimitDecade ", limitDecade.value)
    limitYears.value = Array.from(
        { length: 10 },
        (_, i) => Number(`${limitDecade.value}${i}`)
    )
    limitYear.value = limitYears.value[0]
    console.log ("limitYears ", limitYears.value)
    changeSearch()
}
// On clicking the hide row
function hideRowClick(idxSearch) {
    // console.log ('hideRowClick ', articleId);
    switch (searchResults.value[idxSearch].status) {
        case 'HideArticle':
            searchResults.value[idxSearch].status = 'New';
            --searchCounts.nbrHidden;
            break;
        default:
            searchResults.value[idxSearch].status = 'HideArticle';
            ++searchCounts.nbrHidden;
    }
}
//
function onSearchToggle(event) {
  showSearchToggle.value = event.target.open
  searchBlock.value = false
}
// On clicking the ignore row
// New => IgnoreArticle => Remove from TO Ignore
//                      => OR Save => Ignored
// Ignored => UnignoreArticle
//
function ignoreArticleClick(idxSearch) {
    // console.log ('ignoreArticleClick ', articleId);
    switch (searchResults.value[idxSearch].status) { // Current Status
        case 'Ignored': // Is in DB IgnoredArticles List - Unignore It
            searchResults.value[idxSearch].status = 'UnignoreArticle';
            ++searchCounts.nbrToUnignore;
            ignoreAction.value = "UnIgnore";
            ignoreIcon.value = "bi bi-file-earmark-arrow-up";
            break;
        case 'UnignoreArticle': // Is in DB IgnoredArticles List Was to be Uninored - changed mind
            searchResults.value[idxSearch].status = 'Ignored';
            --searchCounts.nbrToUnignore;
            ignoreAction.value = "UnIgnore";
            ignoreIcon.value = "bi bi-file-earmark-arrow-up";
            break;
        case 'IgnoreArticle': // Was set to be Ignored - changed mind
            searchResults.value[idxSearch].status = 'New';
            ignoreAction.value = "Add to Ignore List";
            ignoreIcon.value = "bi bi-file-earmark-arrow-down";
            --searchCounts.nbrToIgnore;
            break;
        default: // Was new - Now To be Ignored
            ignoreAction.value = "Remove from TO Ignore List";
            ignoreIcon.value = "bi bi-file-earmark-arrow-up";
            searchResults.value[idxSearch].status = 'IgnoreArticle';
            ++searchCounts.nbrToIgnore;
    }
    if ((searchCounts.nbrToIgnore > 0) || (searchCounts.nbrToUnignore > 0)) {
        disableUpdateIgnored.value = false;
    }
    // console.log ('ignoreArticleClick Done');
}
//
function getSearch() {
    visiblePageNbr.value = 0
    searchMaxPageNbr = 0
    var aSearch = {
        searchId: 0,
        searchString: searchFor.value,
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
    thisSearch = getSearch();
    // console.log (`Check Same Search %s %s`, thisSearch.searchId, currentSearchId);
    if (thisSearch.searchId != currentSearchId) {
        disableSearch.value = false;
    } else {
        disableSearch.value = true;
    }
}
//
function countSearchResults() {
    // Get counts
    searchCountState.value = [];
    searchCountDecade.value = [];
    searchCountYear.value = [];
    searchCounts.nbrNew = 0;
    searchCounts.nbrKnown = 0;
    searchCounts.nbrIgnored = 0;
    searchCounts.nbrToIgnore = 0;
    searchCounts.nbrToUnignore = 0;
    searchCounts.nbrLessRelevant = 0;
    searchCounts.nbrHidden = 0;
    searchResults.value.forEach(element => {
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
        var stateIndex = searchCountState.value.findIndex(item => item.label == element.state);
        if (stateIndex == -1) { // Sort Insert
            var newState = {
                label: element.state,
                nbrFound: 0
            };
            stateIndex = 0;
            var listLen = searchCountState.value.length;
            if (listLen > 0) {
                while (searchCountState.value[stateIndex].label < element.state) {
                    ++stateIndex;
                    if (stateIndex == listLen) {
                        break;
                    }
                }
                searchCountState.value.splice(stateIndex, 0, newState);
            } else {
                searchCountState.value.push(newState);
            }
        }
        ++searchCountState.value[stateIndex].nbrFound;
        //
        var resDecade = element.date.slice(0, 3);
        var decadeIndex = searchCountDecade.value.findIndex(item => item.label == resDecade);
        if (decadeIndex == -1) { // Sort Insert
            var newDecade = {
                label: resDecade,
                nbrFound: 0,
                arrayYear: []
            };
            decadeIndex = 0;
            var listLen = searchCountDecade.value.length;
            if (listLen > 0) {
                while (searchCountDecade.value[decadeIndex].label < resDecade) {
                    ++decadeIndex;
                    if (decadeIndex == listLen) {
                        break;
                    }
                }
                searchCountDecade.value.splice(decadeIndex, 0, newDecade);
            } else {
                searchCountDecade.value.push(newDecade);
            }
        }
        ++searchCountDecade.value[decadeIndex].nbrFound;
        //
        // Only Count Years if a Decade Limit has been done
        if (!(thisSearch.searchAllYears)) {
            var resYear = element.date.slice(0, 4);
            var yearIndex = searchCountYear.value.findIndex(item => item.label == resYear);
            if (yearIndex == -1) { // Sort Insert
                var newYear = {
                    label: resYear,
                    nbrFound: 0
                };
                yearIndex = 0;
                var listLen = searchCountYear.value.length;
                if (listLen > 0) {
                    while (searchCountYear.value[yearIndex].label < resYear) {
                        ++yearIndex;
                        if (yearIndex == listLen) {
                            break;
                        }
                    }
                    searchCountYear.value.splice(yearIndex, 0, newYear);
                } else {
                    searchCountYear.value.push(newYear);
                }
            }
            ++searchCountYear.value[yearIndex].nbrFound;
        }
    });
    //
    // If there is a search result with a decade limit
    // then there should be Year Counts
    if ((thisSearch.hasOwnProperty('searchCountYear'))
        && (searchCountYear.value.length > 0)) {
        showReturnedYears.value = true;
    } else {
        showReturnedYears.value = false;
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
function getIgnoreUI(index, status) {
  // return null when the ignore action should not be shown
  switch (status) {
    case 'HideArticle':
    case 'Known':
    case 'KnownStored':
      return null;
    case 'Ignored':
      return {
        filler: ' - ',
        action: index === 0 ? '<u>U</u>nIgnore' : 'UnIgnore',
        icon: 'bi bi-file-earmark-arrow-up',
      };
    case 'IgnoreArticle':
      return {
        filler: ' - ',
        action: index === 0 ? '<u>U</u>nlink from TO Ignore List' : 'Unlink from TO Ignore List',
        icon: 'bi bi-file-earmark-arrow-up',
      };
    case 'UnignoreArticle':
      // optional: if you want a UI state for this
      return {
        filler: ' - ',
        action: index === 0 ? '<u>U</u>nIgnore' : 'UnIgnore',
        icon: 'bi bi-file-earmark-arrow-up',
      };

    default:
      return {
        filler: ' - ',
        action: index === 0 ? '<u>I</u>nclude in <u>I</u>gnore List' : 'Include in Ignore List',
        icon: 'bi bi-file-earmark-arrow-down',
      };
  }
}
//
function getHideUI(index, status) {
  if (status === 'HideArticle') {
    return {
      action: index === 0 ? '<u>S</u>how Row' : 'Show Row',
      icon: 'bi bi-toggle-on',
    };
  }
  return {
    action: index === 0 ? '<u>H</u>ide Row' : 'Hide Row',
    icon: 'bi bi-toggle-off',
  };
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
    if (searchResults.value[index].articleMatch < 50) return "lightGreen"// Article within 6 days of previous and close match
    return "transparent";
}
//
function waitSearch() {
    var started = true;
    loading.value = true;
    searchBlock.value = false;
    loadingText.value = "Loading Search Results ";
    let intervalLoading = setInterval(function () {
        loadingText.value += '.';
    }, 500);
    if (!!window.EventSource) {
        var searchName = userData.troveDetails.troveUserId + ':searchNbr' + thisSearch.searchId;
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
            console.log(`SearchTroveView/waitSearch Return Started:%s NumberReturned:%s`, started, returnData.searchResults.length);
            if (started){
                searchTotal = returnData.total;
                searchMaxPageNbr = Math.ceil(searchTotal / searchPageSize);
                searchResults.value = [...returnData.searchResults];
                started = false;
                chgVisiblePage(1)
            } else {
                searchResults.value.push(...returnData.searchResults);
            }
            // const shortSearchResults = searchResults.value.map(({ id, status, articleMatch }) => ({id,status,articleMatch}));
            // console.log('SearchTroveView/waitSearch Return Result = ', JSON.stringify(shortSearchResults));
            //
            if (returnData.nextURL == 'done') {
                source.close();
            }
            countSearchResults();
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
function postSearch() {
    // searchField.blur();
    disableSearch.value = true;
    disablePrev.value = true;
    disableNext.value = true;
    disableUpdateIgnored.value = true;
    //
    thisSearch = getSearch();
    currentSearchId = thisSearch.searchId
    console.log('Post this Search', JSON.stringify(thisSearch));
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        //make sure to serialize your JSON body
        body: JSON.stringify(thisSearch)
    };
    // console.log(options);
    useDoFetch('Search', "/searchTrove/", options)
    waitSearch();
}
//
function chgVisiblePage(by) {
    visiblePageNbr.value = Math.min(
        searchMaxPageNbr,
        Math.max(1, visiblePageNbr.value + by)
    );
    disablePrev.value = false;
    if (visiblePageNbr.value == 1) {
        disablePrev.value = true;
    }
    disableNext.value = false;
    if (visiblePageNbr.value == searchMaxPageNbr) {
        disableNext.value = true;
    }
    console.log (`SearchTroveView/chgVisiblePage by:%s now:%s`, by, visiblePageNbr.value)
}
//
function openList(listLink) {
    console.log('SearchTroveView/openList ', listLink)
    navStore.listId = listLink;
    router.push({ name: 'userListPage' });
}
// Initialisation
thisSearch.searchId = 0;
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
    searchFor.value = '"' + searchStr + '"';
    searchPhrase.value = true
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
}
onMounted(() => {
  if (navStore.troveSearchName !== '') {
    postSearch();
  }
});
</script>
//
<template>
    <div class="card">
        <details :open="showSearchToggle" @toggle="onSearchToggle">
            <summary>Trove Search</summary>
            <div class="card-body">
                <!-- Search Input -->
                <div class="form-group">
                    <input type="text" class="form-control" v-model="searchFor" @keyup="changeSearchText()"
                        placeholder="Enter Search" autofocus>
                </div>
                <div>Restrict Search To</div>
                <div class="form-check form-check-inline">
                    <input type="checkbox" class="form-check-input" v-model="searchPhrase" @change="checkSearchPhrase"
                        id="checkboxSearchPhrase">
                    <label class="form-check-label" for="checkboxSearchPhrase">Search Proximate</label>
                </div>
                <div class="form-check form-check-inline">
                    <input type="checkbox" class="form-check-input" v-model="allStates" @change="checkIfLimitState"
                        id="checkboxAllStates">
                    <label class="form-check-label" for="checkboxAllStates">Include All States</label>
                </div>
                <div class="form-check form-check-inline">
                    <input type="checkbox" class="form-check-input" v-model="allYears" @change="checkIfAllYears"
                        id="checkboxAllYears">
                    <label class="form-check-label" for="checkboxAllYears">Include All Years</label>
                </div>
                <!--Radio group of States to Limit Search -->
                <div v-show="!allStates">
                    <div class="form-check form-check-inline" v-for="state in limitStates " :key="state" @change="changeSearch()">
                        <input class="form-check-input" type="radio" name=stateLimit :id="'radioState' + state"
                            :value="state" v-model="limitState">
                        <label class="form-check-label form-nowrap" :for="'radioState' + state">{{ state }}</label>
                    </div>
                </div>
                <div v-show="showLimitToDecade">
                    <!--Radio group of Decade to Limit Search -->
                    <div v-for="decade in limitDecades" :key="decade" class="form-check form-check-inline">
                        <input type="radio" class="form-check-input" name=decadeLimit :id="'radioDecade' + decade"
                            :value="decade.substring(0, 3)" v-model="limitDecade" @change="checkLimitDecade()">
                        <label class="form-check-label form-nowrap" :for="'radioDecade' + decade">{{ decade }}</label>
                    </div>
                </div>
                <div v-show="showLimitToYear">
                    <input type="checkbox" class="form-check-input  form-check-inline" v-model="allDecadeYears" @change="showLimitYear = !showLimitYear"
                        id="checkboxAllDecadeYears">
                    <label class="form-check-label" for="checkboxAllDecadeYears">Include All Decade Years&nbsp;</label>
                    <!--Radio group of Years to Limit Search -->
                    <div v-show="showLimitYear" v-for="year in limitYears" :key="year" @change="changeSearch()" class="form-check form-check-inline">
                        <input type="radio" class="form-check-input" name=yearLimit :id="'radioYear' + year"
                            :value="year" v-model="limitYear">
                        <label class="form-check-label form-nowrap" :for="'radioYear' + year">{{ year
                            }}</label>
                    </div>
                </div>
                <div class="form-group">
                    <input @click.prevent="postSearch()" :class="{ disabled: disableSearch }"
                        class="btn btn-primary" type="button" value="Search">
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
                <div v-show="searchMaxPageNbr > 1" id="currentPage">
                    Page {{ visiblePageNbr }} of {{ searchMaxPageNbr }}
                    <button @click.prevent="chgVisiblePage(-1)" type="button" :class="{ disabled: disablePrev }"
                        class="btn btn-primary">Prev Page
                    </button>
                    <button @click.prevent="chgVisiblePage(1)" type="button" :class="{ disabled: disableNext }"
                        class="btn btn-primary">Next Page
                    </button>
                    <button @click.prevent="updateIgnoredArticles" type="button" class="btn btn-primary"
                        :class="{ disabled: disableUpdateIgnored }">Save {{ searchCounts.nbrToIgnore +
                            searchCounts.nbrToUnignore }} Ignored/Unignore
                        Articles
                    </button>                
                </div>
                <div class="form-check-inline">
                    <input type="checkbox" class="form-check-input" id="toggleNewSwitch" v-model="toggleNew"
                        ref="refNewSwitch">
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
                    <span v-for="state in searchCountState" :key="state">
                        <span v-if="state.nbrFound > 0" v-text="state.label + ' (' + state.nbrFound + ')'"></span>
                    </span>
                </div>
                <div id="returnedDecade">
                    <span v-for="(decade, index) in searchCountDecade" :key="index">
                        <span>{{ foundCount('D', decade, searchCountDecade.length - index - 1) }}</span>
                    </span>
                </div>
                <div id="returnedYears" v-show="showReturnedYears">
                    <span v-for="(year, index) in searchCountYear" :key="index">
                        <span>{{ foundCount('Y', year, searchCountYear.length - index - 1) }}</span>
                    </span>
                </div>
                <div id="searchResultsCounts">
                    Articles Found <b>{{ searchTotal }}</b> - New <b>{{ searchCounts.nbrNew }}</b>
                    - Known <b>{{ searchCounts.nbrKnown }}</b> - Less Relevant <b>{{ searchCounts.nbrLessRelevant }}</b>
                    - To
                    Ignore <b>{{ searchCounts.nbrToIgnore }}</b>
                    - Ignored <b>{{ searchCounts.nbrIgnored }}</b> - To Unignore <b>{{ searchCounts.nbrToUnignore }}</b>
                    - Hidden
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
                            <th>Known</th>
                            <th>Relevant</th>
                            <th>Action</th>
                            <th>Link</th>
                            <th>Newspaper</th>
                            <th>Heading / Snippet</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in visibleRows" :key="row.id">
                            <!-- Row -->
                            {{ row.idxSearch + 1 }}
                            <!-- Date -->
                            <td :style="row.dateBackground">
                                {{ row.date }}
                            </td>
                            <!-- Article Id -->
                            <td v-if="row.viewedIndex > -1">
                                <ArticleUrls :key="row.viewedIndex" :inline="false"
                                    :articleListArray="[{ idxViewedArticle: row.viewedIndex, troveListId: row.dbListId, troveArticleId: row.id }]">
                                    ></ArticleUrls>
                            </td>
                            <td v-else-if="row.dbListId != 0">
                                {{ row.id }}
                                <!-- <router-link v-if="haveListLink(row.dbListId)" :to="'/userListPage/' + row.dbListId"
                class="active link-primary">{{ row.listName }}</router-link> -->
                                <a href="#" v-if="haveListLink(row.dbListId)"
                                    @click.prevent="openList(row.dbListId)">
                                    <br>{{ row.listName }}
                                </a>
                                <p v-else>
                                    {{ row.listName }}
                                </p>
                            </td>
                            <td v-else>
                                {{ row.id }}
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
                            <!-- Action -->
                             <td>
                                <template v-if="getIgnoreUI(index, row.status)">
                                    <EditItem
                                    @click-item="ignoreArticleClick(row.idxSearch)"
                                    :action="getIgnoreUI(index, row.status).action"
                                    :icon="getIgnoreUI(index, row.status).icon"
                                    />
                                    {{ getIgnoreUI(index, row.status).filler }}
                                </template>

                                <EditItem
                                    @click-item="hideRowClick(row.idxSearch)"
                                    :action="getHideUI(index, row.status).action"
                                    :icon="getHideUI(index, row.status).icon"
                                />
                            </td>
                            <!-- Link -->
                            <td>
                                <a :href="row.troveUrl" target="_blank">
                                    <template v-if="index === 0">
                                        <span class="hotkey">T</span>rove
                                    </template>
                                    <template v-else>
                                        Trove
                                    </template>
                                </a>
                            </td>
                            <!-- Newspaper -->
                            <td>
                                {{ row.title.title }}
                            </td>
                            <!-- Heading / Snippet -->
                            <td>
                                {{ row.heading }}<br>{{ row.snippet }}<br>{{ row.textSnip }}<br>{{
                                    row.articleMatch }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style>
.hotkey {
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 2px;
}
</style>
