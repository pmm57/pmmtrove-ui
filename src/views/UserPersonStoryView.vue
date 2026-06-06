<script setup>
import { ref, watch, computed, reactive, nextTick } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import { useUserDataStore } from '@/stores/userdata';
const userData = useUserDataStore();
import { useNavBarStore } from '@/stores/navbar';
const navStore = useNavBarStore();
import { useSavePersonData } from '@/components/SavePersonData.js';
import EditItem from '@/components/EditItem.vue'
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const storyEvents = computed({
    get: () => userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx],
    set: (val) => userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx] = val
})
const startIncludes = storyEvents.value.map((e) => e.include)
let updatesEnabled = ref(false)
let chgInclude = false
let chgWhat = false
let storyShowWhat = ref(true)
storyShowWhat.value = navStore.savedPerson.storyShowWhat
console.log(`storyShowWhat %s startIncludes %s`, navStore.savedPerson.storyShowWhat, JSON.stringify(startIncludes))
const filteredEvents = computed(() =>
    storyEvents.value.filter(a => {
        const showWhat = storyShowWhat.value
        switch (showWhat) {
            case 'ALL': return true
            case 'PRM': return a.isPrimary
            case 'INC': return a.include
            case 'EXC': return !a.include
            default: return false
            }
    })
)
const showWhat = reactive([
    { label: 'All', active: false },
    { label: 'Primary', active: false },
    { label: 'Included', active: false },
    { label: 'Excluded', active: false }
])
const inShowWhat = navStore.savedPerson.storyShowWhat
if (inShowWhat.includes('ALL')) showWhat[0].active = true
if (inShowWhat.includes('PRM')) showWhat[1].active = true
if (inShowWhat.includes('INC')) showWhat[2].active = true
if (inShowWhat.includes('EXC')) showWhat[3].active = true

