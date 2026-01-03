<script setup>
import ModalEntities from '@/components/ModalEntities.vue'
import ModalDuplicates from '@/components/ModalDuplicates.vue'
import EditItem from '@/components/EditItem.vue'
import ModalSearchText from '@/components/ModalSearchText.vue'
import { ref, reactive, watch, nextTick } from 'vue'
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useToast } from 'vue-toastification'
const toast = useToast()
// const props = defineProps(['listId', 'articleId'])
// console.log(`Edit Article View List:%s , Article:%s`, props.listId, props.articleId)

// navStore.articleId = props.articleId
// navStore.articleHref = "/editArticle/" + navStore.listId + "/" + navStore.articleId
navStore.articleHref = "/editArticle"
navStore.articleTabTitle = "Article " + navStore.articleId
//
var idxList = ref(0)
idxList.value = userData.userLists.findIndex((item) => item.TroveListId == navStore.listId);
var idxListArticle = ref(0)
idxListArticle.value = userData.userListArticles[idxList.value].findIndex((item) => item.TroveListArticleId == navStore.articleId);
var viewArticleText = ref('');
var searchText = ref('');
var searchTextCount = ref(0);
var showModalSearchText = ref(false)
const articleRef = ref(null);
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
const divSelectConst = '<div class="snip-block" data-snipnbr="x">'
const divEnd = '</div>'
const handleStart = '&#x25C0;'
const spanHandleStart = `<span class="snip-handle snip-handle-front" draggable="true" data-handle="front">` + handleStart + `</span>`
const handleEnd = `&#x25B6;`
const spanHandleEnd = `<span class="snip-handle snip-handle-back" draggable="true" data-handle="back">` + handleEnd + `</span>`
var parsedArticleText = {}
var cleanOriginalText = ''
const emptySnip = { snipf: { text: '', posText: -1 }, snipb: { text: '', posText: -1 } };
var snipChange = -1
var articleSnips = [];
var articleSnipsOld = []
var updSnip = {}
var updSnipOld = {}
var snipedText = ref([])
var showToolbar = ref(false)
var snipCancelDisabled = ref(true)
var snipDropDisabled = ref(true)
var snipUpdateDisabled = ref(true)
var updSelectTextDisabled = ref(true)
var cancelUpdTextDisabled = ref(true)
var deleteSelectedTextDisabled = ref(true)
var popoverForMetadata = ref('')
var savedMetadata = []
var arrayMetadataDropdown = ref([])
//
// Capture highlighted text in Trove Article
// Extract Snip Front and Back Edges
function snipHighlightedText(event) {

    var selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const endNode = range.endContainer;

    if (startNode.nodeType !== Node.TEXT_NODE || endNode.nodeType !== Node.TEXT_NODE) return;

    const startText = startNode.textContent;
    const endText = endNode.textContent;

    // Slide startOffset forward to end of word
    let newStart = range.startOffset;
    while (newStart > 0 && /\w/.test(startText[newStart])) newStart--;

    // Slide endOffset backward to start of word
    let newEnd = range.endOffset;
    while (newEnd < endText.length && /\w/.test(endText[newEnd - 1])) newEnd++;

    // Update selection
    const newRange = document.createRange();
    newRange.setStart(startNode, newStart);
    newRange.setEnd(endNode, newEnd);

    selection.removeAllRanges();
    selection.addRange(newRange);

    selection = window.getSelection()
    var selectedText = selection.toString()
    if (selectedText.length < 15) {
        selection.removeAllRanges();
        return false; // Just a click
    }
    const snip = getSnipFrontBack(emptySnip, selectedText)
    if ((typeof snip === 'boolean') && (!snip)) {
        selection.removeAllRanges();
        return false;
    }
    articleSnips.push(snip);
    updSnip = { ...snip };
    updSnipOld = {}
    snipChange = articleSnips.length - 1
    // console.log(`EditArticle snipText Snips Out %s`, JSON.stringify(snips))
    loadArticleText()
    // Sets articleSnipsOld = []
    snipSelAction('endDrag', '')
}
//
function getSnipFrontBack(inSnip, selectedText) {
    // Check snip long enough
    if (selectedText.length < 20) {
        console.log(`EditArticle getSnip Snip Not Long "%s"`, selectedText)
        toast.error('Snip to be longer then 20, pls redo')
        return false
    }
    const clean = cleanUpText(selectedText)
    const selTextWords = clean.split(' ')
    const allText = userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText
    var snipf = inSnip.snipf
    if (snipf.posText < 0) {
        snipf = frontWordMatch(allText, 0, selTextWords) // Updates snipf.text, snipf.posText
        if (typeof snipf == 'boolean') {
            console.log(`EditArticle getSnipFrontBack Front Snip Not Unique `)
            toast.error('Snip Front not unique, pls redo')
            return false
        }
    }
    var snipb = inSnip.snipb
    if (snipb.posText < 0) {
        snipb = backWordMatch(allText, snipf.posText, selTextWords) // Updates snipb.text, snipb.posText
        if (typeof snipb == 'boolean') {
            console.log(`EditArticle getSnipFrontBack Back Snip Not Unique `)
            toast.error('Snip Back not unique, pls redo')
            return false
        }
    }
    const snip = {
        snipf: snipf,
        snipb: snipb
    };
    // console.log(`EditArticle getSnip Snip %s`, JSON.stringify(snip))
    // Check for snip overlap
    for (const asnip of articleSnips) {
        if (Object.keys(asnip).length === 0) continue
        console.log(`EditArticle getSnip Snip %s Overlap Check %s`, JSON.stringify(snip), JSON.stringify(asnip))
        if (((snip.snipf.posText >= asnip.snipf.posText) && (snip.snipf.posText <= asnip.snipb.posText))
            || ((snip.snipb.posText >= asnip.snipf.posText) && (snip.snipb.posText <= asnip.snipb.posText))
            || ((snip.snipf.posText < asnip.snipf.posText) && (snip.snipb.posText > asnip.snipb.posText))) {
            console.log(`EditArticle getSnip Snip Overlap `)
            toast.error('Overlapping snip, pls redo')
            return false
        }
    }
    return snip
}
//
function frontWordMatch(allText, start, selTextWords) {
    var matchWords = 1
    do {
        const matchs = matchWordArray(selTextWords.slice(0, matchWords), allText)
        if (matchs.length == 0) {
            console.log('frontWordMatch Selected Text Front NON Match "%s"', selTextWords.slice(0, matchWords + 1))
            return false
        }
        if (matchs.length == 1) {
            // console.log('Selected Text Back One Match "%s"', JSON.stringify(matchs))
            // const pos = getInsertPos('front', start, matchs[0].text, allText)
            // if (pos.pos != matchs[0].posText) console.log('frontWordMatch Selected Text Front NE insert %s, %s', pos.pos, matchs[0].posText)
            return matchs[0]
        }
        ++matchWords
    } while (matchWords < selTextWords.length)
    console.log('frontWordMatch Selected Text Front Not Unique')
    return false
}
function backWordMatch(allText, start, selTextWords) {
    var matchWords = selTextWords.length - 1
    do {
        const matchs = matchWordArray(selTextWords.slice(matchWords), allText)
        if (matchs.length == 0) {
            console.log('backWordMatch Selected Text Back NON Match "%s"', selTextWords.slice(matchWords))
            return false
        }
        if (matchs.length == 1) {
            // console.log('Selected Text Back One Match "%s"', JSON.stringify(matchs))
            // const pos = getInsertPos('back', start, matchs[0].text, allText)
            // if ((pos.pos - matchs[0].text.length) != matchs[0].posText) console.log('backWordMatch Selected Text Back NE insert %s, %s', pos.pos, matchs[0].posText)
            return matchs[0]
        }
        --matchWords
    } while (matchWords > 1)
    console.log('backWordMatch Selected Text Back Not Unique')
    return false
}
//
function matchWordArray(matchWords, allText) {
    const regex = regxMatchWords(matchWords)
    const matchs = [...allText.matchAll(regex)];
    // console.log('matchWordArray matchs %s', matchs.length)
    return matchs.map(m => ({ text: m[0], posText: m.index }));
}
//
function regxMatchWords(matchWords) {
    // console.log('regxMatchWords matchWords %s', matchWords)
    const gap = '(?:\\s|\\u0000|<[^>]+>|—|\')*';
    const escMatchWords = matchWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = escMatchWords.map(w => `(?<=\\W|^)${w}(?=\\W|$)`).join(gap);
    // console.log('regxMatchWords pattern %s', pattern)
    return new RegExp(pattern, 'g');
}
// Standardise the text
function cleanUpText(inText) {
    inText = inText.replace(/—/g, ' ')
    inText = inText.replace(/^—+|—+$/g, '') // remove leading or trailing -
    inText = inText.replace(/-\n/g, " ");
    // inText = inText.replace(/- /g, "");
    inText = inText.replace(/\n/g, " ");
    inText = inText.replace(/\u25C0/g, "");
    inText = inText.replace(/\u25B6/g, "");
    inText = inText.replace(/(\S)—(\S)/g, '$1 — $2')  // no spaces on either side
        .replace(/(\S)—/g, '$1 —')         // missing space before
        .replace(/—(\S)/g, '— $1');         // missing space after

    // Strip HTML
    const temp = document.createElement("div");
    temp.innerHTML = inText;
    let clean = temp.textContent || temp.innerText || "";

    // Normalize whitespace and strip invisible characters
    clean = clean.replace(/[\u200B-\u200D\uFEFF\u00AD\u202A-\u202E]/g, '');
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
}
// Ensure snips are unique returns posText
//
function loadArticleText() {
    // console.log('EditArticle loadArticleText length', userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText.length)
    if (userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText.length > 0) {
        viewArticleText.value = userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText;
        if (articleSnips.length > 0) {
            snipedText.value = []
            // Mark Selected Text
            // console.log(`EditArticle loadArticleText Snips Before %s`, JSON.stringify(articleSnips))
            var snipNbr = -1;
            for (let snip of articleSnips.slice()) {
                if (snip.snipf.text.length == 0) continue;
                let posFront = getInsertPos('front', snip.snipf.text, viewArticleText.value);
                // console.log(`EditArticle loadArticleText PreSnip posFront "%s"`, viewArticleText.value.slice(posFront.pos, posFront.pos + 10))
                let posBack = posFront.pos < 0 ? posFront : getInsertPos('back', snip.snipb.text, viewArticleText.value);
                // console.log(`EditArticle loadArticleText PreSnip posBack "%s"`, viewArticleText.value.slice(posBack.pos - 10, posBack.pos))
                // console.log(`EditArticle loadArticleText Snip %s posFront %s, posBack %s Text %s`, snipNbr, posFront.pos, posBack.pos, viewArticleText.value.length)
                snipNbr += 1
                if ((posFront.pos > -1) && (posBack.pos > posFront.pos)) {
                    snip.snipf.posText = posFront.pos
                    snip.snipb.posText = posBack.pos
                    const part1 = viewArticleText.value.slice(0, posFront.pos)
                    const part2 = viewArticleText.value.slice(posFront.pos, posBack.pos)
                    const part3 = viewArticleText.value.slice(posBack.pos)
                    console.log(`EditArticle loadArticleText Snip %s posFront "%s" at %s "%s", posBack "%s" at %s "%s"`,
                        snipNbr, snip.snipf.text, posFront.pos, part2.slice(0, 50), snip.snipb.text, posBack.pos, part2.slice(-50))
                    if (snipChange == snipNbr) {
                        viewArticleText.value = part1 + spanHandleStart + part2 + spanHandleEnd + part3
                    } else {
                        const divSelect = divSelectConst.replace('x', snipNbr)
                        viewArticleText.value = part1 + cleanInsert('front', divSelect, posFront.nodeInfo, posBack.nodeInfo)
                            + part2 + cleanInsert('back', divEnd, posFront.nodeInfo, posBack.nodeInfo) + part3
                    }
                    updSnipedTextArray(snip)
                } else {
                    console.log(`EditArticle loadArticleText Snip %s NOT FOUND %s`, snipNbr, JSON.stringify(snip))
                    toast.info('Snip not Found ' + (snipNbr + 1))
                    articleSnips.splice(snipNbr, 1)
                }
            }
            console.log(`EditArticle loadArticleText Snips After Selects %s`, JSON.stringify(articleSnips))
        }
        // 
        if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText == "Use Snips") copySelectedText()
        markSearchText(userData.viewedArticles[idxViewed.value].ViewedArticleSearchWord)
    }
}
// Mark Search Text
function markSearchText(searchTextIn) {
    // var doScroll = false;
    // if (searchText.value.length > 0) doScroll = true // We are changing the Search Text
    console.log(`EditArticle/markSearchText Search "%s", %s`, searchTextIn, viewArticleText.value.length)
    if (searchTextIn.length > 0) searchText.value = searchTextIn
    if (searchText.value.length == 0) return
    viewArticleText.value = viewArticleText.value.replaceAll(markSearch, "").replaceAll(markEnd, "");
    console.log('EditArticle/markSearchText Search', searchText.value, viewArticleText.value.length)
    var re = new RegExp("(" + searchText.value + ")", "gi");
    searchTextCount = (viewArticleText.value.match(re) || []).length;
    viewArticleText.value = viewArticleText.value.replace(re, function (matched) {
        // console.log("EditArticle markSearchText matched", matched)
        return markSearch + matched + markEnd
    })
    // console.log('EditArticle markSearchText Search After', viewArticleText.value.length)
}
// Find where to insert Snip Handles
function getInsertPos(snipEdge, match, text) {
    const cleanMatch = cleanUpText(match)
    const matchWords = cleanMatch.split(' ')
    const regex = regxMatchWords(matchWords)
    var pos = text.search(regex)
    // console.log(`EditArticle getInsertPos match "%s" at %s`, cleanMatch, pos)
    if (pos < 0) {
        console.log(`EditArticle getInsertPos NOT match "%s"`, cleanMatch)
        return { pos: -1 }
    }
    if (snipEdge == 'back') pos = pos + match.length
    // const front = (pos - 25) < 0 ? 0 : (pos - 25)
    // const back = (pos + 25) > text.length - 1 ? text.length - 1 : pos + 25
    // console.log(`EditArticle getInsertPos match "%s" and "%s"`, text.slice(front, pos), text.slice(pos, back))
    // Get the html node type and text
    const nodeInfo = findNodeInfo(snipEdge, cleanMatch)
    if (nodeInfo.edgeMatch) { //  encpsulate tag by adjusting pos
        const slideBy = snipEdge == 'front' ? -1 : 1
        const slideFor = snipEdge == 'front' ? '<' + nodeInfo.nodeType + '>' : '</' + nodeInfo.nodeType + '>'
        // console.log('EditArticle getInsertPos edgeMatch %s,"%s","%s"',
        //     nodeInfo.edgeMatch, nodeInfo.nodeText.slice(0, 10), nodeInfo.nodeText.slice(nodeInfo.nodeText.length - 10))
        const strStart = pos - 10 < 0 ? 0 : pos - 10
        const strEnd = pos + 10 > text.length ? text.length : pos + 10
        const chunk = snipEdge == 'front' ? text.slice(strStart, pos) : text.slice(pos, strEnd)
        const checkPtr = snipEdge == 'front' ? chunk.length - 1 : 0
        const slide = slidePos(slideBy, slideFor, checkPtr, chunk)
        var slideAdj = 0
        if (slide != 0) slideAdj = snipEdge == 'front' ? slide : slide + slideFor.length
        console.log('EditArticle getInsertPos slide %s', slideAdj)
        pos = pos + slideAdj
    }
    // console.log('EditArticle getInsertPos Found "%s" in "%s" at %s Node Tag "%s"', match,
    //     text.slice(pos - match.length, pos) + "|" + text.slice(pos, pos + match.length), pos, nodeInfo.nodeTagStart)
    return { pos: pos, nodeInfo: nodeInfo }
}
// Get Node where insert is to happen
function findNodeInfo(snipEdge, match) {
    // Create html portion to find node at insert point
    const matchStr = match.replaceAll(" ", "")
    parsedArticleText = parseHTMLFragment(viewArticleText.value)
    const walker = document.createTreeWalker(parsedArticleText, NodeFilter.SHOW_TEXT, null)
    while (walker.nextNode()) {
        var node = walker.currentNode
        var text = cleanUpText(node.outerHTML || node.textContent || '')
        const nodeText = text.replaceAll(" ", "")
        const matchStrLen = nodeText.length < matchStr.length ? matchStr.slice(0, nodeText.length - 1) : matchStr
        const edgeMatch = snipEdge == 'front' ? nodeText.startsWith(matchStrLen) : nodeText.endsWith(matchStrLen)
        const matchIndex = nodeText.indexOf(matchStr)
        if ((edgeMatch) || (matchIndex > -1)) {
            // console.log('EditArticle findNodeInfo match "%s" against "%s"', matchStrLen, nodeText)
            var nodeType = node.parentElement?.tagName?.toLowerCase()
            if (!(['p', 'span'].includes(nodeType))) {
                nodeType = ''
            }
            // console.log('EditArticle findNodeInfo checked %s Node Type %s edgeMatch %s',
            //     snipEdge, nodeType, edgeMatch)
            return {
                edgeMatch: edgeMatch,
                nodeType: nodeType,
                nodeText: node.textContent
            }
        }
    }
    console.log('EditArticle findNodeInfo NOT FOUND "%s" at Edge', matchStr)
    return { edgeMatch: false, nodeType: '', nodeText: '' }
}
//
function cleanInsert(snipEdge, handle, nodeInfoStart, nodeInfoEnd) {
    // console.log(`EditArticle cleanInsert Front %s, Back %s`, JSON.stringify(nodeInfoStart), JSON.stringify(nodeInfoEnd))
    var tagStart = '<' + nodeInfoStart.nodeType + '>'
    var tagEnd = '</' + nodeInfoStart.nodeType + '>'
    if (nodeInfoStart.edgeMatch) {
        tagStart = tagEnd = ''
    }
    if (snipEdge == "front") {
        if (nodeInfoStart.nodeText === nodeInfoEnd.nodeText) { // No need to wrap text
            tagEnd = ''
        }
    } else {
        if (nodeInfoEnd.edgeMatch) {
            tagStart = tagEnd = ''
        } else {
            tagStart = '<' + nodeInfoEnd.nodeType + '>'
            tagEnd = '</' + nodeInfoEnd.nodeType + '>'
            if (nodeInfoStart.nodeText === nodeInfoEnd.nodeText) { // No need to wrap text
                tagStart = ''
            }
        }
    }
    const tag1 = snipEdge == "front" ? nodeInfoStart.nodeTagEnd : nodeInfoEnd.nodeTagEnd
    const tag2 = snipEdge == "front" ? nodeInfoStart.nodeTagStart : nodeInfoEnd.nodeTagStart
    // console.log(`EditArticle cleanInsert pos %s, %s-%s-%s`, snipEdge, tag1, handle, tag2)
    return tagStart + handle + tagEnd
}
//
function slidePos(slideBy, slideFor, checkPtr, chunk) {
    console.log('EditArticle loadArticleText slidePos start slideBy %s, slideFor %s, checkPtr %s, chunk "%s", check "%s" ',
        slideBy, slideFor, checkPtr, chunk, chunk.slice(checkPtr, checkPtr + 1))
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
// Snip the Clean Text to display
function updSnipedTextArray(thisSnip) {
    var selTextWords = cleanUpText(thisSnip.snipf.text).split(" ")
    const matchsFront = matchWordArray(selTextWords, cleanOriginalText)
    if (matchsFront.length != 1) {
        console.log(`EditArticle updSnipedTextArray Front Snip Not Found "%s" `, selTextWords)
        toast.error('Snip Front not unique to enable snip, pls redo')
        return false
    }
    selTextWords = cleanUpText(thisSnip.snipb.text).split(" ")
    const matchsBack = matchWordArray(selTextWords, cleanOriginalText)
    if (matchsBack.length != 1) {
        console.log(`EditArticle updSnipedTextArray Back Snip Not Found "%s" `, selTextWords)
        toast.error('Snip Back not unique to enable snip, pls redo')
        return false
    }
    const selectedText = cleanOriginalText.slice(matchsFront[0].posText, matchsBack[0].posText + thisSnip.snipb.text.length)
    snipedText.value.push(selectedText)
}
// Scroll to Search Word in Trove Article, identify by <mark>
function scrollTroveText(searchTerm) {
    const container = articleRef.value; // the .card-body div
    // Find the span that holds the article text
    const span = container.querySelector("span");
    if (!span) return;
    // Use Range + TreeWalker to locate the text node
    console.log("EditArticle/scrollTroveText scroll event");
    const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
    let node, index, found = false;
    while ((node = walker.nextNode())) {
        index = node.nodeValue.indexOf(searchTerm);
        if (index !== -1) {
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + searchTerm.length);

            const rect = range.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            var offsetTop = rect.top - containerRect.top + container.scrollTop;
            // Adjust to scroll one line above
            const lineHeight = parseFloat(getComputedStyle(container).lineHeight) || 20;
            offsetTop = Math.max(0, offsetTop - lineHeight);
            container.scrollTo({
                top: offsetTop,
                left: 0,
                behavior: "smooth",
            });
            found = true;
            break;
        }
    }
    if (!found) {
        console.log(`EditArticle/scrollTroveText Not found %s, scrolling to top`, searchTerm);
        container.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }
}
// 
function triggerSnipScroll() {
    if ((articleRef.value) && (articleSnips.length > 0)) {
        console.log("EditArticle/triggerSnipScroll ", articleSnips[0].snipf.text);
        // articleRef.value.scrollTop = articleRef.value.scrollHeight
        scrollTroveText(articleSnips[0].snipf.text)
    }
}
//
function triggerSearchScroll() {
    if ((articleRef.value) && (searchText.value.length > 0)) {
        console.log("EditArticle/triggerSearchScroll ", searchText.value);
        // articleRef.value.scrollTop = articleRef.value.scrollHeight
        scrollTroveText(searchText.value)
    }
}
// Inject handles when snip is clicked
function activateHandles(event) {
    const snipDiv = event.target.closest('.snip-block');
    if (!snipDiv || snipDiv.parentElement.classList.contains('snip-wrapper')) return;
    snipChange = snipDiv.dataset.snipnbr
    updSnipOld = { ...articleSnips[snipChange] }  // Save Old
    console.log(`EditArticle activateHandles %s, %s`, snipChange, JSON.stringify(updSnipOld))
    loadArticleText()
    // Sets articleSnipsOld = []
    snipSelAction('selected', '')
}
// Manage Selected Snip Buttons
function snipSelAction(actionSnip, actionText) {
    // console.log(`EditArticle snipSelAction %s, %s`, actionSnip, actionText)
    switch (actionText) {
        case "update":
            updSelectTextDisabled.value = false
            cancelUpdTextDisabled.value = false
            showToolbar.value = true
            break
        default:
            updSelectTextDisabled.value = true
            cancelUpdTextDisabled.value = true
            articleSnipsOld.length = 0

    }
    switch (actionSnip) {
        case "selected":
            snipCancelDisabled.value = false
            snipDropDisabled.value = false
            snipUpdateDisabled.value = true
            showToolbar.value = true
            deleteSelectedTextDisabled.value = true
            break
        case "startDrag":
            snipCancelDisabled.value = false
            snipDropDisabled.value = true
            snipUpdateDisabled.value = true
            break
        case "endDrag":
            snipCancelDisabled.value = false
            snipDropDisabled.value = false
            snipUpdateDisabled.value = false
            showToolbar.value = true // For snipText
            break
        default: //  ended
            snipCancelDisabled.value = true
            snipDropDisabled.value = true
            snipUpdateDisabled.value = true
            if (updSelectTextDisabled.value) {
                showToolbar.value = false
            }
            if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) deleteSelectedTextDisabled.value = false
            updSnipOld = {}
            updSnip = {}
    }
}
// Handle drag start
function handleDragStart(event) {
    // Sets articleSnipsOld = []
    snipSelAction('startDrag', '')
    const snipEdge = event.target.dataset.handle
    console.log(`EditArticle handleDragStart %s`, snipEdge)
    event.dataTransfer.setData('text/plain', snipEdge)
}
// Handle drop to reposition handle
function handleDrop(event) {
    const snipEdge = event.dataTransfer.getData('text/plain')
    const range = document.caretRangeFromPoint
        ? document.caretRangeFromPoint(event.clientX, event.clientY) : document.caretPositionFromPoint
            ? document.caretPositionFromPoint(event.clientX, event.clientY)
            : null

    if (!range) return null

    // var cleanOriginalText = cleanUpText(userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText);
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(event.currentTarget)
    const articleText = preCaretRange.toString() // The full Article Text
    // console.log(`EditArticle handleDrop area "%s"`, preCaretRange.toString())
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    console.log(`EditArticle handleDrop offset Text "%s"`, preCaretRange.toString())
    var offset = preCaretRange.toString().length // Where the handle was dropped in articleText
    // const start = Math.max(0, offset - 30);
    // const end = Math.min(articleText.length, offset + 30);
    var toMatch = ''
    var tempSnip = { ...updSnipOld }
    if (Object.keys(updSnipOld).length === 0) {
        tempSnip = { ...updSnip } // From text highlight
    }
    console.log(`EditArticle handleDrop points Old start %s "%s", offset %s, Old end %s "%s"`,
        tempSnip.snipf.posText, tempSnip.snipf.text, offset, tempSnip.snipb.posText, tempSnip.snipb.text)
    if (snipEdge == 'front') {
        // Get new Front
        while (offset > 0 && /\w/.test(articleText[offset])) offset--;
        // Get Old back in this text
        var selTextWords = cleanUpText(tempSnip.snipb.text).split(" ")
        const matchsBack = matchWordArray(selTextWords, articleText)
        if (matchsBack.length != 1) {
            console.log(`EditArticle handleDrop Old Back Snip Not Found "%s" `, tempSnip.snipb.text)
            toast.error('Old Snip Back not found, pls redo')
            return null
        }
        toMatch = articleText.slice(offset, matchsBack[0].posText + tempSnip.snipb.text.length - 1).trim()
        tempSnip.snipf.posText = -1
    } else {
        // Get Old Front in this text
        var selTextWords = cleanUpText(tempSnip.snipf.text).split(" ")
        const matchsFront = matchWordArray(selTextWords, articleText)
        if (matchsFront.length != 1) {
            console.log(`EditArticle handleDrop Old Front Snip Not Found "%s" `, tempSnip.snipf.text)
            toast.error('Old Snip Front not found, pls redo')
            return null
        }
        while (offset < articleText.length && /\w/.test(articleText[offset - 1])) offset++;
        toMatch = articleText.slice(matchsFront[0].posText, offset).trim()
        tempSnip.snipb.posText = -1
    }
    articleSnips[snipChange] = { ...emptySnip } // Stop check against self
    const snip = getSnipFrontBack(tempSnip, toMatch)
    if (typeof snip == 'boolean') return null
    articleSnips[snipChange] = { ...snip }
    loadArticleText()
    // Sets articleSnipsOld = []
    snipSelAction('endDrag', '')
    updSnip = { ...snip };
    articleSnips[snipChange] = { ...updSnipOld }
    console.log(`EditArticle handleDrop Inserted %s`, snipEdge)
}
// Have selected a snip but want to revert
function revertChange() {
    console.log(`EditArticle cancelChange %s`, snipChange)
    if (Object.keys(updSnipOld).length > 0) {
        articleSnips[snipChange] = { ...updSnipOld }
        console.log(`EditArticle cancelChange Revert %s`, JSON.stringify(updSnipOld))
    } else {
        articleSnips.splice(snipChange, 1)
    }
    snipChange = -1
    loadArticleText()
    // Sets  updSnipOld = {} updSnip = {} articleSnipsOld = []
    snipSelAction('ended', '')
}
//
function removeSnip() {// Remove snip
    articleSnips.splice(snipChange, 1)
    const removeText = snipedText.value.splice(snipChange, 1)
    console.log(`EditArticle removeSnip Remove "%s", %s`, removeText, JSON.stringify(articleSnips))
    snipChange = -1
    loadArticleText()
    updateSelectedText()
}
// After handles have been moved - get the updated Snip
function updateSnip() {
    console.log(`EditArticle updateSnip %s Snip "%s" to "%s"`, snipChange, JSON.stringify(updSnipOld), JSON.stringify(updSnip))
    articleSnips[snipChange] = { ...updSnip }
    snipChange = -1
    loadArticleText()
    // updSnipOld = {}  updSnip = {}
    snipSelAction('ended', 'update')
    disableUpdate.value = false
}
//
function updateSelectedText() {
    console.log(`EditArticle updateSelectedText %s`, snipedText.value.length)
    copySelectedText()
    if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
        deleteSelectedTextDisabled.value = false
        userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = "Copied Text"
    }
    // Clears snipUpOld, updSnip
    snipSelAction('ended', '')
}
function copySelectedText() {
    console.log(`EditArticle copySelectedText %s`, snipedText.value.length)
    userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = ''
    for (var text of snipedText.value) {
        if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
            userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText += '\n' + text
        } else {
            userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = text
        }
    }
}
//
function cancelUpdateSelected() {
    console.log(`EditArticle cancelUpdateSelected %s`, JSON.stringify(articleSnipsOld))
    articleSnips = [...articleSnipsOld];
    loadArticleText()
    // updSnipOld = {} updSnip = {} articleSnipsOld = []
    snipSelAction('ended', '')
}
//
function deleteSelectedText() {
    userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = "Created"
    userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = ''
    deleteSelectedTextDisabled.value = true;
    userData.viewedArticles[idxViewed.value].ViewedArticleSnips = ''
    snipedText.value.length = 0
    articleSnips.length = 0
    console.log(`EditArticle deleteSelectedText %s`, snipedText.value.length)
    loadArticleText()
    // updSnipOld = {} updSnip = {} articleSnipsOld = []
    snipSelAction('ended', '')
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
    const url = import.meta.env.VITE_SERVER_URL + "/dispArticle/newspaper/" + navStore.articleId + "/"
        + navStore.listId + "/" + !firstLoad;
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
    userData.viewedArticles[idxViewed.value].ViewedArticleSnips = JSON.stringify(articleSnips.map((sn) => ({ "snipf": sn.snipf.text.replaceAll('"', '|'), "snipb": sn.snipb.text.replaceAll('"', '|') })))
    var updatedData = {
        'troveUserId': userData.troveDetails.troveUserId,
        'listId': navStore.listId,
        'articleId': navStore.articleId,
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
    // Create clean Text for later
    cleanOriginalText = cleanUpText(userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText);
    loadArticleText();
    return
})
//  Set the popover hint and dropdown when Edit is started
watch(editMetadata, (newEditMetadata) => {
    if (newEditMetadata > -1) setupEditedFields(newEditMetadata)
    return
})
//  Enable Update Data Button
watch(() => userData.viewedArticles[idxViewed.value], () => {
    console.log('Change ViewedArticleSelectedText ', idxViewed.value)
    disableUpdate.value = false
    if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText == "Use Snips") copySelectedText()
}
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
function parseHTMLFragment(htmlString) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlString, 'text/html')
    return doc.body // detached DOM tree
}
// Create clean Text for later
cleanOriginalText = cleanUpText(userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText);
// console.log(`EditArticle loadArticleText Snips Front %s`, userData.viewedArticles[idxViewed.value].ViewedArticleSnips)
if (userData.viewedArticles[idxViewed.value].ViewedArticleSnips.length > 0) {
    console.log(`EditArticle Load %s`, userData.viewedArticles[idxViewed.value].ViewedArticleSnips)
    // const inSnipf = userData.viewedArticles[idxViewed.value].ViewedArticleSnips.replaceAll("snips", "snipf")
    // const inSnips = JSON.parse(inSnipf.replaceAll("snipe", "snipb"))
    const inSnips = JSON.parse(userData.viewedArticles[idxViewed.value].ViewedArticleSnips)
    for (let i = 0; i < inSnips.length; i++) {
        if ((inSnips[i].snipf.length > 0) && (inSnips[i].snipb.length > 0)) {
            const aSnip = {
                snipf: {
                    text: inSnips[i].snipf.replaceAll('|', '"'),
                    posText: -1
                },
                snipb: {
                    text: inSnips[i].snipb.replaceAll('|', '"'),
                    posText: -1
                }
            };
            articleSnips.push(aSnip)
        } else {
            console.log(`EditArticle ignore %s`, JSON.stringify(inSnips[i])) // ignore garbage
        }
    }
}
articleSnipsOld = [...articleSnips]; // Preserve for Cancel Select
console.log(`EditArticle Loaded articleSnips %s`, JSON.stringify(articleSnips))
loadArticleText();
loadArticle(true)
//
if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
    showTroveText.value = false;
    showSummaryText.value = true;
    deleteSelectedTextDisabled.value = false;
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
                                                    :disabled="userData.viewedArticles[idxViewed].ViewedArticlePossibleDupArticle.length == 0"
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
                                                    :disabled="userData.viewedArticles[idxViewed].ViewedArticleEntities.length == 0"
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
                                                <button :disabled="disableUpdate" @click.prevent="saveData"
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
                                <span>Trove Original Text</span>
                            </summary>
                            <div class="card text-center d-flex justify-content-center gap-2 p-2 flex-row">
                                <button @click.prevent="triggerSnipScroll" class="btn btn-primary"
                                    :disabled="articleSnips.length == 0">
                                    Scroll Snip
                                </button>
                                <button @click.prevent="triggerSearchScroll" class="btn btn-primary">
                                    Search
                                </button>
                                <span class="d-flex align-items-center">
                                    '{{ searchText }}' Occurs {{ searchTextCount }}
                                </span>
                                <button @click.prevent="showModalSearchText = true" class="btn btn-primary">
                                    Change
                                </button>
                                <Teleport to="#positionModals">
                                    <ModalSearchText v-if="showModalSearchText" @close="showModalSearchText = false"
                                        @chgSearch="markSearchText" :inSearchText="searchText" />
                                </Teleport>
                            </div>
                            <div class="card text-center">
                                <div v-if="showToolbar" class="d-flex justify-content-center gap-2 p-2">
                                    <button :disabled="snipCancelDisabled" @click.prevent="revertChange"
                                        class="btn btn-primary">
                                        Revert
                                    </button>
                                    <button :disabled="snipDropDisabled" @click.prevent="removeSnip()"
                                        class="btn btn-primary">
                                        Drop Snip
                                    </button>
                                    <button :disabled="snipUpdateDisabled" @click.prevent="updateSnip"
                                        class="btn btn-primary">
                                        Update Snip
                                    </button>
                                    <button :disabled="updSelectTextDisabled" @click.prevent="updateSelectedText"
                                        class="btn btn-primary">
                                        Update Selected Text
                                    </button>
                                    <button :disabled="cancelUpdTextDisabled" @click.prevent="cancelUpdateSelected"
                                        class="btn btn-primary">
                                        Cancel Update Text
                                    </button>
                                </div>
                                <div v-else>
                                    Select Text to Snip or Click a Snip to Modify
                                </div>
                            </div>
                            <div class="card">
                                <!-- <div @scroll="scrollHandler" @mouseup="snipHighlightedText" ref="articleRef" -->
                                <div @mouseup="snipHighlightedText" ref="articleRef" @click="activateHandles($event)"
                                    @dragstart="handleDragStart" @dragover.prevent class="card-body overflow-auto"
                                    style="max-height: 300px" @drop="handleDrop" id="textTrove">
                                    <span v-html="viewArticleText"></span>
                                </div>
                            </div>
                            <div class="card">
                                <div v-if="showToolbar" class="card-body overflow-auto" style="max-height: 300px">
                                    <pre class="preformatted-view" tabindex="1000">
                    <table>
                        <thead>
                            <tr>
                                <th>Nbr</th>
                                <th>Snip Text</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(snip, index) in snipedText" :key="index">
                                <td style="vertical-align: top;">{{ index + 1 }}</td>
                                <td><span class="wrapped-item">{{ snip }}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </pre>
                                </div>
                            </div>
                        </details>
                    </div>
                    <div class="row">
                        <details :open="showSelectedText">
                            <summary style="display: flex; justify-content: space-between; align-items: center;">
                                <span>Your Selected Text</span>
                                <button :disabled="deleteSelectedTextDisabled" @click.prevent="deleteSelectedText"
                                    class="btn btn-primary">
                                    Clear All Selected Text
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

th,
td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
    word-wrap: break-word;
    white-space: normal;
}

.wrapped-item {
    display: inline-block;
    padding: 2px 4px;
    background-color: #fff;
    border-radius: 4px;
}
</style>