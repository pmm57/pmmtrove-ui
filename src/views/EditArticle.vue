<script setup>
import ModalEntities from '@/components/ModalEntities.vue'
import ModalDuplicates from '@/components/ModalDuplicates.vue'
import EditItem from '@/components/EditItem.vue'
import ModalSearchText from '@/components/ModalSearchText.vue'
import { useDoFetch } from '@/components/DoFetch.js';
import { ref, watch, nextTick } from 'vue'
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useToast } from 'vue-toastification'
const toast = useToast()

navStore.articleHref = "/editArticle"
navStore.articleTabTitle = "Article " + navStore.articleId
//
const idxList = ref(0)
idxList.value = userData.userLists.findIndex((item) => item.TroveListId == navStore.listId);
const idxListArticle = ref(0)
idxListArticle.value = userData.userListArticles[idxList.value].findIndex((item) => item.TroveListArticleId == navStore.articleId);
const viewArticleText = ref('');
const searchText = ref('');
const searchTextCount = ref(0);
const showModalSearchText = ref(false)
const articleRef = ref(null);
const troveArticleRef = ref(null);
// Has it been viewed previously
const idxViewed = ref(0)
idxViewed.value = userData.viewedArticles.findIndex((viewedArticle) =>
    viewedArticle.ViewedArticleListId == navStore.listId &&
    viewedArticle.ViewedArticleId == navStore.articleId)
console.log(`EditArticle Start navStore.articleid:%s ListIdx:%s ListArticleIdx:%s ListArticleViewdIdx:%s  ViewedArticleId:%s`,
   navStore.articleId, idxList.value, idxListArticle.value, idxViewed.value, userData.viewedArticles[idxViewed.value].ViewedArticleId )