//
console.log('UserPersonStoryView Person', JSON.stringify(navStore.savedPerson));
const strPersonDob = navStore.savedPerson.readName.replace(/.*b\.(\d{4}).*/, "$1");
const personDob = strPersonDob.length == 0 ? 0 : Number(strPersonDob)
console.log('UserPersonStoryView Person DOB, Reference', personDob, navStore.savedPerson.readRefInfo);
console.log('UserPersonStoryView Events Articles', JSON.stringify(storyEvents.value.map((el) => el.articleId)));
for (let event of storyEvents.value) {
    const viewedIdx = userData.viewedArticles.findIndex((el) => el.ViewedArticleId == event.articleId)
    if (viewedIdx == -1) {
        console.log('UserPersonStoryView/updateFromViewedArticles Event article not found in Viewed Articles ', JSON.stringify(event));
        continue
    }
    const viewedArticle = userData.viewedArticles[viewedIdx]
    updateEventFromViewedArticle(event, viewedArticle)
}
//  Post array of Story Events
function updateStory() {
    // userData.storyEventsForPersons[navStore.savedPerson.personStoryIdx] = storyEvents.value
    navStore.savedPerson.storyShowWhat = storyShowWhat.value
    const oldPersonData = {
        "action": "STORY",
        "personIndex": navStore.savedPerson.personIndex,
        "readName": navStore.savedPerson.readName,
        "storyStatus": 'Update',
        "storyShowWhat": navStore.savedPerson.storyShowWhat,
        "linkedListId": navStore.savedPerson.linkedListId,
        "arrayRelated": navStore.savedPerson.arrayRelated,
        "personStoryIdx": navStore.savedPerson.personStoryIdx
    }
    if (navStore.storyPersonNew) {
        oldPersonData.storyStatus = 'Create'
    }
    const updateEvents = {
        "updatedEvents": storyEvents.value.map((el) => ({ articleId: el.articleId, include: el.include })),
        "chgPersonStoryShowWhat": storyShowWhat.value
    }
    useSavePersonData('Save Story', oldPersonData, updateEvents);
    navStore.storyPersonNew = false
    updatesEnabled.value = false
    chgInclude = false
    chgWhat = false
}
//  
function reloadStory() {
    console.log('UserPersonStoryView/reloadStory ', navStore.savedPerson.readName)
    navStore.savedPerson.action = 'StoryReload'
    router.push({ name: 'userPersonList' });
}
//
function updateViewedArticleTrigger(updatingIdx) {
    console.log(`UserPersonStoryView/updateViewedArticleTrigger Watch Trigger `, updatingIdx);
    const viewedArticle = userData.viewedArticles[updatingIdx]
    // console.log(`UserPersonStoryView/updateViewedArticleTrigger viewedArticle `, JSON.stringify(viewedArticle));
    const eventIdx = storyEvents.value.findIndex((el) => el.articleId == viewedArticle.ViewedArticleId)
    if (eventIdx == -1) return
    updateEventFromViewedArticle(storyEvents.value[eventIdx], viewedArticle)
}
//
function updateEventFromViewedArticle(event, viewedArticle) {
    event.story = getArticleStory(event, viewedArticle)
    event.articleEventDate = viewedArticle.ViewedArticleEventDate
    event.age = personDob == 0 ? '-' : Number(event.articleEventDate.slice(0, 4)) - personDob
    event.isPrimary = getArticleEventIsPrimary(event, viewedArticle)
    event.eventLocation = getArticleLocation(viewedArticle)
    event.articleViewUrl = getTroveUrlWithText (event, viewedArticle)
    // console.log('UserPersonStoryView/updateEventFromViewedArticle ', JSON.stringify(event));
}
// Get best Article Story
function getArticleStory(event, viewedArticle) {
    //
    var story = ''
    if ((viewedArticle.hasOwnProperty("ViewedArticleSummaryText")) && (viewedArticle.ViewedArticleSummaryText.length > 0)) {
        // console.log('Article story - Summary Text ', viewedArticle.ViewedArticleSummaryText)
        story = viewedArticle.ViewedArticleSummaryText
    } else {
        // console.log('Article story - Event ', JSON.stringify(viewedArticle.ViewedArticleMetadata))
        const idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "Event");
        if (idxEvent > -1) {
            story = viewedArticle.ViewedArticleMetadata[idxEvent][1];
        } else {
            story = viewedArticle.TroveListArticleHeading;
        }
    }
    if (event.relType == 'self') return story
    let relationType = event.relType
    switch (event.relType) {
        case 'self-gp':
            relationType = 'Grandparent'
            break
        case 'self-p':
            relationType = 'Parent'
            break
        case 'self-cw':
            relationType = 'Partner'
            break
        case 'self-s':
            relationType = 'Sibling'
            break
        case 'self-c':
            relationType = 'Child'
            break
        case 'self-gc':
            relationType = 'Grandchild'
            break
        case 'cw-gp':
            relationType = 'Partner Grandparent'
            break
        case 'cw-p':
            relationType = 'Partner Parent'
            break
        case 'cw-c':
            relationType = 'Partner Child'
            break
        case 'cw-gc':
            relationType = 'Partner Grandchild'
            break
    }
    story += '<br><u>From</u> ' +  '( ' + relationType + ' ) "' + event.relPerson + '"'
    return story
}
// Idnitfy if a Primary Event
function getArticleEventIsPrimary(event, viewedArticle) {
    //
    // console.log(`getArticleEventIsPrimary - Event %s - Metadata`, JSON.stringify(event), JSON.stringify(viewedArticle.ViewedArticleMetadata))
    if (event.relType == 'self') return true
    var eventIsPrimary = false
    const idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "Event");
    if (idxEvent > -1) eventIsPrimary = viewedArticle.ViewedArticleMetadata[idxEvent][3];
    return eventIsPrimary
}
// Get best Article Location
function getArticleLocation(viewedArticle) {
    //
    // console.log('Article Location - Event ', JSON.stringify(viewedArticle.ViewedArticleMetadata))
    var idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "EventPlace");
    if (idxEvent > -1) return viewedArticle.ViewedArticleMetadata[idxEvent][1];
    idxEvent = viewedArticle.ViewedArticleMetadata.findIndex((item) => item[0] == "PublishLocation");
    if (idxEvent > -1) {
        // console.log('Article Location - Event ', idxEvent, JSON.stringify(viewedArticle.ViewedArticleMetadata[idxEvent]))
        return viewedArticle.ViewedArticleMetadata[idxEvent][1];
    }
    return ''
}
// 
function getTroveUrlWithText (event, viewedArticle) {
    // const url = `${viewedArticle.ViewedArticleViewUrl}#:~:text=${event.relPerson?.trim().split(",")[0]}`
    const searchText = viewedArticle?.ViewedArticleSnips ? JSON.parse(viewedArticle.ViewedArticleSnips)[0]?.snipf : event.relPerson?.trim().split(",")[0]
    console.log (`getTroveUrlWithText searchText:"${searchText}"`)
    const url = `${viewedArticle.ViewedArticleViewUrl}#:~:text=${encodeURIComponent(searchText)}`
    console.log (`getTroveUrlWithText url:${url}`)
    return url
}
//
function updateInclude(action, index) {
    const storyIdx = storyEvents.value.findIndex(e => e.articleId == filteredEvents.value[index].articleId)
    console.log(`UserPersonStory/updateInclude index %s Filtered Line %s`, storyIdx, JSON.stringify(filteredEvents.value[index]))
    switch (action) {
        case 'Include':
            storyEvents.value[storyIdx].include = true
            // filteredEvents.value[index].include = true
            break;
        case 'Exclude':
            storyEvents.value[storyIdx].include = false
            // filteredEvents.value[index].include = false
            break;
        default:
            break;
    }
    // Are we back to where we started
    const same = startIncludes.every((item, i) => item.include === storyEvents.value[i].include);
    if (same) {
        chgInclude = false
        if (!chgWhat) updatesEnabled.value = false
    } else {
        chgInclude = true
        updatesEnabled.value = true
    }
    // console.log(`UserPersonStory/updateInclude action %s index %s include %s same %s chgInclude %s chgWhat %s updatesEnable %s`,
    //     action, index, storyEvents[index].include, same, chgInclude, chgWhat, updatesEnabled.value)
}
//
function openArticle(articleLink) {
    console.log('UserPersonStory/openArticle ', JSON.stringify(articleLink))
    navStore.listId = articleLink.listId;
    navStore.articleId = articleLink.articleId;
    router.push({ name: 'editArticle' });
}
//
function setShowWhat(btnIdx) {
    // console.log(`UserPersonStory/setShowWhat %s`, btnIdx, JSON.stringify(showWhat[btnIdx]))
    switch (btnIdx) {
        case 0: // Show All - Not FLiapable
            showWhat[0].active = true
            showWhat[1].active = false
            showWhat[2].active = false
            showWhat[3].active = false
            break
        case 1: // Show All isPrimary
            showWhat[1].active = !showWhat[1].active
            if (showWhat[1].active) { //Flipped True
                showWhat[0].active = false
                showWhat[2].active = false
                showWhat[3].active = false
            } else {
                showWhat[0].active = true
            }
            break
        case 2: // Included  - Overides isPrimary
            showWhat[2].active = !showWhat[2].active
            if (showWhat[2].active) { //Flipped True
                showWhat[0].active = false
                showWhat[1].active = false
                showWhat[3].active = false
            } else {
                showWhat[0].active = true
            }
            break
        case 3: // Excluded - Overides isPrimary
            showWhat[3].active = !showWhat[3].active
            if (showWhat[3].active) { //Flipped True
                showWhat[0].active = false
                showWhat[1].active = false
                showWhat[2].active = false
            } else {
                showWhat[0].active = true
            }
            break
        default:
    }
    // Setup 
    if (showWhat[0].active) storyShowWhat.value = 'ALL'
    if (showWhat[1].active) storyShowWhat.value = 'PRM'
    if (showWhat[2].active) storyShowWhat.value = 'INC'
    if (showWhat[3].active) storyShowWhat.value = 'EXC'
    if (storyShowWhat.value == navStore.savedPerson.storyShowWhat) {
        chgWhat = false
        if (!chgInclude) updatesEnabled.value = false
    } else {
        chgWhat = true
        updatesEnabled.value = true
    }
    // console.log(`UserPersonStory/setShowWhat showWhat %s - %s`, JSON.stringify(showWhat), storyShowWhat.value)
}
//
watch(
    () => userData.updatingViewedArticleIdx,
    async (idx) => {
        await nextTick()
        updateViewedArticleTrigger(idx)
    }
)
//
function safePdfFileName(name) {
    // Windows-illegal chars: \ / : * ? " < > |
    // Also trim + collapse whitespace
    const cleaned = (name ?? "")
        .toString()
        .trim()
        .replace(/[\\/:*?"<>|]/g, "")   // remove illegal filename chars
        .replace(/\s+/g, " ");          // collapse whitespace
    // Fallback if empty after cleaning
    return cleaned.length ? cleaned : "story";
}
//
/**
 * Parse story HTML for:
 * - <br> -> \n
 * - <u>...</u> -> underline ranges
 * Returns: { text: string, ranges: Array<{start:number, end:number}> }
 */
function parseStoryHtml(html) {
	const s = (html ?? "").toString();
	// Normalize line breaks first
	const normalized = s.replace(/<br\s*\/?>/gi, "\n");
	let out = "";
	const ranges = [];
	let i = 0;
	while (i < normalized.length) {
		const uOpen = normalized.toLowerCase().indexOf("<u>", i);
		if (uOpen === -1) {
			out += stripOtherTags(normalized.slice(i));
			break;
		}
		// text before <u>
		out += stripOtherTags(normalized.slice(i, uOpen));
		const uClose = normalized.toLowerCase().indexOf("</u>", uOpen);
		if (uClose === -1) {
			// No closing tag; treat remainder as normal text
			out += stripOtherTags(normalized.slice(uOpen));
			break;
		}
		// Inside <u> ... </u>
		const innerRaw = normalized.slice(uOpen + 3, uClose);
		const innerText = stripOtherTags(innerRaw);
		const start = out.length;
		out += innerText;
		const end = out.length;
		if (end > start) ranges.push({ start, end });
		i = uClose + 4;
	}
	return { text: out, ranges };
}
//
/** Strip any tags EXCEPT we've already handled <u> and <br> */
function stripOtherTags(html) {
	return html.replace(/<[^>]+>/g, "");
}
//
/** Draw underline segments inside a given line */
function drawUnderlinesForLine(doc, lineText, lineX, baselineY, lineStartIndex, underlineRanges) {
	if (!underlineRanges?.length || !lineText) return;
	const lineEndIndex = lineStartIndex + lineText.length;
	for (const r of underlineRanges) {
		const segStart = Math.max(r.start, lineStartIndex);
		const segEnd = Math.min(r.end, lineEndIndex);
		if (segEnd <= segStart) continue;
		const localStart = segStart - lineStartIndex;
		const localEnd = segEnd - lineStartIndex;
		const prefix = lineText.slice(0, localStart);
		const segment = lineText.slice(localStart, localEnd);
		const prefixW = doc.getTextWidth(prefix);
		const segW = doc.getTextWidth(segment);
		// Underline slightly below baseline
		const underlineY = baselineY + 1.5;
		doc.line(lineX + prefixW, underlineY, lineX + prefixW + segW, underlineY);
	}
}
//
function svgToPngBase64(svgUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL("image/png"); // PNG BASE64
            resolve(base64);
        };
        img.src = svgUrl;
    });
}
//
/**
 * createPdf()
 * mode: "preview" -> opens new tab
 *       "download" -> downloads with filename
 *
 * Returns jsPDF doc (so caller can do extra things if needed)
 */
