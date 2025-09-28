<script setup>
import ModalEntities from '@/components/ModalEntities.vue'
import ModalDuplicates from '@/components/ModalDuplicates.vue'
import EditItem from '@/components/EditItem.vue'
import { ref, reactive, watch, nextTick } from 'vue'
import { useUserDataStore } from '@/stores/userdata'
const userData = useUserDataStore()
import { useNavBarStore } from '@/stores/navbar'
const navStore = useNavBarStore()
import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
import { useToast } from 'vue-toastification'
const toast = useToast()
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
    // const snipDiv = event.currentTarget

    // console.log(`EditArticle snipHighlightedText`, snipDiv)
    // if (snipDiv.querySelector('.snip-block')) return // Within Snip
    const selection = window.getSelection()
    var selectedText = selection.toString()
    if (selectedText.length < 3) return false;
    const snip = getSnip(selectedText)
    if ((typeof snip === 'boolean') && (!snip)) return false;
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
function getSnip(selectedText) {
    // Check snip long enough
    if (selectedText.length < 20) {
        console.log(`EditArticle getSnip Snip Not Long "%s"`, selectedText)
        toast.error('Snip to be longer then 20, pls redo')
        return false
    }
    const snip = {
        snipf: getSnipText(selectedText, 5),// Updates snipf.text, snipf.posText
        snipb: getSnipText(selectedText, -5)// Updates snipb.text, snipb.posText
    };
    console.log(`EditArticle getSnip Snip %s`, JSON.stringify(snip))
    // Check snip  is unique
    if ((snip.snipf.posText < 0) || (snip.snipb.posText < 0)) {
        console.log(`EditArticle getSnip Snip Not Unique `)
        toast.error('Snip not unique, pls redo')
        return false
    }
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
// Standardise the text
function cleanUpText(inText) {
    inText = inText.replace(/-\n/g, " ");
    inText = inText.replace(/- /g, "");
    inText = inText.replace(/\n/g, " ");
    inText = inText.replace(/\u25C0/g, "");
    inText = inText.replace(/\u25B6/g, "");

    // Strip HTML
    const temp = document.createElement("div");
    temp.innerHTML = inText;
    let cleanUpText = temp.textContent || temp.innerText || "";

    // Normalize whitespace and strip invisible characters
    cleanUpText = cleanUpText.replace(/[\u200B-\u200D\uFEFF\u00AD\u202A-\u202E]/g, '');
    cleanUpText = cleanUpText.replace(/\s+/g, ' ').trim();

    return cleanUpText;
}
// Ensure snips are unique returns posText
function getSnipText(selText, len) {
    const maxTry = selText.length
    console.log(`Article Text Front "%s" Back "%s"`, cleanOriginalText.slice(0, 20), cleanOriginalText.slice(-20))
    selText = cleanUpText(selText)
    // console.log (`Selected Text Front "%s" Back "%s"`, selText.slice(0, 20), selText.slice(-20))
    let done = false;
    var tryMatch = 0
    var snipText = len < 0 ? selText.slice(len) : selText.slice(0, len);
    let pos1 = -1
    do {
        console.log(`EditArticle getSnipText Len %s snipText "%s"`, len, snipText)
        pos1 = cleanOriginalText.indexOf(snipText);
        let pos2 = -1
        if ((pos1 + snipText.length - 1) < cleanOriginalText.length) {
            pos2 = cleanOriginalText.indexOf(snipText, pos1 + snipText.length - 1);
        }
        console.log(`EditArticle getSnipText Match pos1 %s pos2 %s`, pos1, pos2)
        if ((pos1 < 0) || (pos2 > 0)) {
            console.log(`EditArticle getSnipText Extend pos1 %s, pos2 %s, check "%s"`, pos1, pos2, snipText)
            tryMatch += 1
            if (tryMatch < maxTry) {
                len = len < 0 ? len - 1 : len + 1;
                snipText = len < 0 ? selText.slice(len) : selText.slice(0, len);
                console.log(`EditArticle getSnipText try %s, "%s"`, tryMatch, snipText)
                continue
            } else {
                pos1 = -1;
                console.log(`EditArticle getSnipText NOT Unique "%s"`, snipText)
            }
        }
        if (pos1 >= 0) {
            console.log(`EditArticle getSnipText Found one "%s"`, snipText)
        } else {
            pos1 = -1;
            console.log(`EditArticle getSnipText NOT FOUND "%s"`, snipText)
        }
        done = true
    } while (!done);
    return { text: snipText, posText: pos1 }
}
//
function loadArticleText() {
    console.log('EditArticle loadArticleText length', userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText.length)
    if (userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText.length > 0) {
        viewArticleText.value = userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText;
        if (articleSnips.length > 0) {
            snipedText.value = []
            // Mark Selected Text
            console.log(`EditArticle loadArticleText Snips Before %s`, JSON.stringify(articleSnips))
            var snipNbr = -1;
            for (let snip of articleSnips) {
                if (snip.snipf.text.length == 0) continue;
                // const startAt = cleanOriginalText.indexOf(snip.snipf.text)
                let pos1 = getInsertPos('front', 0, snip.snipf.text, viewArticleText.value);
                // console.log(`EditArticle loadArticleText PreSnip Pos1 "%s"`, viewArticleText.value.slice(pos1.pos, pos1.pos + 10))
                let pos2 = pos1 < 0 ? -1 : getInsertPos('back', pos1.pos + snip.snipf.text.length, snip.snipb.text, viewArticleText.value);
                // console.log(`EditArticle loadArticleText PreSnip Pos2 "%s"`, viewArticleText.value.slice(pos2.pos - 10, pos2.pos))
                // console.log(`EditArticle loadArticleText Snip %s Pos1 %s, Pos2 %s Text %s`, snipNbr, pos1.pos, pos2.pos, viewArticleText.value.length)
                snipNbr += 1
                if ((pos1.pos > -1) && (pos2.pos > pos1.pos)) {
                    const part1 = viewArticleText.value.slice(0, pos1.pos)
                    const part2 = viewArticleText.value.slice(pos1.pos, pos2.pos)
                    const part3 = viewArticleText.value.slice(pos2.pos)
                    console.log(`EditArticle loadArticleText Snip %s Pos1 %s "%s", Pos2 %s "%s"`, snipNbr, pos1.pos, part2.slice(0, 50), pos2.pos, part2.slice(-50))
                    if (snipChange == snipNbr) {
                        viewArticleText.value = part1 + spanHandleStart + part2 + spanHandleEnd + part3
                    } else {
                        const divSelect = divSelectConst.replace('x', snipNbr)
                        viewArticleText.value = part1 + cleanInsert('front', divSelect, pos1.nodeInfo, pos2.nodeInfo)
                            + part2 + cleanInsert('back', divEnd, pos1.nodeInfo, pos2.nodeInfo) + part3
                    }
                    updSnipedTextArray(snip)
                } else {
                    console.log(`EditArticle loadArticleText Snip %s NOT FOUND %s`, snipNbr, JSON.stringify(snip))
                    toast.info('Snip not Found ' + (snipNbr + 1))
                }
            }
            // console.log(`EditArticle loadArticleText Snips After Selects %s`, JSON.stringify(articleSnips))
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
// Find where to insert Snip Handles
function getInsertPos(snipEdge, start, match, text) {
    // const matchWords = match.split("")
    var pos = text.indexOf(match, start)
    console.log(`EditArticle getInsertPos match "%s" from %s at %s`, match, start, pos)
    if (pos < 0) {
        console.log(`EditArticle getInsertPos NOT match "%s" in "%s" length %s`, match, text.slice(start), text.length)
        return { pos: -1 }
    }
    if (snipEdge == 'back') pos = pos + match.length
    const front = (pos - 25) < 0 ? 0 : (pos - 25)
    const back = (pos + 25) > text.length - 1 ? text.length - 1 : pos + 25
    console.log(`EditArticle getInsertPos match "%s" and "%s"`, text.slice(front, pos), text.slice(pos, back))
    // Get the html node type and text
    const nodeInfo = findNodeInfoByMatch(snipEdge, match)
    if (nodeInfo.edgeMatch) { //  encpsulate tag by adjusting pos
        const slideBy = snipEdge == 'front' ? -1 : 1
        const slideFor = snipEdge == 'front' ? nodeInfo.nodeTagStart : nodeInfo.nodeTagEnd
        console.log('EditArticle getInsertPos edgeMatch %s,"%s","%s"',
            nodeInfo.edgeMatch, nodeInfo.nodeText.slice(0, 10), nodeInfo.nodeText.slice(nodeInfo.nodeText.length - 10))
        nodeInfo.nodeTagStart = ''
        nodeInfo.nodeTagEnd = ''
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
    console.log('EditArticle getInsertPos Found "%s" in "%s" at %s Node Tag "%s"', match,
        text.slice(pos - match.length, pos) + "|" + text.slice(pos, pos + match.length), pos, nodeInfo.nodeTagStart)
    return { pos: pos, nodeInfo: nodeInfo }
}
function sliceMatch(snipEdge, start, match, text) {
    // const chunkSize = match.length;
    // const matchStr = match.replace(/[^a-zA-Z0-9]/g, "\u2423");
    // // Step 1: Extract unique non-alphanumeric characters
    const preserveSet = new Set(match.match(/[^a-zA-Z0-9]/g));
    // Step 2: Build a regex that excludes preserved characters
    const preserve = Array.from(preserveSet).join('');
    const escapedPreserve = preserve.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    const regexPreserve = new RegExp(`[^a-zA-Z0-9${escapedPreserve}]`, 'g');
    // Step 3: Replace only non-preserved non-alphanumerics with ␣
    const matchStr = match.replace(regexPreserve, "\u2423");
    const chunkSize = matchStr.length + 10;
    var regex = new RegExp("^" + matchStr);
    if (snipEdge == 'back') regex = new RegExp(matchStr + "$")
    var sliceText = ''
    console.log('EditArticle sliceMatch START type %s start %s for "%s"', snipEdge, start, matchStr)
    for (let i = start; i <= text.length; i++) {
        var expand = 0
        sliceText = text.slice(i, i + chunkSize + expand).replace(regexPreserve, "\u2423");
        // while (sliceText.length < matchStr.length) {
        //     sliceText = text.slice(i, i + chunkSize + expand).replace(/[^a-zA-Z0-9]/g, "|");
        //     // const cleaned = input.replace(/^.*?>\s*/, '');
        //     // console.log(`EditArticle sliceMatch at %s expand %s "%s"`, i, expand, sliceText)
        //     ++expand
        //     if (expand > matchStr.length) {
        //         // console.log(`EditArticle sliceMatch at Char %s expand %s "%s"`, i, expand, sliceText)
        //         break
        //     }
        // }
        // console.log(`EditArticle sliceMatch at Char %s "%s"`, i, sliceText)
        if (regex.test(sliceText)) {
            //     var shrink = 5
            //     var adjustInsert = -1
            //     // Adjust for cleaned characters
            //     // console.log(`EditArticle sliceMatch at Char %s "%s"`, i, text.slice(i, i + chunkSize + expand))
            //     do {
            //         adjustInsert = text.slice(i, i + chunkSize + expand).indexOf(match.slice(0, shrink))
            //         // console.log(`EditArticle sliceMatch adjust %s on "%s"`, adjustInsert, match.slice(0, shrink))
            //         --shrink;
            //     } while ((adjustInsert < 0) && (shrink > 0))
            //     var pos = i + adjustInsert
            var pos = i
            if (snipEdge == 'back') pos = pos + chunkSize
            console.log(`EditArticle sliceMatch match "%s" in "%s" at %s of "%s" and "%s"`, matchStr, sliceText, pos, text.slice(pos - 25, pos), text.slice(pos, pos + 25))
            // Get the html node type and text
            const nodeInfo = findNodeInfoByMatch(snipEdge, match)
            if (nodeInfo.edgeMatch) { //  encpsulate tag by adjusting pos
                const slideBy = snipEdge == 'front' ? -1 : 1
                const slideFor = snipEdge == 'front' ? nodeInfo.nodeTagStart : nodeInfo.nodeTagEnd
                console.log('EditArticle sliceMatch edgeMatch %s,"%s","%s"',
                    nodeInfo.edgeMatch, nodeInfo.nodeText.slice(0, 10), nodeInfo.nodeText.slice(nodeInfo.nodeText.length - 10))
                nodeInfo.nodeTagStart = ''
                nodeInfo.nodeTagEnd = ''
                const strStart = pos - 10 < 0 ? 0 : pos - 10
                const strEnd = pos + 10 > text.length ? text.length : pos + 10
                const chunk = snipEdge == 'front' ? text.slice(strStart, pos) : text.slice(pos, strEnd)
                const checkPtr = snipEdge == 'front' ? chunk.length - 1 : 0
                const slide = slidePos(slideBy, slideFor, checkPtr, chunk)
                var slideAdj = 0
                if (slide != 0) slideAdj = snipEdge == 'front' ? slide : slide + slideFor.length
                console.log('EditArticle sliceMatch slide %s', slideAdj)
                pos = pos + slideAdj
            }
            console.log('EditArticle sliceMatch Found "%s" in "%s" at %s Node Tag "%s"', match, text.slice(i, i + chunkSize), pos, nodeInfo.nodeTagStart)
            return { pos: pos, nodeInfo: nodeInfo }
        }
    }
    console.log('EditArticle sliceMatch NOT found "%s", "%s"', match, sliceText)
    return { pos: -1 }
}
// Get Node where insert is to happen
function findNodeInfoByMatch(snipEdge, match) {
    // Create html portion to find node at insert point
    const matchStr = match.replaceAll(" ", "")
    parsedArticleText = parseHTMLFragment(viewArticleText.value)
    const walker = document.createTreeWalker(parsedArticleText, NodeFilter.SHOW_TEXT, null)
    let nodesWalked = 0
    let nodeText = ''
    let nodeTexts = []
    while (walker.nextNode()) {
        var node = walker.currentNode
        var text = cleanUpText(node.outerHTML || node.textContent || '')
        nodeTexts.push({ node: node, nodeText: text })
        nodeText += text.replaceAll(" ", "")
        ++nodesWalked
        const matchIndex = nodeText.indexOf(matchStr)
        // console.log('EditArticle findNodeInfoByMatch Walk %s match "%s" in "%s" at %s', nodesWalked, matchStr, nodeText, matchIndex)
        if (matchIndex > -1) {
            var edgeMatch = false;
            var textStr = text.replaceAll(" ", "")
            if (snipEdge == 'front') {
                // Find which node the front starts in
                while (textStr.indexOf(matchStr) < 0) {
                    const aNodeText = nodeTexts.pop()
                    node = aNodeText.node
                    textStr = aNodeText.nodeText.replaceAll(" ", "") + textStr
                    console.log('EditArticle findNodeInfoByMatch Find Front of string Node Check %s "%s"', nodesWalked, textStr)
                    --nodesWalked
                    if (nodesWalked < 1) break
                }
                edgeMatch = textStr.startsWith(matchStr)
            } else {
                // snipEdge is back - check if it is at back of node text
                console.log('EditArticle findNodeInfoByMatch Find Back of string Node Check %s "%s"', nodesWalked, textStr)
                edgeMatch = textStr.endsWith(matchStr)
            }
            var tagStart = ''
            var tagEnd = ''
            var nodeType = node.parentElement?.tagName?.toLowerCase()
            if (['p', 'span'].includes(nodeType)) {
                tagStart = '<' + nodeType + '>'
                tagEnd = '</' + nodeType + '>'
            }
            console.log('EditArticle findNodeInfoByMatch checked %s Node Type %s Node Front "%s" Back "%s" edgeMatch %s',
                nodesWalked, nodeType, node.textContent.slice(0, 20), node.textContent.slice(text.length - 20), edgeMatch)
            return {
                edgeMatch: edgeMatch,
                nodeTagStart: tagStart,
                nodeTagEnd: tagEnd,
                nodeText: node.textContent
            }
        }
    }
    console.log('EditArticle findNodeInfoByMatch NOT FOUND "%s"', matchStr)
    return { edgeMatch: false, nodeTagStart: '', nodeTagEnd: '', nodeText: '' }
}
//
function cleanInsert(snipEdge, handle, nodeInfoStart, nodeInfoEnd) {
    // console.log(`EditArticle cleanInsert Front %s, Back %s`, JSON.stringify(nodeInfoStart), JSON.stringify(nodeInfoEnd))
    if (snipEdge == "front") {
        if (nodeInfoStart.nodeText === nodeInfoEnd.nodeText) { // No need to wrap text
            nodeInfoStart.nodeTagEnd = ''
        }
    } else {
        if (nodeInfoStart.nodeText === nodeInfoEnd.nodeText) { // No need to wrap text
            nodeInfoEnd.nodeTagStart = ''
        }
    }
    const tag1 = snipEdge == "front" ? nodeInfoStart.nodeTagEnd : nodeInfoEnd.nodeTagEnd
    const tag2 = snipEdge == "front" ? nodeInfoStart.nodeTagStart : nodeInfoEnd.nodeTagStart
    // console.log(`EditArticle cleanInsert pos %s, %s-%s-%s`, snipEdge, tag1, handle, tag2)
    return tag1 + handle + tag2
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
    console.log('EditArticle loadArticleText slidePos found %s at %s', slideFor, slide)
    return slide;
}
//
function updSnipedTextArray(thisSnip) {
    const cleanSource = cleanUpText(userData.viewedArticles[idxViewed.value].ViewedArticleOriginalText)
    const posStart = cleanSource.indexOf(thisSnip.snipf.text)
    const snipEdge = cleanSource.indexOf(thisSnip.snipb.text) + thisSnip.snipb.text.length
    const selectedText = cleanSource.slice(posStart, snipEdge)
    snipedText.value.push(selectedText)
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
    console.log(`EditArticle snipSelAction %s, %s`, actionSnip, actionText)
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
    const offset = preCaretRange.toString().length // Where the handle was dropped in articleText
    const start = Math.max(0, offset - 30);
    const end = Math.min(articleText.length, offset + 30);
    console.log(`EditArticle handleDrop points start %s, offset %s, end %s`, start, offset, end)
    const toMatch = snipEdge == 'front' ? articleText.slice(offset, end) : articleText.slice(start, offset)
    // // Get Node
    // const nodeMatch = findNodeInfoByMatch(snipEdge, toMatch)
    // console.log(`EditArticle handleDrop Match "%s" Node "%s"`, toMatch, JSON.stringify(nodeMatch))
    // Check it is a valid snip
    updSnip = { ...updSnipOld } // Basis for updating
    console.log(`EditArticle handleDrop Old "%s"`, JSON.stringify(updSnip))
    if (snipEdge == 'front') {
        // Update Front
        console.log(`EditArticle handleDrop start "%s"`, toMatch)
        updSnip.snipf = getSnipText(toMatch, 5)
        if (updSnip.snipf.posText < 0) return
        // Update back - updSnip.snipb.text is unique
        updSnip.snipb.posText = cleanOriginalText.indexOf(updSnip.snipb.text)
        if (updSnip.snipb.posText < 0) {
            console.log(`EditArticle handleDrop updSnip.snipb.text Error %s`, JSON.stringify(updSnip))
        }
        updSnip.snipb.posText += updSnip.snipb.text.length
    } else {
        console.log(`EditArticle handleDrop end "%s"`, toMatch)
        updSnip.snipb = getSnipText(toMatch, -5)
        if (updSnip.snipb.posText < 0) return
        // Update Front - updSnip.snipf.text is unique
        // Adjust for length of snipb
        updSnip.snipb.posText += updSnip.snipb.text.length - 1
        updSnip.snipf.posText = cleanOriginalText.indexOf(updSnip.snipf.text)
        if (updSnip.snipf.posText < 0) {
            console.log(`EditArticle handleDrop updSnip.snipf.text Error %s`, JSON.stringify(updSnip))
        }
    }
    console.log(`EditArticle handleDrop New Texts %s`, JSON.stringify(updSnip))
    const selectedText = cleanOriginalText.slice(updSnip.snipf.posText, updSnip.snipb.posText)
    console.log(`EditArticle handleDrop Text "%s"`, selectedText)
    let snip = { snipf: { text: '' } };
    articleSnips[snipChange] = { ...snip } // Stops checking against itself in getSnip
    updSnip = getSnip(selectedText)
    if ((typeof snip === 'boolean') && (!snip)) return false;
    console.log(`EditArticle handleDrop snip %s`, JSON.stringify(updSnip))
    articleSnips[snipChange] = { ...updSnip }
    loadArticleText()
    // Sets articleSnipsOld = []
    snipSelAction('endDrag', '')
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
    userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = ''
    for (var text of snipedText.value) {
        if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
            userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText += '\n' + text
        } else {
            userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText = text
        }
    }
    if (userData.viewedArticles[idxViewed.value].ViewedArticleSelectedText.length > 0) {
        deleteSelectedTextDisabled.value = false
        userData.viewedArticles[idxViewed.value].ViewedArticleMinedStatusText = "Copied Text"
    }
    // Clears snipUpOld, updSnip
    snipSelAction('ended', '')
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
    userData.viewedArticles[idxViewed.value].ViewedArticleSnips = JSON.stringify(articleSnips.map((sn) => ({ "snipf": sn.snipf.text, "snipb": sn.snipb.text })))
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
    const inSnipf = userData.viewedArticles[idxViewed.value].ViewedArticleSnips.replaceAll("snips", "snipf")
    const inSnips = JSON.parse(inSnipf.replaceAll("snipe", "snipb"))
    for (let i = 0; i < inSnips.length; i++) {
        if ((inSnips[i].snipf.length > 0) && (inSnips[i].snipb.length > 0)) {
            const aSnip = {
                snipf: {
                    text: inSnips[i].snipf,
                    posText: -1
                },
                snipb: {
                    text: inSnips[i].snipb,
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
                                <span>Trove Original Text</span>
                            </summary>
                            <div class="card text-center">
                                Search Word ({{ userData.viewedArticles[idxViewed].ViewedArticleSearchWord }}) Occurs {{
                                    userData.viewedArticles[idxViewed].ViewedArticleFoundCount }}
                            </div>
                            <div class="card text-center">
                                <div v-if="showToolbar" class="d-flex justify-content-center gap-2 p-2">
                                    <button :class="{ disabled: snipCancelDisabled }" @click.prevent="revertChange"
                                        class="btn btn-primary">
                                        Revert
                                    </button>
                                    <button :class="{ disabled: snipDropDisabled }" @click.prevent="removeSnip()"
                                        class="btn btn-primary">
                                        Drop Snip
                                    </button>
                                    <button :class="{ disabled: snipUpdateDisabled }" @click.prevent="updateSnip"
                                        class="btn btn-primary">
                                        Update Snip
                                    </button>
                                    <button :class="{ disabled: updSelectTextDisabled }"
                                        @click.prevent="updateSelectedText" class="btn btn-primary">
                                        Update Selected Text
                                    </button>
                                    <button :class="{ disabled: cancelUpdTextDisabled }"
                                        @click.prevent="cancelUpdateSelected" class="btn btn-primary">
                                        Cancel Update Text
                                    </button>
                                </div>
                                <div v-else>
                                    Select Text to Snip or Click a Snip to Modify
                                </div>
                            </div>
                            <div class="card">
                                <div @scroll.once="scrollSearchWord" @mouseup="snipHighlightedText" ref="articleRef"
                                    @click="activateHandles($event)" @dragstart="handleDragStart" @dragover.prevent
                                    class="card-body overflow-auto" style="max-height: 300px" @drop="handleDrop"
                                    id="textTrove">
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
                                <td>{{ index + 1 }}</td>
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
                                <button :class="{ disabled: deleteSelectedTextDisabled }"
                                    @click.prevent="deleteSelectedText" class="btn btn-primary">
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
    background-color: #eef;
    border-radius: 4px;
}
</style>