// console.log(`userData.viewedArticles:%s`, userData.viewedArticles)
const disableUpdate = ref(true)
const showModalEntities = ref(false)
const showModalDuplicates = ref(false)
const showTroveText = ref(true)
const showSelectedText = ref(true)
const showSummaryText = ref(false)
const editMetadata = ref(-1)
const notifyEditError = ref('inherit')
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
const activeScrollMode = ref(null);   // "search" | "snip"
const activeScrollIndex = ref(1);     // 1-based
var parsedArticleText = {}
var cleanOriginalText = ''
const emptySnip = { snipf: { text: '', posText: -1 }, snipb: { text: '', posText: -1 } };
var snipChange = -1
var articleSnips = [];
var articleSnipsOld = []
var updSnip = {}
var updSnipOld = {}
const snipedText = ref([])
const showToolbar = ref(false)
var manageAddIgnoreButtonText = 'Ignore Article'
var manageRemoveIgnoreButtonText = 'Remove Article from Ignore List'
const processingArticleActionDisable = ref(false)
const snipCancelDisabled = ref(true)
const snipDropDisabled = ref(true)
const snipUpdateDisabled = ref(true)
const updSelectTextDisabled = ref(true)
const cancelUpdTextDisabled = ref(true)
const deleteSelectedTextDisabled = ref(true)
const popoverForMetadata = ref('')
var savedMetadata = []
const arrayMetadataDropdown = ref([])
//
// Capture highlighted text in Trove Article
// Extract Snip Front and Back Edges
function snipHighlightedText() {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/snipHighlightedText ${uiId} entry`)
    
    var selection = window.getSelection();
    if (!selection.rangeCount) {
        console.log(`EditArticle/snipHighlightedText ${uiId} no selection range`)
        return;
    }

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const endNode = range.endContainer;

    if (startNode.nodeType !== Node.TEXT_NODE || endNode.nodeType !== Node.TEXT_NODE) {
        console.log(`EditArticle/snipHighlightedText ${uiId} not text node`)
        return;
    }

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
        console.log(`EditArticle/snipHighlightedText ${uiId} selected text too short:%s`, selectedText.length)
        selection.removeAllRanges();
        return false; // Just a click
    }
    console.log(`EditArticle/snipHighlightedText ${uiId} selected text:%s chars:%s`, selectedText.slice(0, 50), selectedText.length)
    const snip = getSnipFrontBack(emptySnip, selectedText, uiId)
    if ((typeof snip === 'boolean') && (!snip)) {
        console.log(`EditArticle/snipHighlightedText ${uiId} getSnipFrontBack returned false`)
        selection.removeAllRanges();
        return false;
    }
    articleSnips.push(snip);
    updSnip = { ...snip };
    updSnipOld = {}
    snipChange = articleSnips.length - 1
    console.log(`EditArticle/snipHighlightedText ${uiId} snip added at index:%s`, snipChange)
    // console.log(`EditArticle snipText Snips Out %s`, JSON.stringify(snips))
    loadArticleText(uiId)
    // Sets articleSnipsOld = []
    snipSelAction('endDrag', '')
    console.log(`EditArticle/snipHighlightedText ${uiId} exit`)
}
//
function getSnipFrontBack(inSnip, selectedText, uiId) {
    // Check snip long enough
    if (selectedText.length < 20) {
        console.log(`EditArticle/getSnipFrontBack ${uiId} Snip Not Long "%s"`, selectedText)
        toast.error('Snip to be longer then 20, pls redo')
        return false
    }
    const clean = ocrHygieneCore(selectedText)
    const selTextWords = clean.split(' ')
    const allText = userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText
    var snipf = inSnip.snipf
    if (snipf.posText < 0) {
        snipf = frontWordMatch(allText, 0, selTextWords, uiId) // Updates snipf.text, snipf.posText
        if (typeof snipf == 'boolean') {
            console.log(`EditArticle/getSnipFrontBack ${uiId} Front Snip Not Unique `)
            toast.error('Snip Front not unique, pls redo')
            return false
        }
    }
    var snipb = inSnip.snipb
    if (snipb.posText < 0) {
        snipb = backWordMatch(allText, snipf.posText, selTextWords, uiId) // Updates snipb.text, snipb.posText
        if (typeof snipb == 'boolean') {
            console.log(`EditArticle/getSnipFrontBack ${uiId} Back Snip Not Unique `)
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
        console.log(`EditArticle/getSnipFrontBack ${uiId} Snip %s Overlap Check %s`, JSON.stringify(snip), JSON.stringify(asnip))
        if (((snip.snipf.posText >= asnip.snipf.posText) && (snip.snipf.posText <= asnip.snipb.posText))
            || ((snip.snipb.posText >= asnip.snipf.posText) && (snip.snipb.posText <= asnip.snipb.posText))
            || ((snip.snipf.posText < asnip.snipf.posText) && (snip.snipb.posText > asnip.snipb.posText))) {
            console.log(`EditArticle/getSnipFrontBack ${uiId} Snip Overlap `)
            toast.error('Overlapping snip, pls redo')
            return false
        }
    }
    return snip
}
//
function frontWordMatch(allText, start, selTextWords, uiId) {
    var matchWords = 1
    do {
        const matchs = matchWordArray(selTextWords.slice(0, matchWords), allText)
        if (matchs.length == 0) {
            console.log(`EditArticle/frontWordMatch ${uiId} Selected Text Front NON Match "%s"`, selTextWords.slice(0, matchWords + 1))
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
    console.log(`EditArticle/frontWordMatch ${uiId} Selected Text Front Not Unique`)
    return false
}
function backWordMatch(allText, start, selTextWords, uiId) {
    var matchWords = selTextWords.length - 1
    do {
        const matchs = matchWordArray(selTextWords.slice(matchWords), allText)
        if (matchs.length == 0) {
            console.log(`EditArticle/backWordMatch ${uiId} Selected Text Back NON Match "%s"`, selTextWords.slice(matchWords))
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
    console.log(`EditArticle/backWordMatch ${uiId} Selected Text Back Not Unique`)
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
// Also exists in Backend
function ocrHygieneCore(text) {
  return text
    // hyphenated line breaks
    .replace(/-\s*\n\s*/g, " ")
    // normalize line breaks
    .replace(/\n+/g, " ")
    // OCR scan markers
    .replace(/\u25C0|\u25B6/g, "")
    // em-dash normalization
    .replace(/(\S)—(\S)/g, "$1 — $2")
    .replace(/(\S)—/g, "$1 —")
    .replace(/—(\S)/g, "— $1")
    // strip bidi, zero-width, soft hyphen
    .replace(/[\u200B-\u200D\uFEFF\u00AD\u202A-\u202E]/g, "")
    // normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}
// Ensure snips are unique returns posText
//
function loadArticleText(uiId = '') {
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
                let posFront = getInsertPos('front', snip.snipf.text, viewArticleText.value, uiId);
                // console.log(`EditArticle loadArticleText PreSnip posFront "%s"`, viewArticleText.value.slice(posFront.pos, posFront.pos + 10))
                let posBack = posFront.pos < 0 ? posFront : getInsertPos('back', snip.snipb.text, viewArticleText.value, uiId);
                // console.log(`EditArticle loadArticleText PreSnip posBack "%s"`, viewArticleText.value.slice(posBack.pos - 10, posBack.pos))
                // console.log(`EditArticle loadArticleText Snip %s posFront %s, posBack %s Text %s`, snipNbr, posFront.pos, posBack.pos, viewArticleText.value.length)
                snipNbr += 1
                if ((posFront.pos > -1) && (posBack.pos > posFront.pos)) {
                    snip.snipf.posText = posFront.pos
                    snip.snipb.posText = posBack.pos
                    const part1 = viewArticleText.value.slice(0, posFront.pos)
                    const part2 = viewArticleText.value.slice(posFront.pos, posBack.pos)
                    const part3 = viewArticleText.value.slice(posBack.pos)
                    const logMsg = `EditArticle/loadArticleText ${uiId} Snip %s posFront "%s" at %s "%s", posBack "%s" at %s "%s"`;
                    console.log(logMsg,
                        snipNbr, snip.snipf.text, posFront.pos, part2.slice(0, 50), snip.snipb.text, posBack.pos, part2.slice(-50))
                    if (snipChange == snipNbr) {
                        viewArticleText.value = part1 + spanHandleStart + part2 + spanHandleEnd + part3
                    } else {
                        const divSelect = divSelectConst.replace('x', snipNbr)
                        viewArticleText.value = part1 + cleanInsert('front', divSelect, posFront.nodeInfo, posBack.nodeInfo, uiId)
                            + part2 + cleanInsert('back', divEnd, posFront.nodeInfo, posBack.nodeInfo, uiId) + part3
                    }
                    updSnipedTextArray(snip, uiId)
                } else {
                    console.log(`EditArticle/loadArticleText ${uiId} Snip %s NOT FOUND %s`, snipNbr, JSON.stringify(snip))
                    toast.info('Snip not Found ' + (snipNbr + 1))
                    articleSnips.splice(snipNbr, 1)
                }
            }
            console.log(`EditArticle/loadArticleText ${uiId} Snips After Selects %s`, JSON.stringify(articleSnips))
        }
        // 
        if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText == "Use Snips") copySelectedText(uiId)
        markSearchText(false, userData.viewedArticles[idxViewed.value].ViewedArticleSearchWord, uiId)
    }
}
// Mark Search Text
function markSearchText(scrollFirst, searchTextIn, uiId = '') {
    // var doScroll = false;
    // if (searchText.value.length > 0) doScroll = true // We are changing the Search Text
    console.log(`EditArticle/markSearchText ${uiId} Search "%s", %s`, searchTextIn, viewArticleText.value.length)
    if (searchTextIn.length > 0) searchText.value = searchTextIn
    if (searchText.value.length == 0) return
    viewArticleText.value = viewArticleText.value.replaceAll(markSearch, "").replaceAll(markEnd, "");
    console.log(`EditArticle/markSearchText ${uiId} Search`, searchText.value, viewArticleText.value.length)
    var re = new RegExp("(" + searchText.value + ")", "gi");
    searchTextCount.value = (viewArticleText.value.match(re) || []).length;
    viewArticleText.value = viewArticleText.value.replace(re, function (matched) {
        // console.log("EditArticle markSearchText matched", matched)
        return markSearch + matched + markEnd
    })
    // console.log('EditArticle markSearchText Search After', viewArticleText.value.length)
    if (scrollFirst) {
        activeScrollMode.value = ''
        activeScrollIndex.value = 1
        triggerSearchScroll(uiId)
    }
}
// Find where to insert Snip Handles
function getInsertPos(snipEdge, match, text, uiId = '') {
    const cleanMatch = ocrHygieneCore(match)
    const matchWords = cleanMatch.split(' ')
    const regex = regxMatchWords(matchWords)
    var pos = text.search(regex)
    // console.log(`EditArticle getInsertPos match "%s" at %s`, cleanMatch, pos)
    if (pos < 0) {
        console.log(`EditArticle/getInsertPos ${uiId} NOT match "%s"`, cleanMatch)
        return { pos: -1 }
    }
    if (snipEdge == 'back') pos = pos + match.length
    // const front = (pos - 25) < 0 ? 0 : (pos - 25)
    // const back = (pos + 25) > text.length - 1 ? text.length - 1 : pos + 25
    // console.log(`EditArticle getInsertPos match "%s" and "%s"`, text.slice(front, pos), text.slice(pos, back))
    // Get the html node type and text
    const nodeInfo = findNodeInfo(snipEdge, cleanMatch, uiId)
    if (nodeInfo.edgeMatch) { //  encpsulate tag by adjusting pos
        const slideBy = snipEdge == 'front' ? -1 : 1
        const slideFor = snipEdge == 'front' ? '<' + nodeInfo.nodeType + '>' : '</' + nodeInfo.nodeType + '>'
        // console.log('EditArticle getInsertPos edgeMatch %s,"%s","%s"',
        //     nodeInfo.edgeMatch, nodeInfo.nodeText.slice(0, 10), nodeInfo.nodeText.slice(nodeInfo.nodeText.length - 10))
        const strStart = pos - 10 < 0 ? 0 : pos - 10
        const strEnd = pos + 10 > text.length ? text.length : pos + 10
        const chunk = snipEdge == 'front' ? text.slice(strStart, pos) : text.slice(pos, strEnd)
        const checkPtr = snipEdge == 'front' ? chunk.length - 1 : 0
        const slide = slidePos(slideBy, slideFor, checkPtr, chunk, uiId)
        var slideAdj = 0
        if (slide != 0) slideAdj = snipEdge == 'front' ? slide : slide + slideFor.length
        console.log(`EditArticle/getInsertPos ${uiId} slide %s`, slideAdj)
        pos = pos + slideAdj
    }
    // console.log('EditArticle getInsertPos Found "%s" in "%s" at %s Node Tag "%s"', match,
    //     text.slice(pos - match.length, pos) + "|" + text.slice(pos, pos + match.length), pos, nodeInfo.nodeTagStart)
    return { pos: pos, nodeInfo: nodeInfo }
}
// Get Node where insert is to happen
function findNodeInfo(snipEdge, match, uiId = '') {
    // Create html portion to find node at insert point
    const matchStr = match.replaceAll(" ", "")
    parsedArticleText = parseHTMLFragment(viewArticleText.value)
    const walker = document.createTreeWalker(parsedArticleText, NodeFilter.SHOW_TEXT, null)
    while (walker.nextNode()) {
        var node = walker.currentNode
        var text = ocrHygieneCore(node.outerHTML || node.textContent || '')
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
    console.log(`EditArticle/findNodeInfo ${uiId} NOT FOUND "%s" at Edge`, matchStr)
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
    // const tag1 = snipEdge == "front" ? nodeInfoStart.nodeTagEnd : nodeInfoEnd.nodeTagEnd
    // const tag2 = snipEdge == "front" ? nodeInfoStart.nodeTagStart : nodeInfoEnd.nodeTagStart
    // console.log(`EditArticle cleanInsert pos %s, %s-%s-%s`, snipEdge, tag1, handle, tag2)
    return tagStart + handle + tagEnd
}
//
function slidePos(slideBy, slideFor, checkPtr, chunk, uiId = '') {
    console.log(`EditArticle/slidePos ${uiId} start slideBy %s, slideFor %s, checkPtr %s, chunk "%s", check "%s" `,
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
function updSnipedTextArray(thisSnip, uiId = '') {
    var selTextWords = ocrHygieneCore(thisSnip.snipf.text).split(" ")
    const matchsFront = matchWordArray(selTextWords, cleanOriginalText)
    if (matchsFront.length != 1) {
        console.log(`EditArticle/updSnipedTextArray ${uiId} Front Snip Not Found "%s" `, selTextWords)
        toast.error('Snip Front not unique to enable snip, pls redo')
        return false
    }
    selTextWords = ocrHygieneCore(thisSnip.snipb.text).split(" ")
    const matchsBack = matchWordArray(selTextWords, cleanOriginalText)
    if (matchsBack.length != 1) {
        console.log(`EditArticle/updSnipedTextArray ${uiId} Back Snip Not Found "%s" `, selTextWords)
        toast.error('Snip Back not unique to enable snip, pls redo')
        return false
    }
    const selectedText = cleanOriginalText.slice(matchsFront[0].posText, matchsBack[0].posText + thisSnip.snipb.text.length)
    snipedText.value.push(selectedText)
}
// Scroll to Search Word in Trove Article
function scrollTroveTextByWalker(container, span, searchTerm, searchTextCount = 1, uiId = '') {
    if (!searchTerm) return;
    // Use Range + TreeWalker to locate the text node
    console.log(`EditArticle/scrollTroveTextByWalker ${uiId} scroll:${searchTerm} event:${searchTextCount}`);
    const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
    let node;
    let matchNumber = 0;
    while ((node = walker.nextNode())) {
        const text = node.nodeValue || "";
        let startIndex = 0;
        while (true) {
            const index = text.indexOf(searchTerm, startIndex);
            if (index === -1) break;
            matchNumber += 1;
            // index = node.nodeValue.indexOf(searchTerm);
            if (matchNumber === searchTextCount) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + searchTerm.length);

                const rect = range.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                let offsetTop = rect.top - containerRect.top + container.scrollTop;
                // Adjust to scroll one line above
                const lineHeight = parseFloat(getComputedStyle(container).lineHeight) || 20;
                offsetTop = Math.max(0, offsetTop - lineHeight);
                container.scrollTo({
                    top: offsetTop,
                    left: 0,
                    behavior: "smooth",
                });
                return;
            }
            // continue searching within same node after this match
            startIndex = index + searchTerm.length;
        }
    }
    console.log(`EditArticle/scrollTroveText ${uiId} Not found %s, scrolling to top`, searchTerm);
    container.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
    });
}
//
function scrollTroveText(searchTerm, searchTextCount = 1, uiId = '') {
    const container = articleRef.value; // the .card-body div
    if (!container) return;

    const span = container.querySelector("span");
    if (!span) return;

    console.log(`EditArticle/scrollTroveText ${uiId} scroll event`);

    // 1) Prefer scrolling to <mark> hits if they exist
    if (activeScrollMode.value == 'search') {
        const marks = span.querySelectorAll("mark");
        if (marks.length) {
            // searchTextCount is 1-based, convert to 0-based index
            const target = Math.min(Math.max(searchTextCount - 1, 0), marks.length - 1);
            const el = marks[target];

            const rect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            let offsetTop = rect.top - containerRect.top + container.scrollTop;

            // Adjust to scroll one line above
            const lineHeight = parseFloat(getComputedStyle(container).lineHeight) || 20;
            offsetTop = Math.max(0, offsetTop - lineHeight);

            container.scrollTo({ top: offsetTop, left: 0, behavior: "smooth" });
            return marks.length;
        }
    }
    // 2) Fallback to text-node search
    scrollTroveTextByWalker(container, span, searchTerm, searchTextCount, uiId);
    return 0;
}
// 
function triggerSnipScroll(uiId = '') {
    if (!uiId) uiId = userData.getNextInteractionId()
    if (!articleRef.value) return
    if (articleSnips.length === 0) return
    console.log(`EditArticle/triggerSnipScroll ${uiId} Start Mode:${activeScrollMode.value} NbrSnips:${articleSnips.length} index:${activeScrollIndex.value}`);
    if ((activeScrollMode.value != 'snip') || (activeScrollIndex.value === articleSnips.length)) {
        activeScrollIndex.value = 1
        console.log(`EditArticle/triggerSnipScroll ${uiId} RESET Snip Index`);
    } else {
        // same trigger, same term → NEXT
        activeScrollIndex.value += 1;
        console.log(`EditArticle/triggerSnipScroll ${uiId} NEXT activeScrollIndex:${activeScrollIndex.value}`);
    }
    activeScrollMode.value = 'snip';
    console.log(`EditArticle/triggerSnipScroll ${uiId} index:${activeScrollIndex.value - 1}, text:${articleSnips[activeScrollIndex.value - 1].snipf.text}`);
    scrollTroveText(articleSnips[activeScrollIndex.value - 1].snipf.text, 1, uiId) // Always 1 as each snip is unique
}
//
function triggerSearchScroll(uiId = '') {
    if (!uiId) uiId = userData.getNextInteractionId()
    if (!articleRef.value) return
    if (searchText.value.length === 0) return
    if (activeScrollMode.value != 'search') {
        activeScrollIndex.value = 1
        console.log(`EditArticle/triggerSearchScroll ${uiId} RESET Snip Index`);
    } else {
        // same trigger, same term → NEXT
        activeScrollIndex.value += 1;
        console.log(`EditArticle/triggerSearchScroll ${uiId} NEXT activeScrollIndex:${activeScrollIndex.value}`);
    }
    activeScrollMode.value = 'search';
    console.log(`EditArticle/triggerSearchScroll ${uiId} index:${activeScrollIndex.value - 1}, text:${searchText.value}`);
    const markCount = scrollTroveText(searchText.value, activeScrollIndex.value, uiId);
    if ((markCount > 0) && (activeScrollIndex.value > markCount)) {
        activeScrollIndex.value = 1;
        scrollTroveText(searchText.value, activeScrollIndex.value, uiId);
    }
}
// Inject handles when snip is clicked
function activateHandles(event) {
    const uiId = userData.getNextInteractionId()
    const snipDiv = event.target.closest('.snip-block');
    if (!snipDiv || snipDiv.parentElement.classList.contains('snip-wrapper')) {
        console.log(`EditArticle/activateHandles ${uiId} not a snip-block, early return`)
        return;
    }
    snipChange = snipDiv.dataset.snipnbr
    updSnipOld = { ...articleSnips[snipChange] }  // Save Old
    console.log(`EditArticle/activateHandles ${uiId} entry snipIndex:%s, snip:%s`, snipChange, JSON.stringify(updSnipOld))
    loadArticleText(uiId)
    // Sets articleSnipsOld = []
    snipSelAction('selected', '')
    console.log(`EditArticle/activateHandles ${uiId} exit`)
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
    const uiId = userData.getNextInteractionId()
    // Sets articleSnipsOld = []
    snipSelAction('startDrag', '')
    const snipEdge = event.target.dataset.handle
    console.log(`EditArticle/handleDragStart ${uiId} entry snipEdge:%s`, snipEdge)
    event.dataTransfer.setData('text/plain', snipEdge)
    console.log(`EditArticle/handleDragStart ${uiId} drag initiated`)
}
// Handle drop to reposition handle
function handleDrop(event) {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/handleDrop ${uiId} entry`)
    const snipEdge = event.dataTransfer.getData('text/plain')
    const range = document.caretRangeFromPoint
        ? document.caretRangeFromPoint(event.clientX, event.clientY) : document.caretPositionFromPoint
            ? document.caretPositionFromPoint(event.clientX, event.clientY)
            : null

    if (!range) {
        console.log(`EditArticle/handleDrop ${uiId} no range found, exit`)
        return null
    }

    // var cleanOriginalText = ocrHygieneCore(userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText);
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(event.currentTarget)
    const articleText = preCaretRange.toString() // The full Article Text
    // console.log(`EditArticle handleDrop area "%s"`, preCaretRange.toString())
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    console.log(`EditArticle/handleDrop ${uiId} offset Text "%s"`, preCaretRange.toString())
    var offset = preCaretRange.toString().length // Where the handle was dropped in articleText
    // const start = Math.max(0, offset - 30);
    // const end = Math.min(articleText.length, offset + 30);
    var toMatch = ''
    var tempSnip = { ...updSnipOld }
    if (Object.keys(updSnipOld).length === 0) {
        tempSnip = { ...updSnip } // From text highlight
    }
    console.log(`EditArticle/handleDrop ${uiId} points Old start %s "%s", offset %s, Old end %s "%s"`,
        tempSnip.snipf.posText, tempSnip.snipf.text, offset, tempSnip.snipb.posText, tempSnip.snipb.text)
    if (snipEdge == 'front') {
        // Get new Front
        while (offset > 0 && /\w/.test(articleText[offset])) offset--;
        // Get Old back in this text
        var selTextWords = ocrHygieneCore(tempSnip.snipb.text).split(" ")
        const matchsBack = matchWordArray(selTextWords, articleText)
        if (matchsBack.length != 1) {
            console.log(`EditArticle/handleDrop ${uiId} Old Back Snip Not Found "%s" `, tempSnip.snipb.text)
            toast.error('Old Snip Back not found, pls redo')
            return null
        }
        toMatch = articleText.slice(offset, matchsBack[0].posText + tempSnip.snipb.text.length - 1).trim()
        tempSnip.snipf.posText = -1
    } else {
        // Get Old Front in this text
        var selTextWords = ocrHygieneCore(tempSnip.snipf.text).split(" ")
        const matchsFront = matchWordArray(selTextWords, articleText)
        if (matchsFront.length != 1) {
            console.log(`EditArticle/handleDrop ${uiId} Old Front Snip Not Found "%s" `, tempSnip.snipf.text)
            toast.error('Old Snip Front not found, pls redo')
            return null
        }
        while (offset < articleText.length && /\w/.test(articleText[offset - 1])) offset++;
        toMatch = articleText.slice(matchsFront[0].posText, offset).trim()
        tempSnip.snipb.posText = -1
    }
    articleSnips[snipChange] = { ...emptySnip } // Stop check against self
    const snip = getSnipFrontBack(tempSnip, toMatch, uiId)
    if (typeof snip == 'boolean') {
        console.log(`EditArticle/handleDrop ${uiId} getSnipFrontBack returned error`)
        return null
    }
    articleSnips[snipChange] = { ...snip }
    loadArticleText(uiId)
    // Sets articleSnipsOld = []
    snipSelAction('endDrag', '')
    updSnip = { ...snip };
    articleSnips[snipChange] = { ...updSnipOld }
    console.log(`EditArticle/handleDrop ${uiId} inserted %s, exit`, snipEdge)
}
// Have selected a snip but want to revert
function revertChange() {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/revertChange ${uiId} %s`, snipChange)
    if (Object.keys(updSnipOld).length > 0) {
        articleSnips[snipChange] = { ...updSnipOld }
        console.log(`EditArticle/revertChange ${uiId} reverting to old snip %s`, JSON.stringify(updSnipOld))
    } else {
        articleSnips.splice(snipChange, 1)
        console.log(`EditArticle/revertChange ${uiId} removing new snip at index %s`, snipChange)
    }
    snipChange = -1
    loadArticleText(uiId)
    // Sets  updSnipOld = {} updSnip = {} articleSnipsOld = []
    snipSelAction('ended', '')
    console.log(`EditArticle/revertChange ${uiId} exit`)
}
//
function removeSnip() {// Remove snip
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/removeSnip ${uiId} entry index:%s`, snipChange)
    articleSnips.splice(snipChange, 1)
    const removeText = snipedText.value.splice(snipChange, 1)
    console.log(`EditArticle/removeSnip ${uiId} removed text "%s", articleSnips now:%s`, removeText, JSON.stringify(articleSnips))
    snipChange = -1
    loadArticleText(uiId)
    updateSelectedText()
    console.log(`EditArticle/removeSnip ${uiId} exit`)
}
// After handles have been moved - get the updated Snip
function updateSnip() {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/updateSnip ${uiId} entry index:%s old:%s new:%s`, snipChange, JSON.stringify(updSnipOld), JSON.stringify(updSnip))
    articleSnips[snipChange] = { ...updSnip }
    snipChange = -1
    loadArticleText(uiId)
    // updSnipOld = {}  updSnip = {}
    snipSelAction('ended', 'update')
    disableUpdate.value = false
    console.log(`EditArticle/updateSnip ${uiId} update complete, disableUpdate set to false`)
}
//
function updateSelectedText() {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/updateSelectedText ${uiId} entry snipCount:%s`, snipedText.value.length)
    copySelectedText(uiId)
    if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
        deleteSelectedTextDisabled.value = false
        userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = "Copied Text"
        console.log(`EditArticle/updateSelectedText ${uiId} text copied, status set to "Copied Text"`)
    }
    // Clears snipUpOld, updSnip
    snipSelAction('ended', '')
    console.log(`EditArticle/updateSelectedText ${uiId} exit`)
}
function copySelectedText(uiId = null) {
    if (!uiId) uiId = userData.getNextInteractionId()
    console.log(`EditArticle/copySelectedText ${uiId} entry snipCount:%s`, snipedText.value.length)
    userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = ''
    for (var text of snipedText.value) {
        if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
            userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText += '\n' + text
        } else {
            userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = text
        }
    }
    console.log(`EditArticle/copySelectedText ${uiId} copied:%s`, userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length)
}
//
function cancelUpdateSelected() {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/cancelUpdateSelected ${uiId} entry articleSnipsOld:%s`, JSON.stringify(articleSnipsOld))
    articleSnips = [...articleSnipsOld];
    loadArticleText(uiId)
    // updSnipOld = {} updSnip = {} articleSnipsOld = []
    snipSelAction('ended', '')
    console.log(`EditArticle/cancelUpdateSelected ${uiId} reverted snips, exit`)
}
//
function deleteSelectedText() {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/deleteSelectedText ${uiId} entry`)
    userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = "Created"
    userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = ''
    deleteSelectedTextDisabled.value = true;
    userData.viewedArticles[idxViewed.value].ViewedArticleSnips = ''
    snipedText.value.length = 0
    articleSnips.length = 0
    console.log(`EditArticle/deleteSelectedText ${uiId} deleted, snipCount:%s`, snipedText.value.length)
    loadArticleText(uiId)
    // updSnipOld = {} updSnip = {} articleSnipsOld = []
    snipSelAction('ended', '')
    console.log(`EditArticle/deleteSelectedText ${uiId} exit`)
}
//
function openTroveArticle() {
    if (processingArticleActionDisable.value) return
    const url = userData.viewedArticles[idxViewed.value].ViewedArticleViewUrl
    window.open(url, "_blank")
}
//
// load of An Article - they will be SSE'd to App.vue
//
function loadArticle(firstLoad) {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/loadArticle ${uiId} entry firstLoad:%s articleId:%s`, firstLoad, navStore.articleId)
    
    if (!firstLoad) {
        console.log(`EditArticle/loadArticle ${uiId} not first load, disabling actions`)
        processingArticleActionDisable.value = true //  Cleared in watch(() => userData.viewedArticles[idxViewed.value]
    }
    
    const url = "/dispArticle/newspaper/" + navStore.articleId + "/"
        + navStore.listId + "/" + !firstLoad + "?uiInteractionId=" + encodeURIComponent(uiId);
    console.log(`EditArticle/loadArticle ${uiId} prepared url`);
    
    const options = {
        method: "get",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    console.log(`EditArticle/loadArticle ${uiId} sending request`);
    useDoFetch(`loadArticle ${uiId}`, url, options, uiId)
    console.log(`EditArticle/loadArticle ${uiId} request sent, exit`)
}
//  Post Article Id to Ignore
function manageIgnoredArticle(action = 'removeIgnore') {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/manageIgnoredArticle ${uiId} entry action:%s articleId:%s`, action, navStore.articleId)
    
    processingArticleActionDisable.value = true //  Cleared in watch(() => userData.viewedArticles[idxViewed.value]
    var param = {
        actionedArticlesInfo: {
            id: navStore.articleId,
            listId: navStore.listId,
            action: action
        },
        uiInteractionId: uiId
    };
    console.log(`EditArticle/manageIgnoredArticle ${uiId} prepared request:`, JSON.stringify(param));
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
        body: JSON.stringify(param)
    };
    console.log(`EditArticle/manageIgnoredArticle ${uiId} sending request`);
    useDoFetch(`Manage Ignored Articles ${uiId}`, "/saveDB/updateArticle/generalIgnore", options, uiId)
    console.log(`EditArticle/manageIgnoredArticle ${uiId} request sent`);
    if (action == 'addIgnore') {
        console.log(`EditArticle/manageIgnoredArticle ${uiId} action is addIgnore, navigating to Trove`)
        troveArticleRef.value.click(); // Take user to Trove
    }
    console.log(`EditArticle/manageIgnoredArticle ${uiId} exit`)
}
//  Post updated data and wait for response in reloadArticle
function saveData() {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/saveData ${uiId} entry articleId:%s`, navStore.articleId)
    
    // console.log("click updateData");
    userData.viewedArticles[idxViewed.value].ViewedArticleSnips = JSON.stringify(articleSnips.map((sn) => ({ "snipf": sn.snipf.text.replaceAll('"', '|'), "snipb": sn.snipb.text.replaceAll('"', '|') })))
    console.log(`EditArticle/saveData ${uiId} prepared snips`)
    
    var updatedData = {
        'troveUserId': userData.troveDetails.troveUserId,
        'listId': navStore.listId,
        'articleId': navStore.articleId,
        'articleMinedStatusText': userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText,
        'metadata': userData.viewedArticles[idxViewed.value].ViewedArticleMetadata,
        'selectedData': userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText,
        'selectedTextSnips': userData.viewedArticles[idxViewed.value].ViewedArticleSnips,
        'summaryData': userData.viewedArticles[idxViewed.value].ViewedArticleSummaryText,
        'uiInteractionId': uiId
    }
    if (updatedData.selectedData.length == 0) {
        console.log(`EditArticle/saveData ${uiId} selectedData empty, setting to None`)
        updatedData.selectedData = 'None';
    }
    if (updatedData.summaryData.length == 0) {
        console.log(`EditArticle/saveData ${uiId} summaryData empty, setting to None`)
        updatedData.summaryData = 'None';
    }
    console.log(`EditArticle/saveData ${uiId} data prepared`);
    // console.log (updatedData);
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
    console.log(`EditArticle/saveData ${uiId} sending request`);
    // console.log('EditArticle/SaveData ', JSON.stringify(options));
    useDoFetch(`saveArticle ${uiId}`, "/saveDB/updateArticle", options, uiId)
    console.log(`EditArticle/saveData ${uiId} request sent`)
    //
    disableUpdate.value = true
    console.log(`EditArticle/saveData ${uiId} disabled update button, exit`)
}
//
function changeMinedStatus(newMinedStatus) {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/changeMinedStatus ${uiId} entry newMinedStatus:%s`, newMinedStatus)
    
    userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = newMinedStatus
    console.log(`EditArticle/changeMinedStatus ${uiId} state updated`)
    
    disableUpdate.value = false
    console.log(`EditArticle/changeMinedStatus ${uiId} enabled save button, exit`)
}
//  Set the Article Original Text
watch(() => userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText, () => {
    // Create clean Text for later
    cleanOriginalText = ocrHygieneCore(userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText);
    loadArticleText();
    activeScrollMode.value = ''
    activeScrollIndex.value = 1
    triggerSearchScroll();
    return
})
//  Set the popover hint and dropdown when Edit is started
watch(editMetadata, (newEditMetadata) => {
    if (newEditMetadata > -1) setupEditedFields(newEditMetadata)
    return
})
//  Enable Update Data Button
watch(() => userData.viewedArticles[idxViewed.value], () => {
    const uiId = userData.getCurrentInteractionId()
    console.log(`EditArticle/Watch ${uiId} Change ViewedArticleSelectedText `, idxViewed.value)
    disableUpdate.value = false
    processingArticleActionDisable.value = false
    if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText == "Use Snips") copySelectedText(uiId)
})
//  reloaded
watch(() => userData.reloadedViewedArticle, () => {
    const uiId = userData.getCurrentInteractionId()
    console.log(`EditArticle/Watch ${uiId} reloadedViewedArticle`)
    disableUpdate.value = false
    if (userData.viewedArticles[idxViewed.value].ViewedArticleNote.length > 0) useViewedArticleNote ()
})
//
function useViewedArticleNote () {
    // Transfer ViwedArticleNote to if ViewedArticleSummaryText is blank
    // console.log (`EditArticle Load ViewedArticleNote:%s ViewedArticleSummaryText:%s`, 
    //     userData.viewedArticles[idxViewed.value].ViewedArticleNote.length,
    //     userData.viewedArticles[idxViewed.value].ViewedArticleSummaryText.length)
    if ((userData.viewedArticles[idxViewed.value].ViewedArticleSummaryText.length == 0)
    || (userData.viewedArticles[idxViewed.value].ViewedArticleSummaryText.startsWith("[Auto"))) {
        userData.viewedArticles[idxViewed.value].ViewedArticleSummaryText = userData.viewedArticles[idxViewed.value].ViewedArticleNote
        showTroveText.value = false;
        showSelectedText.value = false;
        showSummaryText.value = true;
        changeMinedStatus('Query')
    }
}
//
function setupEditedFields(index) {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/setupEditedFields ${uiId} entry index:%s`, index)
    popoverForMetadata.value = ''
    const metadataType = userData.viewedArticles[idxViewed.value].ViewedArticleMetadata[index][0]
    console.log(`EditArticle/setupEditedFields ${uiId} metadataType:%s`, metadataType)
    // Wait for DOM update, then focus on the new select field
    nextTick(() => {
        const thisId = "select-" + index
        const newSelect = document.getElementById(thisId);
        // console.log('Focus:', thisId, newSelect)
        if (newSelect) newSelect.focus();
    });
    if (metadataType.length == 0) {
        console.log(`EditArticle/setupEditedFields ${uiId} metadataType empty, exit`)
        return
    }
    // Popover
    switch (metadataType) {
        case 'Person':
            popoverForMetadata.value = popoverPersonMetadata
            console.log(`EditArticle/setupEditedFields ${uiId} popover set to Person`)
            break
        case 'EventDate':
        case 'OtherDate':
            popoverForMetadata.value = popoverDateMetadata
            console.log(`EditArticle/setupEditedFields ${uiId} popover set to Date`)
    }
    // Dropdown
    const metadata = userData.metadataTypeByMetadata.find((el) => el.metadataType === metadataType)
    // console.log ('setupEditedFields Change editMetadata ', JSON.stringify(metadata))
    arrayMetadataDropdown.value =  metadata ? metadata.arrayMetadata.map((el) => el.metadataValue) : []
    console.log(`EditArticle/setupEditedFields ${uiId} dropdown populated:%s items`, arrayMetadataDropdown.value.length)
    // console.log ('Change editMetadata ', arrayMetadataDropdown)
    // Wait for DOM update, then focus on the new select field
    nextTick(() => {
        const thisId = `value-${index}`
        document.getElementById(thisId)?.focus()
    });
    console.log(`EditArticle/setupEditedFields ${uiId} exit`)
    return
}
//
function addedEntityToMetadata(index) {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/addedEntityToMetadata ${uiId} entry index:%s`, index)
    editMetadata.value = Number(index)
    showModalEntities.value = false
    console.log(`EditArticle/addedEntityToMetadata ${uiId} entity added, modal closed`)
}
//
function updateMetadata(action, index) {
    const uiId = userData.getNextInteractionId()
    console.log(`EditArticle/updateMetadata ${uiId} entry action:%s index:%s`, action, index)
    
    notifyEditError.value = 'inherit';
    switch (action) {
        case 'Cancel':
            console.log(`EditArticle/updateMetadata ${uiId} Cancel branch`)
            editMetadata.value = -1;
            if (savedMetadata.value.length == 0) {
                console.log(`EditArticle/updateMetadata ${uiId} Cancel Add - splicing index %d`, index)
                userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.splice(index, 1);
            } else {
                console.log(`EditArticle/updateMetadata ${uiId} Cancel Edit - restoring saved`)
                userData.viewedArticles[idxViewed.value].ViewedArticleMetadata[index] = savedMetadata.value;
            }
            console.log(`EditArticle/updateMetadata ${uiId} cancel complete`)
            break;
        case 'Check':
            console.log(`EditArticle/updateMetadata ${uiId} Check branch index:%s`, index)
            var savedPopover = popoverForMetadata.value;
            var clickedRowCells = userData.viewedArticles[idxViewed.value].ViewedArticleMetadata[index];
            var message = checkMetadata(clickedRowCells, index);
            if (message.length > 0) {
                console.log(`EditArticle/updateMetadata ${uiId} Check validation failed: ${message}`)
                popoverForMetadata.value = message;
                notifyEditError.value = 'red';
            } else {
                console.log(`EditArticle/updateMetadata ${uiId} Check validation passed`)
                disableUpdate.value = false;
                editMetadata.value = -1;
                popoverForMetadata.value = savedPopover;
                // New Metadata Items are added from Sever
                console.log(`EditArticle/updateMetadata ${uiId} check complete`)
            }
            break;
        case 'Del':
            console.log(`EditArticle/updateMetadata ${uiId} Del branch index:%s`, index)
            userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.splice(index, 1);
            disableUpdate.value = false;
            console.log(`EditArticle/updateMetadata ${uiId} delete complete`)
            break;
        case 'Edit':
            console.log(`EditArticle/updateMetadata ${uiId} Edit branch index:%s`, index)
            if (index) {
                editMetadata.value = index;
                savedMetadata.value = userData.viewedArticles[idxViewed.value].ViewedArticleMetadata[index];
                console.log(`EditArticle/updateMetadata ${uiId} edit saved:%s`, JSON.stringify(savedMetadata.value))
            } else {
                editMetadata.value = userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.length - 1;
                savedMetadata.value = [];
                console.log(`EditArticle/updateMetadata ${uiId} edit last index`)
            }
            break;
        case 'New':
            console.log(`EditArticle/updateMetadata ${uiId} New branch`)
            var newMatadata = ['', '', 'Sel'];
            userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.splice(index + 1, 0, newMatadata);
            editMetadata.value = index + 1;
            console.log(`EditArticle/updateMetadata ${uiId} new complete newIndex:%s`, editMetadata.value)
            break;
        default:
            console.log(`EditArticle/updateMetadata ${uiId} default case (should not reach)`)
            break;
    }
}
// On clicking the check edit button, do row cell edit checks
function checkMetadata(clickedRowCells, index) {
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
            if (message.length == 0 && isDuplicateDate(clickedRowCells[1], index)) {
                message = 'Date already selected';
            }
            break;
    }
    return message
}
// True if the article publish date or another row already has the same date (EventDate and OtherDate both count)
function isDuplicateDate(dateStr, index) {
    var target = String(dateStr).trim();
    var pubDate = String(userData.viewedArticles[idxViewed.value].ViewedArticlePubDate ?? '').trim().slice(0, 10);
    if (pubDate === target) return true;
    return userData.viewedArticles[idxViewed.value].ViewedArticleMetadata.some(
        (row, i) => i !== index && (row[0] === 'EventDate' || row[0] === 'OtherDate') && String(row[1]).trim() === target
    );
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
            // var yearOfDeath = '';
            var givenNames = '';
            if (/^b.\d{4}-d.\d{4}/.test(givenNameParts[givenNameParts.length - 1])) {
                var arrayYear = givenNameParts.pop();
                // <!--console.log ('Validate Name has dob dod', arrayYear);-->
                yearOfBirth = arrayYear[0];
                // yearOfDeath = arrayYear[1];
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
cleanOriginalText = ocrHygieneCore(userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText);
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
activeScrollMode.value = ''
activeScrollIndex.value = 1
loadArticle(true)
//
if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
    showTroveText.value = false;
    showSelectedText.value = false;
    showSummaryText.value = true;
    deleteSelectedTextDisabled.value = false;
}
if (userData.viewedArticles[idxViewed.value].ViewedArticleNote.length > 0) useViewedArticleNote ()
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
                                Article Actions
                            </div>
                            <div class="card">
                                <div class="container-fluid">
                                    <div class="row">
                                        <div class="col">
                                            <div class="card">
                                                <button class="btn btn-primary" ref="troveArticleRef"
                                                    :disabled="processingArticleActionDisable" @click="openTroveArticle">
                                                    View Trove Article
                                                </button>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <div class="card">
                                                <button @click.prevent="loadArticle(false)"
                                                    :disabled="processingArticleActionDisable" class="btn btn-primary">Refresh
                                                    Trove Article</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col">
                                            <div class="card">
                                                <button v-if="processingArticleActionDisable" :disabled="processingArticleActionDisable"
                                                    class="btn btn-primary" data-bs-toggle="tooltip"
                                                    data-bs-placement="top"
                                                    title="Wait for Screen Refresh">Processing</button>
                                                <button
                                                    v-else-if="userData.viewedArticles[idxViewed].ViewedArticleIgnored"
                                                    :disabled="processingArticleActionDisable"
                                                    @click.prevent="manageIgnoredArticle()" class="btn btn-primary"
                                                    data-bs-toggle="tooltip" data-bs-placement="top"
                                                    title="View Article in Trove and remove from List OR Remove from Ignored">{{
                                                        manageRemoveIgnoreButtonText }}</button>
                                                <button v-else @click.prevent="manageIgnoredArticle('addIgnore')"
                                                    :disabled="processingArticleActionDisable" class="btn btn-primary"
                                                    data-bs-toggle="tooltip" data-bs-placement="top"
                                                    title="Add to Ignore List and View Article in Trove to remove from List">
                                                    {{ manageAddIgnoreButtonText }}</button>
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
                                Data Actions
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
                                <div class="card-body pre-scrollable" style="max-height: 35vh" id="troveNote"
                                    v-html="userData.viewedArticles[idxViewed].ViewedArticleNote || 'No Trove Note for Article'">
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="card-header text-center">
                                Your Meta Data
                            </div>
                            <div class="card-body overflow-auto" style="max-height: 35vh; line-height: 100%">
                                <!-- One datalist for the currently edited row -->
                                <datalist id="datalist-metadataValues" v-memo="[arrayMetadataDropdown]">
                                <option
                                    v-for="opt in arrayMetadataDropdown" :key="opt" :value="opt"/>
                                </datalist>
                                <table class="table table-bordered">
                                    <thead class="mbhead">
                                        <tr class="mbrow">
                                            <th>Type</th>
                                            <th>Value</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(articleMetadata, index) in userData.viewedArticles[idxViewed].ViewedArticleMetadata" :key="`${articleMetadata[0]}|${index}`">
                                            <template v-if="editMetadata > -1"> <!-- In Edit Mode-->
                                                <template v-if="editMetadata == index"> <!-- Row to Edit -->
                                                    <td> <!-- Metadata Type -->
                                                        <select v-model="articleMetadata[0]" :id="'select-' + index"
                                                            @change="setupEditedFields(editMetadata)">
                                                            <option v-for="option in userData.arrayMetadataTypes" :key="option"
                                                                :value="option">{{ option }}
                                                            </option>
                                                        </select>
                                                    </td>
                                                    <td class="metadataPopover"
                                                        :style="{ 'background-color': notifyEditError }">
                                                        <!-- Metadata Value -->
                                                        <input :id="`value-${index}`"
                                                            v-model="articleMetadata[1]" 
                                                           list="datalist-metadataValues"/>
                                                            <span v-if="popoverForMetadata.length > 0"
                                                                class="tooltiptext">{{ popoverForMetadata }}</span>
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
                                <button @click.prevent='triggerSnipScroll' class="btn btn-primary"
                                    :disabled="articleSnips.length == 0">
                                    Scroll Snip
                                </button>
                                <button @click.prevent='triggerSearchScroll' class="btn btn-primary">
                                    Scroll Search
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