async function createPdf(mode) {
	const personName = navStore.savedPerson.readName ?? "story";
	const fileName = `${safePdfFileName(personName)}.pdf`;
	// Pre-parse stories so we can reference underline ranges per row
    // console.log (`createPDF story:${JSON.stringify(filteredEvents.value.map(ev => (ev.story)))}`)
	const parsedStories = filteredEvents.value.map(ev => parseStoryHtml(ev.story));
	const doc = new jsPDF({
		orientation: "landscape",
		unit: "pt",
		format: "a4",
	});
	// Header
	doc.setFontSize(16);
	doc.text(personName, 40, 40);
	let y = 60;
	if (navStore.savedPerson.readRefInfo?.length) {
		doc.setFontSize(11);
		doc.text(`Reference: ${navStore.savedPerson.readRefInfo}`, 40, y);
		y += 18;
	}
	// Build body with plain text story (tags removed)
	const bodyRows = filteredEvents.value.map((ev, idx) => [
		ev.articleEventDate ?? "",
		String(ev.age ?? ""),
		ev.eventLocation ?? "",
		"Link",                 // will be cleared so we only draw the clickable link once
		parsedStories[idx].text // plain text so layout/wrapping works
	]);
    // Calculate Column Widths
    const fontSize = 9;
    doc.setFontSize(fontSize);
    // --- helper: estimate width of text in pt ---
    const getWidth = (text) => doc.getTextWidth(text || "");
    // Date ≈ 10 chars
    const dateWidth = Math.max(getWidth("YYYY-MM-DD"), ...filteredEvents.value.map(r => getWidth(r.articleEventDate))) + 12; // padding
    // Age ≈ 6 chars
    const ageWidth = getWidth("Age: 99") + 10;
    // Location: dynamic (based on content)
    const locationWidth = Math.min(
        200, // cap so it doesn't explode
        Math.max(
            80,
            ...filteredEvents.value.map(r => getWidth(r.eventLocation))
        ) + 20
    );
    // Link
    const linkWidth = getWidth("Trove") + 10;
    // Event
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = { left: 20, right: 20 }
    const tableWidth = pageWidth - margin.left - margin.right;
    const usedWidth = dateWidth + ageWidth + locationWidth + linkWidth;
    const eventWidth = Math.max(200, tableWidth - usedWidth);
    // console.log(`createPdf pageWidth:${pageWidth}, tableWidth${tableWidth}, usedWidth:${usedWidth}, eventWidth:${eventWidth}`);
    // Footer
    const imgH = 12;
    const clearSpace = imgH * 0.3;
    const footerTotal = Math.ceil(
            imgH +        // logo
            clearSpace +  // space ABOVE logo
            6             // safety buffer
        );
    const troveImg = await svgToPngBase64("https://assets.nla.gov.au/logos/trove/trove-colour.svg");
    //
	autoTable(doc, {
		startY: y,
        margin: {
                ...margin,
                bottom: footerTotal
            },
        useCss: false,          //  force manual control
        tableWidth: "wrap",     //  stop auto stretching
		head: [["Date", "Age", "Location", "Trove", "Event"]],
		body: bodyRows,
        rowPageBreak: 'avoid',   // prevent split rows
        pageBreak: 'auto',
		styles: {
            fontSize: 9,
            cellPadding: 4,
            valign: "top",
            overflow: "linebreak",
		},
		columnStyles: {
            0: { cellWidth: dateWidth, halign: "center" }, // ✅ centered Date column
            1: { cellWidth: ageWidth, halign: "center" },  // Age
            2: { cellWidth: locationWidth },               // dynamic Location
            3: { cellWidth: linkWidth, halign: "center", valign: "top" }, // Link
            4: { cellWidth: eventWidth },                  // remaining space
		},
		// AutoTable supports modifying data.cell.text in didParseCell [1](https://medium.com/@natanael280198/generate-pdf-url-from-blob-in-react-application-f23cef6dd6c6)[2](https://github.com/diegomura/react-pdf/issues/2744)
        didParseCell: (data) => {
            // center header only for Date column
            if (data.section === "head" && data.column.index === 0) {
                data.cell.styles.halign = "center";
            }
            // Link column (prevent "Link Link")
            if (data.section === "body" && data.column.index === 3) {
                data.cell.text = [""];
            }
            // Story/Event column (FIXED wrapping)
            if (data.section === "body" && data.column.index === 4) {
                const rowIndex = data.row.index;
                const storyText = parsedStories[rowIndex]?.text ?? "";
                const fontSize = data.cell.styles.fontSize || 9;
                doc.setFontSize(fontSize);
                const padL = data.cell.padding("left");
                const padR = data.cell.padding("right");
                //  SAFE WIDTH (prevents one-word-per-line bug)
                let available = eventWidth - padL - padR;
                // console.log(`createPdf available:${available} data.cell.width:${data.cell.width}`);
                if (!available || available < 80) {
                    available = 300;
                }
                // Use jsPDF native wrapping (stable)
                const lines = doc.splitTextToSize(storyText, available);
                data.cell.text = lines;
                // Simple position tracking for underline
                let cursor = 0;
                data.cell._wrappedMeta = lines.map(line => {
                const idx = storyText.indexOf(line, cursor);
                const start = idx === -1 ? cursor : idx;
                cursor = start + line.length;
                return { text: line, start };
                });
            }
        },
		// Draw clickable link + underline segments after the cell is drawn
		didDrawCell: (data) => {
			// Clickable Link column: draw only once
			if (data.section === "body" && data.column.index === 3) {
				const row = filteredEvents.value[data.row.index];
				const url = row?.articleViewUrl;
				if (!url) return;
                const padL = data.cell.padding("left");
                const padT = data.cell.padding("top");
                const fontSize = data.cell.styles.fontSize || 9;
                const x = data.cell.x + padL;               // left edge inside cell
                const y = data.cell.y + padT + fontSize;   //  TOP aligned baseline
				doc.setTextColor(0, 0, 255);
				doc.textWithLink("Link", x,	y, { url });
				doc.setTextColor(0, 0, 0);
			}
			// Underline within story column
			if (data.section === "body" && data.column.index === 4) {
				const rowIndex = data.row.index;
				const ranges = parsedStories[rowIndex]?.ranges ?? [];
				if (!ranges.length) return;
				const wrapped = data.cell._wrappedMeta || [];
				if (!wrapped.length) return;
				// Match AutoTable text placement: left padding + top padding + line height steps
				const padL = data.cell.padding("left");
				const padT = data.cell.padding("top");
				const x = data.cell.x + padL;
				const fontSize = data.cell.styles.fontSize || 9;
				doc.setFontSize(fontSize);
				// Approx line height used by jsPDF (factor ~1.15 default)
				const lineHeight = fontSize * 1.15;
				// AutoTable draws the first line near (y + padT + fontSize)
				let baselineY = data.cell.y + padT + fontSize;
				// Underline style
				doc.setDrawColor(0, 0, 0);
				doc.setLineWidth(0.6);
				for (let i = 0; i < wrapped.length; i++) {
					const line = wrapped[i];
					drawUnderlinesForLine(doc, line.text, x, baselineY, line.start, ranges);
					baselineY += lineHeight;
				}
			}
		},
        // FOOTER (runs on every page that has this table)
        didDrawPage: (data) => {
            const pageHeight = doc.internal.pageSize.getHeight();
            // Logo size in PDF units (pt, since your doc is pt)
            const imgW = 45;
            const imgH = 12;
            // Use the same margins autoTable is using
            const clearSpace = imgH * 0.3;
            const x = data.settings.margin.left;
            const y =
                pageHeight -
                data.settings.margin.bottom + // start at margin edge
                clearSpace; 
            doc.addImage(troveImg, "PNG", x, y, imgW, imgH);
        },
	});
	// Output mode
    console.log(`createPdf mode:${mode}`);
	if (mode === "preview") {
		// Open in new tab using blob URL 
		window.open(doc.output("bloburl"), "_blank");
	} else if (mode === "download") {
        console.log(`createPdf mode:download`);
		// Download with a real filename 
		doc.save(fileName);
	}
}
//
</script>
<template>
    <h1>Story Of</h1>
    <h2>{{ navStore.savedPerson.readName }}</h2>
    <h3 v-if="navStore.savedPerson.readRefInfo.length > 0">Reference: {{ navStore.savedPerson.readRefInfo }}</h3>
    <div class="card">
        <div class="card-body">
            <div class="row">
                <div class="col">
                    <div class="card">
                        <router-link :to="'/userPersonList'" custom v-slot="{ navigate }">
                            <button class="btn btn-primary" :disabled="updatesEnabled" @click="navigate()">
                                View Person
                            </button>
                        </router-link>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button @click.prevent="updateStory()" class="btn btn-primary half-height-text"
                            :disabled="!updatesEnabled">Save
                            Show Event Change</button>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button type="button" class="btn btn-primary no-hover half-height-btn">
                            Show Events
                        </button>
                        <div class="btn-group" role="group">
                            <button v-for="(btn, i) in showWhat" :key="i"
                                class="btn btn-primary push-btn half-height-btn" :class="{ active: btn.active }"
                                @click="setShowWhat(i)">
                                {{ btn.label }}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button @click.prevent="reloadStory()" class="btn btn-primary" :disabled="updatesEnabled">Reload
                            Story</button>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button @click.prevent='createPdf("preview")' class="btn btn-primary">Preview PDF
                            Story</button>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <button @click.prevent='createPdf("download")' class="btn btn-primary">Download PDF
                            </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <br>
    <div class="card">
        <div class="card-body w-100">
            <table>
                <thead>
                    <tr>
                        <th>Include</th>
                        <th class="text-center">Date</th>
                        <th class="text-center">Age</th>
                        <th class="text-center">Primary</th>
                        <th class="text-center">Location</th>
                        <th class="text-center">Article</th>
                        <th class="text-center">Trove</th>
                        <th class="text-center">Event</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(article, index) in filteredEvents" :key="article.articleId">
                        <td class="text-center">
                            <EditItem v-if="article.include" @click-item="updateInclude('Exclude', index)"
                                action="Included" icon="bi-check-square" />
                            <EditItem v-if="!article.include" @click-item="updateInclude('Include', index)"
                                action="Excluded" icon="bi-x-square" />
                        </td>
                        <td class="text-nowrap">{{ article.articleEventDate }}</td>
                        <td class="text-center">{{ article.age }}</td>
                        <td class="text-center">
                            <span v-if="article.isPrimary">
                                <i class="bi-check-circle-fill"></i>
                            </span>
                            <span v-else>
                                <i class="bi-circle"></i>
                            </span>
                        </td>
                        <td class="text-nowrap">{{ article.eventLocation }}</td>
                        <td class="text-nowrap">
                            <a href="#" @click.prevent="openArticle(article)">
                                {{ article.articleId }}
                            </a>
                        </td>
                        <td class="text-center"><a :href="article.articleViewUrl" target="_blank" rel="noopener noreferrer">Link</a></td>
                        <td v-html="article.story" class="preserve" style="border-bottom: .5px solid;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style>
.preserve {
    white-space: pre-line;
    /* respects \n as line breaks */
}

.half-height-text {
    font-size: 0.9rem;
    /* slightly smaller text */
    padding-top: 0.5rem;
    /* matches Bootstrap’s natural height */
    padding-bottom: 0.5rem;

}

.no-hover:hover {
    background-color: var(--bs-primary) !important;
    border-color: var(--bs-primary) !important;
    color: #fff !important;
    cursor: default !important;
}

.half-height-btn {
    padding-top: 0.15rem;
    padding-bottom: 0.15rem;
    font-size: 0.75rem;
    line-height: 1rem;
    height: 1.25rem;
    /* optional: forces consistent height */
}

.push-btn {
    background-color: var(--bs-primary);
    color: #fff;
    border: 1px solid var(--bs-primary);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.4);
    transition: all 0.1s ease;
}

.push-btn.active {
    background-color: #b6f7b6;
    /* light green */
    color: #000;
    box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.6);
    transform: translateY(2px);
}

td {
  vertical-align: top;
}
</style>
