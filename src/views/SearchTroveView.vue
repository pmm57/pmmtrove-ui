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
const { a, i, u, t, h, s} = useMagicKeys()
const activeElement = useActiveElement()
const notTyping = computed(() =>
    !['INPUT', 'TEXTAREA'].includes(activeElement.value?.tagName)
)
const firstVisibleRow = computed(() => visibleRows.value[0] ?? null);
// Ignore and Unigore
whenever(
    logicAnd(logicOr(i,u), notTyping),
    () => {
        if (firstVisibleRow.value) {
            ignoreArticleClick(true, firstVisibleRow.value.idxSearch)
        }
    }
)
// Hide and Show
whenever(
    logicAnd(logicOr(h,s), notTyping),
    () => {
        if (firstVisibleRow.value) {
            hideRowClick(true, firstVisibleRow.value.idxSearch)
        }
    }
)
// Added to list
whenever(
    logicAnd(a, notTyping),
    () => {
        if (firstVisibleRow.value) {
            addedListClick(firstVisibleRow.value.idxSearch)
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
const loading = ref(false);
const loadingText = ref("");
const showSearchToggle = ref(true);
const searchBlock = ref(false);
const searchFor = ref("");
const searchPhrase = ref(false);
const limitStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const allStates = ref(true);
const limitState = ref("");
const allYears = ref(true);
const limitDecades = ["1800-1809", "1810-1819", "1820-1829", "1830-1839", "1840-1849", "1850-1859", "1860-1869", "1870-1879", "1880-1889", "1890-1899", "1900-1909", "1900-1909", "1920-1929", "1930-1939", "1940-1949", "1950-1959", "1960-1969", "1970-1979"];
const showLimitToDecade = ref(false);
const limitDecade = ref("");
const showLimitToYear = ref(false);
const allDecadeYears = ref(false);
const showLimitYear = ref(false);
const limitYears = ref([]);
const limitYear = ref("");
const lastActionIdx = ref(-1)
const lastActionSaved = ref("")
const ignoreAction = ref('');
const ignoreIcon = ref('');
const showReturnedStates = ref(false);
const showReturnedDecades = ref(false);
const showReturnedYears = ref(false);
const disableSearch = ref(true);
const disablePrev = ref(false);
const disableNext = ref(false);
const disableUpdateIgnored = ref(true);
const diasbledButtonText = ref('')
const toggleNew = ref(true);
const toggleKnown = ref(false);
const toggleRelevant = ref(false);
const toggleIgnored = ref(false);
const toggleHidden = ref(false);
let currentSearchId = 0;
const searchPageSize = 25;
let searchAllCounts = reactive({
    nbrFound : 0,
    nbrNew: 0,
    nbrKnown: 0,
    nbrLessRelevant: 0,
    nbrIgnored: 0});
let searchMaxPageNbr = 0;
let thisSearch = {searchId: 0,
    searchString: '',
    searchAllStates: true,
    searchLimitState: '',
    searchAllYears: true,
    searchLimitDecade: '',
    searchLimitYear: ''};
const thisSearchText = ref('')
const visiblePageNbr = ref(0);
const searchPageCounts = reactive({
    nbrShown: 0,
    nbrNew: 0,
    nbrKnown: 0,
    nbrLessRelevant: 0,
    nbrToIgnore: 0,
    nbrIgnored: 0,
    nbrToUnignore: 0
});
const searchResults = ref([])
const searchCountState = ref([])
const searchCountDecade = ref([])
const searchCountYear = ref([])
let searchNextUrl = 'done'
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
    .filter(item => showResultRow(item.hidden, item.status));
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
    countSearchResults();
    disableUpdateIgnored.value = true;
    lastActionSaved.value = "";
}
//
function onSearchToggle(event) {
  showSearchToggle.value = event.target.open
  searchBlock.value = false
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
//
function saveAction (action, idxSearch) {
    lastActionIdx.value = idxSearch
    lastActionSaved.value = action 
}
function undoLastAction () {
    if (lastActionSaved.value == "Undo Last Ignore") ignoreArticleClick(false, lastActionIdx.value)
    if (lastActionSaved.value == "Undo Last Hide") hideRowClick(false, lastActionIdx.value)
    lastActionSaved.value = ""
}
// On clicking the hide row
function hideRowClick(doing, idxSearch) {
    // console.log (`hideRowClick doing:%s, idx:%s`, doing, idxSearch);
    if (doing) {
        saveAction ("Undo Last Hide", idxSearch);
        searchResults.value[idxSearch].hidden = true
    } else {
        searchResults.value[idxSearch].hidden = false
    }
}
//
function addedListClick(idxSearch) {
    // console.log (`addedListClick doing:%s, idx:%s`, doing, idxSearch);
    switch (searchResults.value[idxSearch].status) {
        case 'New':
            --searchPageCounts.nbrNew;
            break;
        default:
            --searchPageCounts.nbrLessRelevant;
    }
    ++searchPageCounts.nbrKnown;
    searchResults.value[idxSearch].status = 'Known';
}
// On clicking the ignore row
// New => IgnoreArticle => Remove from TO Ignore
//                      => OR Save => Ignored
// Ignored => UnignoreArticle
//
function ignoreArticleClick(doing, idxSearch) {
    // console.log (`ignoreArticleClick doing:%s, idx:%s`, doing, idxSearch);
    if (doing) saveAction ("Undo Last Ignore", idxSearch)
    switch (searchResults.value[idxSearch].status) { // Current Status
        case 'Ignored': // Is in DB IgnoredArticles List - Unignore It
            searchResults.value[idxSearch].status = 'UnignoreArticle';
            ++searchPageCounts.nbrToUnignore;
            ignoreAction.value = "UnIgnore";
            ignoreIcon.value = "bi bi-file-earmark-arrow-up";
            break;
        case 'UnignoreArticle': // Is in DB IgnoredArticles List Was to be Unignored - changed mind
            searchResults.value[idxSearch].status = 'Ignored';
            --searchPageCounts.nbrToUnignore;
            ignoreAction.value = "UnIgnore";
            ignoreIcon.value = "bi bi-file-earmark-arrow-up";
            break;
        case 'IgnoreArticle': // Was set to be Ignored - changed mind
            searchResults.value[idxSearch].status = 'New';
            ignoreAction.value = "Add to Ignore List";
            ignoreIcon.value = "bi bi-file-earmark-arrow-down";
            --searchPageCounts.nbrToIgnore;
            break;
        default: // Was new - Now To be Ignored
            ignoreAction.value = "Remove from TO Ignore List";
            ignoreIcon.value = "bi bi-file-earmark-arrow-up";
            searchResults.value[idxSearch].status = 'IgnoreArticle';
            ++searchPageCounts.nbrToIgnore;
    }
    if ((searchPageCounts.nbrToIgnore > 0) || (searchPageCounts.nbrToUnignore > 0)) {
        diasbledButtonText.value = "Save "
        if (searchPageCounts.nbrToIgnore > 0) diasbledButtonText.value += searchPageCounts.nbrToIgnore + " Ignored "
        if (searchPageCounts.nbrToUnignore > 0) diasbledButtonText.value += searchPageCounts.nbrToUnignore + " Unignore"
        diasbledButtonText.value += " Articles"
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
    searchAllCounts.nbrNew = 0;
    searchAllCounts.nbrKnown = 0;
    searchAllCounts.nbrIgnored = 0;
    searchAllCounts.nbrLessRelevant = 0;
    searchPageCounts.nbrShown = 0;
    searchPageCounts.nbrNew = 0;
    searchPageCounts.nbrKnown = 0;
    searchPageCounts.nbrIgnored = 0;
    searchPageCounts.nbrToIgnore = 0;
    searchPageCounts.nbrToUnignore = 0;
    searchPageCounts.nbrLessRelevant = 0;
    const start = (visiblePageNbr.value -1) * searchPageSize;
    const end = start + searchPageSize;
    searchResults.value.forEach((element, index) => {
        var onPage = index >= start && index < end;
        if (onPage) ++searchPageCounts.nbrShown;
        //
        switch (element.status) {
            case 'Known':
            case 'KnownStored':
                if (onPage) ++searchPageCounts.nbrKnown;
                ++searchAllCounts.nbrKnown;
                break;
            case 'Ignored':
            case 'IgnoreArticle':
                if (onPage) ++searchPageCounts.nbrIgnored;
                ++searchAllCounts.nbrIgnored;
                break;
            case 'LowRelevance':
                if (onPage) ++searchPageCounts.nbrLessRelevant;
                ++searchAllCounts.nbrLessRelevant;
                break;
            default:
                // Setup for Show New
                if (onPage) ++searchPageCounts.nbrNew;
                ++searchAllCounts.nbrNew;
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
    if (searchCountState.value.length > 1) {
        showReturnedStates.value = true;
    } else {
        showReturnedStates.value = false;
    }
    if (searchCountDecade.value.length > 1) {
        showReturnedDecades.value = true;
    } else {
        showReturnedDecades.value = false;
    }
    // If there is a search result with a decade limit
    // then there should be Year Counts
    if (searchCountYear.value.length > 1) {
        showReturnedYears.value = true;
    } else {
        showReturnedYears.value = false;
    }
    //
    loading.value = false;
}
//
function showResultRow(hidden, status) {
    if (hidden) return true
    // console.log ('showResult:', JSON.stringify(status))
    switch (status) {
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
        default:
            return "No";
    }
}
//
function getIgnoreUI(index, status) {
  // return null when the ignore action should not be shown
  switch (status) {
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
function getHideUI(index, hidden) {
    if (hidden) {
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
function getAddListUI(index, status) {
    if ((index === 0) && ((status === 'New') || (status === 'LowRelevance'))) {
        return {
            filler: ' - ',
            action: '<u>A</u>dded To List',
            icon: 'bi bi-building-add',
        };
    }
    // return null when the Add to List action should not be shown
    return null;
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
    if (searchResults.value[index].articleMatch < 50) return "Wheat"// Article within 6 days of previous and close match
    return "transparent";
}
//
function waitSearch(started) {
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
            const results = returnData.searchResults.map(item => ({...item, hidden: false}));
            if (started){
                searchAllCounts.nbrFound = returnData.searchTotalFound;
                searchMaxPageNbr = Math.ceil(searchAllCounts.nbrFound / searchPageSize);
                searchResults.value = [...results];
                started = false;
                chgVisiblePage(1)
            } else {
                searchResults.value.push(...results);
            }
            // const shortSearchResults = searchResults.value.map(({ id, status, articleMatch }) => ({id,status,articleMatch}));
            // console.log('SearchTroveView/waitSearch Return Result = ', JSON.stringify(shortSearchResults));
            //
            searchNextUrl = returnData.searchNextUrl
            if ((returnData.searchNbrPages == 0) || (searchNextUrl == 'done')){
                source.close();
            }
            console.log(`SearchTroveView/waitSearch searchNextUrl:`, searchNextUrl);
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
    //
    thisSearch = getSearch();
    thisSearchText.value = ` String:${thisSearch.searchString}`
    if (!thisSearch.searchAllStates) thisSearchText.value += `, Limited to State:${thisSearch.searchLimitState}`
    if (!thisSearch.searchAllYears) thisSearchText.value += `, Limited to Decade:${thisSearch.searchLimitDecade}`
    if (thisSearch.searchLimitYear != '') thisSearchText.value += `, Limited to Year:${thisSearch.searchLimitYear}`
    currentSearchId = thisSearch.searchId
    //
    disableSearch.value = true;
    disablePrev.value = true;
    disableNext.value = true;
    disableUpdateIgnored.value = true;
    showSearchToggle.value = false;
    loading.value = true;
    loadingText.value = "Loading Search Results ";
    //
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
    waitSearch(true);
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
    countSearchResults();
    console.log (`SearchTroveView/chgVisiblePage by:%s now:%s`, by, visiblePageNbr.value)
        // Check if Next Page + 1 needs to be read
    if ((by == 1) && (searchNextUrl != 'done') && (((visiblePageNbr.value + 1) * searchPageSize) > searchResults.value.length)) {
        const nextPage = {
            searchId: currentSearchId,
            searchNextUrl: searchNextUrl
        }
        console.log(`chgVisiblePage Post this Search:%s`, JSON.stringify(nextPage));
        const options = {
            method: "post",
            mode: "cors",
            credentials: "include", // to send HTTP only cookies
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            //make sure to serialize your JSON body
            body: JSON.stringify(nextPage)
        };
        // console.log(options);
        useDoFetch('Search', "/searchTrove/nextPage", options)
        waitSearch(false);
    }
}
//
function openList(listLink) {
    console.log('SearchTroveView/openList ', listLink)
    navStore.listId = listLink;
    router.push({ name: 'userListPage' });
}
// Initialisation
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
    <div v-if="!showSearchToggle" class="card">
        <div v-if="loading" class="container-fluid">
            <div class="card-body">
                {{ loadingText }}
            </div>
        </div>
        <div v-else class="card-body">
            <div>
                <div>
                    Searched for {{ thisSearchText }} 
                </div> 
                <div>
                    Articles Found: <b>{{ searchAllCounts.nbrFound }}</b> Loaded <b>{{searchResults.length}}</b> Articles Reviewed - New <b>{{ searchAllCounts.nbrNew }}</b>
                    - Known <b>{{ searchAllCounts.nbrKnown }}</b> - Less Relevant <b>{{ searchAllCounts.nbrLessRelevant }}</b>
                    - Ignored <b>{{ searchAllCounts.nbrIgnored }}</b>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div v-show="searchMaxPageNbr > 1" id="currentPage">
                        Page {{ visiblePageNbr }} of {{ searchMaxPageNbr }}
                        <button @click.prevent="chgVisiblePage(-1)" type="button" :class="{ disabled: disablePrev }"
                            class="btn btn-primary ms-2">Prev Page
                        </button>
                        <button @click.prevent="chgVisiblePage(1)" type="button" :class="{ disabled: disableNext }"
                            class="btn btn-primary ms-2">Next Page
                        </button>
                    </div>
                    <div id="actionButtons">
                        <button @click.prevent="updateIgnoredArticles()" type="button" class="btn btn-primary ms-2"
                            :class="{ disabled: disableUpdateIgnored }"> {{ diasbledButtonText }}
                        </button>
                        <button v-if="lastActionSaved.length > 0" @click.prevent="undoLastAction" type="button" class="btn btn-primary ms-2"> {{ lastActionSaved }} 
                        </button>                
                    </div>
                </div>
                <div id="searchResultsCounts">
                    Page {{ visiblePageNbr }} Showing {{searchPageCounts.nbrShown}} Article Status Counts - New <b>{{ searchPageCounts.nbrNew }}</b>
                    - Known <b>{{ searchPageCounts.nbrKnown }}</b> - Less Relevant <b>{{ searchPageCounts.nbrLessRelevant }}</b>
                    - Ignored <b>{{ searchPageCounts.nbrIgnored }}</b> 
                    - To Ignore <b>{{ searchPageCounts.nbrToIgnore }}</b>- To Unignore <b>{{ searchPageCounts.nbrToUnignore }}</b>
                </div>
                <div class="form-check-inline">
                    <input type="checkbox" class="form-check-input" id="toggleNewSwitch" v-model="toggleNew" @click="$event.target.blur()">
                    <label class="form-check-label" for="toggleNewSwitch">Show New Articles</label>
                </div>
                <div class="form-check-inline">
                    <input type="checkbox" class="form-check-input" id="toggleKnownSwitch" v-model="toggleKnown" @click="$event.target.blur()">
                    <label class="form-check-label" for="toggleKnownSwitch">Show Known Articles</label>
                </div>
                <div class="form-check-inline">
                    <input type="checkbox" class="form-check-input" id="toggleRelevantSwitch" v-model="toggleRelevant" @click="$event.target.blur()">
                    <label class="form-check-label" for="toggleRelevantSwitch">Show Less Relevant</label>
                </div>
                <div class="form-check-inline">
                    <input type="checkbox" class="form-check-input" id="toggleIgnoredSwitch" v-model="toggleIgnored" @click="$event.target.blur()">
                    <label class="form-check-label" for="toggleIgnoredSwitch">Show Ignored Articles</label>
                </div>
                <div class="form-check-inline">
                    <input type="checkbox" class="form-check-input" id="toggleHiddenSwitch" v-model="toggleHidden" @click="$event.target.blur()">
                    <label class="form-check-label" for="toggleHiddenSwitch">Show Hidden Articles</label>
                </div>
                <div id="returnedStates" v-show="showReturnedStates">
                    <span v-for="state in searchCountState" :key="state">
                        <span v-if="state.nbrFound > 0" v-text="state.label + ' (' + state.nbrFound + ')'"></span>
                    </span>
                </div>
                <div id="returnedDecade" v-show="showReturnedDecades">
                    <span v-for="(decade, index) in searchCountDecade" :key="index">
                        <span>{{ foundCount('D', decade, searchCountDecade.length - index - 1) }}</span>
                    </span>
                </div>
                <div id="returnedYears" v-show="showReturnedYears">
                    <span v-for="(year, index) in searchCountYear" :key="index">
                        <span>{{ foundCount('Y', year, searchCountYear.length - index - 1) }}</span>
                    </span>
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
                                <template v-if="index == 0">
                                    <template v-if="getIgnoreUI(index, row.status)">
                                        <EditItem
                                        @click-item="ignoreArticleClick(true , row.idxSearch)"
                                        :action="getIgnoreUI(index, row.status).action"
                                        :icon="getIgnoreUI(index, row.status).icon"
                                        />
                                        {{ getIgnoreUI(index, row.status).filler }}
                                    </template>
                                    <template v-if="getAddListUI(index, row.status)">
                                        <EditItem
                                            @click-item="addedListClick(row.idxSearch)"
                                            :action="getAddListUI(index, row.status).action"
                                            :icon="getAddListUI(index, row.status).icon"
                                        />
                                        {{ getAddListUI(index, row.status).filler }}
                                    </template>
                                    <EditItem
                                        @click-item="hideRowClick(true, row.idxSearch)"
                                        :action="getHideUI(index, row.status).action"
                                        :icon="getHideUI(index, row.status).icon"
                                    />
                                </template>
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
