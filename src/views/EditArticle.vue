<script setup>
import ModalEntities from '@/components/ModalEntities.vue'
import ModalDuplicates from '@/components/ModalDuplicates.vue'
import EditItem from '@/components/EditItem.vue'
import { ref, watch, nextTick } from 'vue'
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()

const props = defineProps(['listId', 'articleId'])
console.log(`Edit Article View List:%s , Article:%s`, props.listId, props.articleId)

navStore.articleId = props.articleId
navStore.articleHref = "/editArticle/" + props.listId + "/" + props.articleId
navStore.articleTabTitle = "Article " + props.articleId
//
var idxList = ref(0)
idxList.value = userData.userLists.findIndex((item) => item.TroveListId == props.listId);
var idxListArticle = ref(0)
idxListArticle.value = userData.userListArticles[idxList.value].findIndex((item) => item.TroveListArticleId == props.articleId);
var viewArticleText = ref('');
var searchTextWord = ref('')
// Has it been viewed previously
var idxViewed = ref(0)
idxViewed.value = userData.userListArticles[idxList.value][idxListArticle.value].TroveListArticleViewedIdx
console.log('Edit Article View  ', idxList.value, idxListArticle.value, idxViewed.value)
// console.log(`userData.viewedArticles:%s`, userData.viewedArticles)
var disableUpdate = ref(true)
var showModalEntities = ref(false)
var showModalDuplicates = ref(false)
var showTroveText = ref(true)
var showSelectedText = ref(true)
var showSummaryText = ref(false)
var editMetadata = ref(-1)
var notifyEditError = ref('inherit')
const popoverPersonMetadata = 'Enter as Familyname (nee Maidenname), GivenName InitialAs N. b.9999-d.9999'
const popoverDateMetadata = 'Enter as YYYY-MM-DD'
const markSearch = '<mark class="search">'
const markEnd = '</mark>'
const divSelect = '<div style="text-decoration: underline;">'
const divEnd = '</div>'
var popoverForMetadata = ref('')
var savedMetadata = []
var arrayMetadataDropdown = ref([])
//
function loadArticleText() {
    console.log('EditArticle loadArticleText ', userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText.length)
    if (userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText.length > 0) {
        viewArticleText.value = userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText;
        // console.log(`EditArticle loadArticleText Snips In %s`, userData.viewedArticles[idxViewed.value].ViewedArticleSnips)
        if (userData.viewedArticles[idxViewed.value].ViewedArticleSnips.length > 0) {
            // Mark Selected Text
            const snips = JSON.parse(userData.viewedArticles[idxViewed.value].ViewedArticleSnips);
            // console.log(`EditArticle loadArticleText Snips %s`, JSON.stringify(snips))
            for (let snip of snips) {
                if (snip.snips.length == 0) continue;
                let pos1 = sliceMatch(0, snip.snips, viewArticleText.value);
                // console.log(`EditArticle loadArticleText PreSnip Pos1 "%s"`, viewArticleText.value.slice(pos1, pos1 + 10))
                // let pos2 = sliceMatch(pos1, snip.snipe, viewArticleText.value) + snip.snipe.length + 1;
                let pos2 = sliceMatch(pos1 + snip.snipe.length, snip.snipe, viewArticleText.value);
                // console.log(`EditArticle loadArticleText PreSnip Pos2 "%s"`, viewArticleText.value.slice(pos2 - 10, pos2))
                // console.log(`EditArticle loadArticleText Snip Pos1 %s, Pos2 %s Text %s`, pos1, pos2, viewArticleText.value.length)
                if ((pos1 > -1) && (pos2 > pos1)) {
                    // console.log(`EditArticle loadArticleText Sniping Pos1 %s, Pos2 %s`, pos1, pos2)
                    const part1 = viewArticleText.value.slice(0, pos1)
                    const part2 = viewArticleText.value.slice(pos1, pos2)
                    const part3 = viewArticleText.value.slice(pos2)
                    viewArticleText.value = part1 + divSelect + part2
                        + divEnd + part3

                    // console.log(`EditArticle loadArticleText After Snips Start "%s"`, part2.slice(0, 50))
                    // console.log(`EditArticle loadArticleText After Snips End "%s"`, part3.slice(0, 50))
                    // console.log(`EditArticle loadArticleText Snip Marked`)
                }
            }
        }
        // Mark Search Word
        searchTextWord.value = userData.viewedArticles[idxViewed.value].ViewedArticleSearchWord
        // console.log('EditArticle loadArticleText Search', searchTextWord.value, viewArticleText.value.length)
        var re = new RegExp("(" + searchTextWord.value + ")", "gi");
        userData.viewedArticles[idxViewed.value].ViewedArticleFoundCount = (viewArticleText.value.match(re) || []).length;
        viewArticleText.value = viewArticleText.value.replace(re, function (matched) {
            // console.log("matched", matched)
            return markSearch + matched + markEnd
        })
        // console.log('EditArticle loadArticleText Search After', viewArticleText.value.length)
    }
}
//
function sliceMatch(start, match, text) {
    const chunkSize = match.length + 20;
    for (let i = start; i <= text.length; i++) {
        const sliceText = cleanText(text.slice(i, i + chunkSize));
        if (sliceText.startsWith(match)) {
            // If at start - encapsulate previous <p>
            // console.log('EditArticle loadArticleText sliceMatch found "%s" at %s in "%s"', match, i, sliceText)
            var pos = i
            if (start == 0) {
                // Don't go negative
                var st = (pos - 20)
                if (st < 0) st = 0;
                const ckst = text.slice(st, i);
                pos = i + slidePos(-1, '<p>', ckst.length - 1, ckst)
                // console.log('EditArticle loadArticleText sliceMatch slides %s at "%s"', pos, ckst)
            } else { // at end
                pos = pos + match.length
                // Don't go beyond end of text
                var en = pos + 20
                if (pos > text.length) pos = text.length;
                const cken = text.slice(pos, en)
                // console.log('EditArticle loadArticleText sliceMatch before slide %s at "%s"', pos, cken)
                const posSlide = slidePos(1, '</p>', 0, cken);
                if (posSlide > 0) {
                    pos = pos + posSlide + '</p>'.length
                }
                // console.log('EditArticle loadArticleText sliceMatch slides %s at "%s"', pos, cken)
            }
            return pos
        }
    }
    // console.log('EditArticle loadArticleText sliceMatch NOT found %s', match)
    return 0
}
//
function slidePos(slideBy, slideFor, checkPtr, chunk) {
    // console.log('EditArticle loadArticleText slidePos start slideBy %s, slideFor %s, checkPtr %s, chunk "%s", check "%s" ',
    //  slideBy, slideFor, checkPtr, chunk, chunk.slice(checkPtr, checkPtr + 1))
    var slide = slideBy
    while (chunk.slice(checkPtr, checkPtr + slideFor.length) != slideFor) {
        slide = slide + slideBy;
        checkPtr = checkPtr + slideBy
        // console.log('EditArticle loadArticleText slidePos chunk "%s", check "%s", slide %s ', chunk, chunk.slice(checkPtr, checkPtr + 2), slide)
        if ((checkPtr < 0) || (checkPtr > chunk.length - 1)) {
            // console.log('EditArticle loadArticleText slidePos not found %s', slideFor)
            return 0
        }
    }
    // console.log('EditArticle loadArticleText slidePos found %s at %s', slideFor, slide)
    return slide;
}
// Scroll to Search Word in Trove Article, identify by <mark>
function scrollSearchWord(event) {
    const searchFound = viewArticleText.value.indexOf(markSearch)
    // console.log(`EditArticle scrollSearchWord Searches %s`, searchFound)
    if (searchFound > 0) {
        const textLength = viewArticleText.value.length
        const scrollPercent = searchFound / textLength
        const scrollPixels = event.currentTarget.scrollHeight * scrollPercent;
        // console.log(pattern, searchFound, textLength, event.currentTarget.scrollHeight, scrollPixels);
        event.currentTarget.scrollTo({
            top: scrollPixels,
            left: 0,
            behavior: "smooth",
        });
    }
}
// Capture highlighted text in Trove Article
// Extract Snip Start and End
function getSelectedText() {
    const selection = window.getSelection()
    var selectedText = selection.toString()
    var snips = [];
    // console.log(`EditArticle getSelectedText In Snips %s`, userData.viewedArticles[idxViewed.value].ViewedArticleSnips)
    if (userData.viewedArticles[idxViewed.value].ViewedArticleSnips.length > 0) {
        snips = JSON.parse(userData.viewedArticles[idxViewed.value].ViewedArticleSnips)
    }
    const snip = {
        snips: getSnipText(selectedText, 5),
        snipe: getSnipText(selectedText, -5)
    };
    snips.push(snip);
    userData.viewedArticles[idxViewed.value].ViewedArticleSnips = JSON.stringify(snips)
    // console.log(`EditArticle getSelectedText Snips Out %s`, JSON.stringify(snips))
    loadArticleText()
    //
    selectedText = cleanText(selectedText);
    // console.log (selection, selectedText)
    if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
        userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText += '\n' + selectedText
    } else {
        userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = selectedText
    }
    disableUpdate.value = false
    if (userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText == "Created") {
        userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = "Copied Text"
    }
}
// Standardise the text
function cleanText(inText) {
    // Change word line break hypens to space
    inText = inText.replace(/-\n/g, " ");
    // Remove "- "
    inText = inText.replace(/- /g, "");
    // Change linebreak to space
    inText = inText.replace(/\n/g, " ");
    // remove double spaces
    inText = inText.replace(/  +/g, ' ');
    // Remove html
    return inText.replace(/<[^>]*>/g, "");
}
// Ensure snips are unique
function getSnipText(selText, len) {
    var fullText = cleanText(userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText);
    // console.log (`Article Text Front "%s" Back "%s"`, fullText.slice(0, 20), fullText.slice(-20))
    selText = cleanText(selText)
    // console.log (`Selected Text Front "%s" Back "%s"`, selText.slice(0, 20), selText.slice(-20))
    let done = false;
    var snipText = len < 0 ? selText.slice(len) : selText.slice(0, len);
    do {
        // console.log (`Len %s snipText "%s"`, len, snipText)
        let pos1 = fullText.indexOf(snipText);
        let pos2 = -1
        if ((pos1 + snipText.length - 1) < fullText.length) {
            pos2 = fullText.indexOf(snipText, pos1 + snipText.length - 1);
        }
        // console.log (`Match pos1 %s pos2 %s`, pos1, pos2)
        if (pos2 > 0) {
            console.log(`EditArticle getSnipText Found two "%s"`, snipText)
            len = len < 0 ? len - 1 : len + 1;
            snipText = len < 0 ? selText.slice(len) : selText.slice(0, len);
            continue
        }
        if (pos1 > 0) {
            // console.log (`Found one "%s"`, snipText)
        } else {
            console.log(`EditArticle getSnipText NOT FOUND "%s" %s`, snipText)
        }
        done = true
    } while (!done);
    return snipText
}
//
function removeData() {
    disableUpdate.value = false
    userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = "Created"
    userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = ''
    userData.viewedArticles[idxViewed.value].ViewedArticleSnips = ''
    loadArticleText()
}
//
// Async Do Fetch
async function doFetch(calledFrom, url, options) {
    const request = new Request(url, options);
    const fetchPromise = fetch(request);
    const response = await fetchPromise
        .catch(error => {
            errorsStore.arrayErrors.push({ msg: 'Server not available', param: '' });
            console.log('doFetch ' + calledFrom + ' : Error in event handler::', error);
            return
        });
    // console.log (response);
    // iterate over all headers
    // for (let [key, value] of response.headers) {
    // console.log(`${key} = ${value}`);
    // }
    console.log(calledFrom + ": response.status =", response.status);
    if (response.status == 200) {
        const data = await response.json();
        console.log('doFetch ' + calledFrom + ' response ', data)
    } else {
        errorsStore.arrayErrors = response.error
    }
}
//
// load of An Article - they will be SSE'd to App.vue
//
function loadArticle(firstLoad) {
    const url = import.meta.env.VITE_SERVER_URL + "/dispArticle/newspaper/" + props.articleId + "/"
        + props.listId + "/" + !firstLoad;
    const options = {
        method: "get",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    doFetch('loadArticle', url, options)
}
//  Post updated data and wait for response in reloadArticle
function saveData() {
    // console.log("click updateData");
    var updatedData = {
        'troveUserId': userData.troveDetails.troveUserId,
        'listId': props.listId,
        'articleId': props.articleId,
        'articleMinedStatusText': userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText,
        'metadata': userData.viewedArticles[idxViewed.value].ViewedArticleMetadata,
        'selectedData': userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText,
        'selectedTextSnips': userData.viewedArticles[idxViewed.value].ViewedArticleSnips,
        'summaryData': userData.viewedArticles[idxViewed.value].ViewedArticleSummaryText
    }
    if (updatedData.selectedData.length == 0) {
        updatedData.selectedData = 'None';
    }
    if (updatedData.summaryData.length == 0) {
        updatedData.summaryData = 'None';
    }
    // console.log (updatedData);
    const url = import.meta.env.VITE_SERVER_URL + "/saveDB/updateArticle";
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
    console.log(options);
    doFetch('loadArticle', url, options)
    //
    disableUpdate.value = true
}
//
function changeMinedStatus(newMinedStatus) {
    userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = newMinedStatus
    disableUpdate.value = false
}
//  Set the Article Original Text
watch(() => userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText, () => {
    loadArticleText();
    return
})
//  Set the popover hint and dropdown when Edit is started
watch(editMetadata, (newEditMetadata) => {
    if (newEditMetadata > -1) setupEditedFields(newEditMetadata)
    return
})
//  Enable Updata Data Button
watch(() => userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText, () => {
    disableUpdate.value = false
},
    { once: true }
)
watch(() => userData.viewedArticles[idxViewed.value].ViewedArticleSummaryText, () => {
    disableUpdate.value = false
},
    { once: true }
)
//
function setupEditedFields(index) {
    popoverForMetadata.value = ''
    const metadataType = userData.viewedArticles[idxViewed.value].ViewedArticleMetadata[index][0]
    console.log('Change editMetadata ', index, metadataType)
    // Wait for DOM update, then focus on the new select field
    nextTick(() => {
        const thisId = "select-" + index
        const newSelect = document.getElementById(thisId);
        // console.log('Focus:', thisId, newSelect)
        if (newSelect) newSelect.focus();
    });
    if (metadataType.length == 0) return
    // Popover
    switch (metadataType) {
        case 'Person':
            popoverForMetadata.value = popoverPersonMetadata
            break
        case 'EventDate':
        case 'OtherDate':
            popoverForMetadata.value = popoverDateMetadata
    }
    // Dropdown
    const metadata = userData.metadataTypeByMetadata.find((el) => el.metadataType === metadataType)
    // console.log ('Change editMetadata ', metadata)
    arrayMetadataDropdown.value = []
    if (metadata) arrayMetadataDropdown.value = metadata.arrayMetadata.map((el) => el.metadataValue)
    // console.log ('Change editMetadata ', arrayMetadataDropdown)
    return
}
//
function addedEntityToMetadata(index) {
    editMetadata.value = Number(index)
    showModalEntities.value = false
}
//
function updateMetadata(action, index) {
    notifyEditError.value = 'inherit';
    switch (action) {
        case 'Cancel':
            editMetadata.value = -1;
            if (savedMetadata.value.length == 0) {
                userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.splice(index, 1);
            } else {
                userData.viewedArticles[idxViewed.value].ViewedArticleMetadata[index] = savedMetadata.value;
            }
            break;
        case 'Check':
            var savedPopover = popoverForMetadata.value;
            var clickedRowCells = userData.viewedArticles[idxViewed.value].ViewedArticleMetadata[index];
            var message = checkMetadata(clickedRowCells);
            if (message.length > 0) {
                popoverForMetadata.value = message;
                notifyEditError.value = 'red';
            } else {
                disableUpdate.value = false;
                editMetadata.value = -1;
                popoverForMetadata.value = savedPopover;
                // New Metadata Items are added from Sever
            }
            break;
        case 'Del':
            userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.splice(index, 1);
            disableUpdate.value = false;
            break;
        case 'Edit':
            if (index) {
                editMetadata.value = index;
                savedMetadata.value = userData.viewedArticles[idxViewed.value].ViewedArticleMetadata[index];
            } else {
                editMetadata.value = userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.length - 1;
                savedMetadata.value = [];
            }
            break;
        case 'New':
            var newMatadata = ['', '', 'Sel'];
            userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.splice(index + 1, 0, newMatadata);
            editMetadata.value = index + 1;
            break;
        default:
            break;
    }
}
// On clicking the check edit button, do row cell edit checks
function checkMetadata(clickedRowCells) {
    // console.log (clickedRowCells);
    var message = ''
    // Check Different Metadata Types
    switch (clickedRowCells[0]) {
        case 'Person':
            message = editPersonMetadata(clickedRowCells[1])
            break;
        case 'EventDate':
        case 'OtherDate':
            message = checkInputDate(clickedRowCells[1]);
            break;
    }
    return message
}
//  Edit a Person Metadata
function editPersonMetadata(stringPerson) {
    // Edit the person name and change tooltip , anything not recognised mark in red
    var newTooltip = '';
    // Family Name (nee Maiden Family Name), Given Names with Initials N. b.9999
    // First part is Surname and Maiden name - preceding a comma
    var commaParts = stringPerson.split(",");
    if (commaParts[0].replace(/[^0-9]/g, "").length > 1) {
        newTooltip = 'Family name includes digits';
    } else {
        // Is there a Maiden Name
        var familyNames = commaParts[0].split("(");
        newTooltip = 'FamilyName = ' + familyNames[0];
        if (familyNames.length > 1) {
            var tempMn = familyNames[1].replace('nee', '');
            var strMn = tempMn.replace(')', '');
            newTooltip += '\nMaidenName = ' + strMn;
        }
        if (commaParts.length == 2) { // too many commas if more than 2 parts so ignore that
            var givenNameParts = commaParts[1].split(" ");
            var yearOfBirth = '';
            var yearOfDeath = '';
            var givenNames = '';
            if (/^b.\d{4}-d.\d{4}/.test(givenNameParts[givenNameParts.length - 1])) {
                var arrayYear = givenNameParts.pop();
                // <!--console.log ('Validate Name has dob dod', arrayYear);-->
                yearOfBirth = arrayYear[0];
                yearOfDeath = arrayYear[1];
                givenNames = givenNameParts.join(' ');
            } else {
                if (/^b\.\d{4}/.test(givenNameParts[givenNameParts.length - 1])) {
                    yearOfBirth = givenNameParts.pop();
                    // <!--console.log ('Validate dob ', yearOfBirth);-->
                    if (yearOfBirth.length < 7) {
                        // <!--console.log ('Validate Name has dob ', yearOfBirth);-->
                        givenNames = givenNameParts.join(' ');
                        // Good Year of Birth
                    } else {
                        newTooltip += '\nYear of Birth not matched';
                        givenNames = yearOfBirth; // Force Error
                    }
                } else {
                    givenNames = commaParts[1];
                }
            }
            if (givenNames.replace(/[^0-9]/g, "").length > 1) {
                newTooltip += '\nGiven Name or Year of Birth not matched';
            } else {
                newTooltip = '';
                // if (yearOfBirth.length == 0) {
                //   newTooltip += '\nYear of Birth not found';
                // } 
            }
        } else {
            if (commaParts.length == 1) {
                newTooltip += '\n - Need GivenName or Initial';
            } else {
                newTooltip += '\nGivenName/s has comma';
            }
        }
    }
    return newTooltip;
}
//
function checkInputDate(stringDate) {
    var newTooltip = '';
    var regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!stringDate.match(regEx)) {
        newTooltip = 'Not YYYY-MM-DD';
    } else {
        var d = new Date(stringDate);
        var dNum = d.getTime();
        if (!dNum && dNum !== 0) {
            newTooltip = 'Invalid date'
        } else {
            if (!(d.toISOString().slice(0, 10) === stringDate)) {
                newTooltip = 'Invalid Calendar Date'
            }
        }
    }
    if (newTooltip.length > 0) {
        return newTooltip;
    }
    return '';
}
//
loadArticleText();
loadArticle(true)
//
if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
    showTroveText.value = false;
    showSummaryText.value = true;
}
//
</script>
<template>
    <div class="container-fluid">
        <h1>Article {{ userData.viewedArticles[idxViewed].ViewedArticleId }} <br>List {{
            userData.userLists[idxList].TroveListId }}-
            {{ userData.userLists[idxList].TroveListName }}
        </h1>
        <div class="container-fluid">
            <div class="card">
                <div class="card-header">
                    <p> {{ userData.viewedArticles[idxViewed].ViewedArticleHeading }}</p>
                    <p>Source - {{ userData.viewedArticles[idxViewed].viewedArticlesource }} published on {{
                        userData.viewedArticles[idxViewed].ViewedArticlePubDate }} </p>
                    <p>Last Updated - {{ userData.viewedArticles[idxViewed].ViewedArticleLastTroveUpdatedText }}
                        by {{ userData.viewedArticles[idxViewed].ViewedArticleUpdatedBy }} </p>
                </div>
                <br>
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-6">
                            <div class="card-header text-center">
                                Trove Actions
                            </div>
                            <div class="card">
                                <div class="container-fluid">
                                    <div class="row">
                                        <div class="col">
                                            <div class="card">
                                                <a class="btn btn-primary"
                                                    :href="userData.viewedArticles[idxViewed].ViewedArticleViewUrl"
                                                    target="_blank" role="button">View Trove Article</a>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <div class="card">
                                                <button @click.prevent="loadArticle(false)"
                                                    class="btn btn-primary">Refresh
                                                    Trove Article</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="display:none" id="refreshTrove">{{
                                userData.viewedArticles[idxViewed].ViewedArticleRetrieveTrove }}</div>
                        </div>
                        <div class="col-6">
                            <div class="card-header text-center">
                                Your Data Actions
                            </div>
                            <div class="card">
                                <div class="container-fluid">
                                    <div class="row">
                                        <div class="col">
                                            <div class="card">
                                                <button
                                                    :class="{ disabled: userData.viewedArticles[idxViewed].ViewedArticlePossibleDupArticle.length == 0 }"
                                                    @click.prevent="showModalDuplicates = true" type="button"
                                                    class="btn btn-primary">
                                                    Possible Duplicates
                                                </button>
                                            </div>
                                            <Teleport to="#positionModals">
                                                <ModalDuplicates v-if="showModalDuplicates"
                                                    @close="showModalDuplicates = false" :idx-viewed="idxViewed" />
                                            </Teleport>
                                        </div>
                                        <div class="col">
                                            <div class="card">
                                                <button
                                                    :class="{ disabled: userData.viewedArticles[idxViewed].ViewedArticleEntities.length == 0 }"
                                                    @click.prevent="showModalEntities = true" type="button"
                                                    class="btn btn-primary">Possible Metadata
                                                </button>
                                            </div>
                                            <Teleport to="#positionModals">
                                                <ModalEntities v-if="showModalEntities"
                                                    @close="showModalEntities = false"
                                                    @added-metadata="(index) => addedEntityToMetadata(index)"
                                                    :idx-viewed="idxViewed" />
                                            </Teleport>
                                        </div>
                                        <div class="col-3">
                                            <div class="card">
                                                <div class="dropdown">
                                                    <button class="btn btn-primary dropdown-toggle" type="button"
                                                        id="dropdownMenuButton1" data-bs-toggle="dropdown"
                                                        aria-expanded="false">
                                                        {{
                                                            userData.viewedArticles[idxViewed].ViewedArticleMinedStatusText
                                                        }}
                                                    </button>
                                                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1"
                                                        role="menu">
                                                        <li v-for="minedStatus in userData.arrayMinedStatus[1]"
                                                            :value="minedStatus" :key="minedStatus">
                                                            <a class="dropdown-item"
                                                                @click.prevent="changeMinedStatus(minedStatus)"
                                                                href="#">{{
                                                                    minedStatus
                                                                }}</a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col">
                                            <div class="card">
                                                <button :class="{ disabled: disableUpdate }" @click.prevent="saveData"
                                                    class="btn btn-primary">Update
                                                    Data</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="display:none" id="refreshDB">{{
                            userData.viewedArticles[idxViewed].ViewedArticleRetrieveDB }}
                        </div>
                    </div>
                    <br>
                    <div class="row">
                        <div class="col-sm-6">
                            <div class="card-header text-center">
                                Trove Note Data
                            </div>
                            <div class="card">
                                <div class="card-body pre-scrollable" style="max-height: 35vh" id="troveNote">{{
                                    userData.viewedArticles[idxViewed].ViewedArticleNote ?
                                        userData.viewedArticles[idxViewed].ViewedArticleNote : 'No Trove Note for Article'
                                }}</div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="card-header text-center">
                                Your Meta Data
                            </div>
                            <div class="card-body overflow-auto" style="max-height: 35vh; line-height: 100%">
                                <table class="table table-bordered">
                                    <thead class="mbhead">
                                        <tr class="mbrow">
                                            <th>Type</th>
                                            <th>Value</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="(articleMetadata, index) in userData.viewedArticles[idxViewed].ViewedArticleMetadata">
                                            <template v-if="editMetadata > -1"> <!-- In Edit Mode-->
                                                <template v-if="editMetadata == index"> <!-- Row to Edit -->
                                                    <td> <!-- Metadata Type -->
                                                        <select v-model="articleMetadata[0]" :id="'select-' + index"
                                                            @change="setupEditedFields(editMetadata)">
                                                            <option v-for="option in userData.arrayMetadataTypes"
                                                                :value="option">{{ option }}
                                                            </option>
                                                        </select>
                                                    </td>
                                                    <td class="metadataPopover"
                                                        :style="{ 'background-color': notifyEditError }">
                                                        <!-- Metadata Value -->
                                                        <input v-model="articleMetadata[1]"
                                                            list="datalist-metadataValues">
                                                        <span v-if="popoverForMetadata.length > 0"
                                                            class="tooltiptext">{{ popoverForMetadata
                                                            }}</span>
                                                        </input>
                                                        <datalist id="datalist-metadataValues">
                                                            <option v-for="option in arrayMetadataDropdown"
                                                                :value="option"></option>
                                                        </datalist>
                                                    </td>
                                                    <td>
                                                        <EditItem @click-item="updateMetadata('Check', index)"
                                                            action="Check" icon="bi-check-square" />
                                                        <EditItem @click-item="updateMetadata('Cancel', index)"
                                                            action="Cancel" icon="bi-x-square" />
                                                    </td>
                                                </template>
                                                <template v-else>
                                                    <td>{{ articleMetadata[0] }}</td>
                                                    <td>{{ articleMetadata[1] }}</td>
                                                    <td>
                                                    </td>
                                                </template>
                                            </template>
                                            <template v-else> <!-- In Display Mode-->
                                                <td>{{ articleMetadata[0] }}</td>
                                                <td>{{ articleMetadata[1] }}</td>
                                                <td>
                                                    <EditItem
                                                        v-if="index == userData.viewedArticles[idxViewed].ViewedArticleMetadata.length - 1"
                                                        @click-item="updateMetadata('New', index)" action="New"
                                                        icon="bi-plus-square" />
                                                    <template v-if="articleMetadata[2] == 'Sel'">
                                                        <!-- Can only Edit or Del User added Metadata -->
                                                        <EditItem @click-item="updateMetadata('Edit', index)"
                                                            action="Edit" icon="bi-pencil-square" />
                                                        <EditItem @click-item="updateMetadata('Del', index)"
                                                            action="Del" icon="bi-x-square" />
                                                    </template>
                                                </td>
                                            </template>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <br>
                    <div class="row">
                        <details :open="showTroveText">
                            <summary>
                                <!-- <div class="card-header text-center"> -->
                                Trove Original Text
                                <!-- </div> -->
                            </summary>
                            <div class="card text-center">
                                Search Word ({{ userData.viewedArticles[idxViewed].ViewedArticleSearchWord }}) Occurs {{
                                    userData.viewedArticles[idxViewed].ViewedArticleFoundCount }}
                            </div>
                            <div class="card">
                                <div @scroll.once="scrollSearchWord" @mouseup="getSelectedText" id="textTrove"
                                    class="card-body overflow-auto" style="max-height: 300px">
                                    <span v-html="viewArticleText"></span>
                                </div>
                            </div>
                        </details>
                    </div>
                    <div class="row">
                        <details :open="showSelectedText">
                            <summary style="display: flex; justify-content: space-between; align-items: center;">
                                <span>Your Selected Text</span>
                                <button
                                    :class="{ disabled: userData.viewedArticles[idxViewed].ViewedArticleSelectedText.length == 0 }"
                                    @click.prevent="removeData" class="btn btn-primary">
                                    Remove Selected Data
                                </button>
                            </summary>
                            <div class="form-group pre-scrollable" style="max-height: 75vh">
                                <textarea
                                    v-model.lazy.trim="userData.viewedArticles[idxViewed].ViewedArticleSelectedText"
                                    class="form-control" style="max-height: 300px" rows=40
                                    placeholder="Select from above panel to copy here, then save" tabindex="1000"
                                    readonly>
            </textarea>
                            </div>
                        </details>
                    </div>
                    <div class="row">
                        <details :open="showSummaryText">
                            <summary>
                                Your Summary Text
                            </summary>
                            <div class="form-group pre-scrollable" style="max-height: 75vh">
                                <textarea @input.once="disableUpdate = false"
                                    v-model.lazy.trim="userData.viewedArticles[idxViewed].ViewedArticleSummaryText"
                                    class="form-control" style="max-height: 300px" rows=40
                                    placeholder="Summarize this event" tabindex="1000">
            </textarea>
                            </div>
                        </details>
                    </div>
                </div>
                <br>
            </div>
        </div>
    </div>
</template>

<style scoped>
mark.search {
    text-decoration: "underline"
}
</style>