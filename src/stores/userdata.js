import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useUserDataStore = defineStore('userData', () => {
    const arrayMinedStatus = ref([])
    const arrayMetadataTypes = ref([])
    const authUserTroveIds = ref([])
    // authUserName
    // troveApiKey
    // troveUserId
    // troveUserApiKey
    const verifiedAuthUserName = ref(false)
    const troveDetails = reactive({})
    // troveUserId
    // troveApiKey
    // troveApiRoot
    const troveQueryTotal = ref(0)
    const troveQueryArticleTotal = ref(0)
    const nbrUserIgnoredArticles = ref(0)
    const nbrUserDupArticles = ref(0)
    const userDuplicateListIds = ref([])
    const loadedIndex = ref(-1)
    const userLists = ref([])
    //   All the Trove Lists of a user - read from Trove
    // userLists = []; /
    // List element object definition
    // listItem = {};
    // listItem.TroveListId
    // listItem.TroveListUpdatedText
    // listItem.TroveListViewedDateText added June 2025 - Date time that the UI got it
    // listItem.TroveListUpdated
    // listItem.TroveListItemCount
    // listItem.TroveListDescription
    // listItem.TroveListReqUrl FROM TroveReqUrl
    // listItem.TroveListName
    // listItem.TroveListViewUrl FROm TroveViewUrl
    // listItem.TroveListLoadState
    // listItem.TroveListLinkedPerson
    // listItem.TroveListArticleMinedStatusCounts

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const userListArticles = ref([])
    // A 2 dimensional array - First index is same as listItem
    //   TroveListArticleViewedIdx 
    //   TroveListArticleId FROM id => 
    //   TroveListArticleReqUrl FROM url => 
    //   TroveListArticleHeading FROM heading => 
    //   TroveListArticleCategory FROM category => 
    //   TroveListArticleSource FROM title => 
    //   TroveListArticlePubDate FROM date => 
    //   TroveListArticlePage FROM page => 
    //   TroveListArticlePageSequence FROM pageSequence => 
    //   TroveListArticleViewUrl FROM troveUrl => 
    //   TroveListArticleMinedStatus FROM listArticleMinedStatus => 
    //   TroveListArticleMinedStatustext FROM listArticleMinedStatustext => 
    //   TroveListArticleNote FROM note => 
    //
    const verifiedTroveUserName = ref(false) // Have a verified user
    const userReloadList = ref(0)
    const userListsReady = ref(false)
    const reloadedViewedArticle = ref(0)
    const updatingViewedArticleIdx = ref(0)
    const viewedArticles = ref([])
    // viewedArticles FROM displayedArticles = []; => 
    // ViewedArticleId FROM TroveArticleId
    // ViewedArticleLastTroveUpdated FROM TroveArticleLastUpdated
    // ViewedArticleLastTroveUpdatedText added June 2025 DUmmy daye / troveArticle.lastCorrection.lastupdated / Latest List Updated Date
    // ViewedArticleDbUpdateDateText added June 2025 - Date time updated in DB
    // ViewedArticleViewedDateText added June 2025 - Date time that the UI got it
    // ViewedArticleUpdatedBy FROM TroveArticleLastUpdatedBy
    // ViewedArticleHeading FROM TroveArticleHeading
    // ViewedArticleSource FROM TroveArticleSource => 
    // ViewedArticlePubDate FROM TroveArticlePubDate => 
    // ViewedArticleNote FROM TroveArticleNote => 
    // ViewedArticleReqUrl FROM TroveArticleReqUrl => 
    // ViewedArticleViewUrl FROM TroveArticleViewUrl => 
    // ViewedArticleGetTrove FROM TroveArticleGetTrove => 
    // ViewedArticleGetDB FROM TroveArticleGetDB => 
    // ViewedArticleRetrieveDB FROM TroveArticleRetrieveDB => 
    // ViewedArticleSelectedText FROM TroveArticleSelectedText => 
    // ViewedArticleSnips FROM TroveArticleTextSnips - JSON array as string [{snips:"xxxxxx",snipe:"xxxxxxx"}, ....]
    // ViewedArticleSummaryText FROM TroveArticleSummaryText => 
    // ViewedArticlePossibleDupArticle []
    //             TroveArticleId
    //             TroveArticleViewUrl
    //             TroveArticleListDescription
    // ViewedArticleEntities [] FROM TroveArticleEntities => 
        // Metadatype (Date, Event, Name, Place), Metadata, 'Men'/Matched True
    // ViewedArticleRetrieveTrove FROM TroveArticleRetrieveTrove => 
    // ViewedArticleSearchWord FROM TroveArticleSearchWord => 
    // ViewedArticleFoundCount FROM TroveArticleFoundCount => 
    // ViewedArticleOriginalText FROM TroveArticleOriginalText => 
    // ViewedArticleMinedStatus FROM TroveArticleMinedStatus => 
    // ViewedArticleMinedStatusText FROM TroveArticleMinedStatusText => 
    // ViewedArticleMetadata FROM TroveArticleMetadata [] => 
        // Array [MetadataType, Metadata, "Auto"/"Sel"]

    const metadataValueTotal = ref(0)
    const metadataTypeByMetadata = ref([])
    //   Array of arrayMetadataTypeByMetadata
    // metadataType
    // arrayMetadata [
    //   {metadataValue: string
    //   articleListArray: []
    // ]

    // Matadata Type Event Structure
    //     metadataValue
    //     isPrimary :boolean

    // Metadata Type Person Structure
    //     metadataValue - Stringified Name
    //     personLinkedList - List Id
    //     hasStory - Articles in Story Count
    //     relatedCount - relatedCount
    //     articleListArray - {troveArticleId, troveListId, idxViewedArticle}

    const storyEventsForPersons = ref([])
  //
    function clearCacheStore() {
        this.troveQueryTotal = 0
        this.troveQueryArticleTotal = 0
        this.loadedIndex = -1
        this.userDuplicateListIds = []
        this.userLists = []
        this.userListArticles = []
        this.reloadedViewedArticle = 0
        this.updatingViewedArticleIdx = 0
        this.viewedArticles = []
        this.metadataValueTotal = 0
        this.metadataTypeByMetadata = []
        this.storyEventsForPersons = []
    }
    //
    function clearStore() {
        this.troveDetails = {}
        this.troveQueryTotal = 0
        this.troveQueryArticleTotal = 0
        this.nbrUserIgnoredArticles = 0
        this.nbrUserDupArticles = 0
        this.userDuplicateListIds = []
        this.loadedIndex = -1
        this.userLists = []
        this.userListArticles = []
        this.verifiedTroveUserName = false
        this.userListsReady = false
        this.reloadedViewedArticle = 0
        this.updatingViewedArticleIdx = 0
        this.viewedArticles = []
        this.metadataValueTotal = 0
        this.metadataTypeByMetadata = []
        this.storyEventsForPersons = []
    }
    //
    function normalizeUserList(list) {
    return {
        TroveListId: list.TroveListId,
        TroveListUpdatedText: list.TroveListUpdatedText ?? '',
        TroveListViewedDateText: list.TroveListViewedDateText ?? '',
        TroveListUpdated: list.TroveListUpdated ?? '',
        TroveListItemCount: list.TroveListItemCount ?? 0,
        TroveListDescription: list.TroveListDescription ?? '',
        TroveListReqUrl: list.TroveListReqUrl ?? '',
        TroveListName: list.TroveListName ?? '',
        TroveListViewUrl: list.TroveListViewUrl ?? '',
        TroveListLoadState: list.TroveListLoadState ?? '',
        TroveListLinkedPerson: list.TroveListLinkedPerson ?? '',
        TroveListArticleMinedStatusCounts: list.TroveListArticleMinedStatusCounts ?? {},
    }
}

    //
    function updateAllLists(cacheUserLists) {
        this.userListArticles = cacheUserLists.map(l => [...l.TroveListArticles]) 
        this.userLists = cacheUserLists.map(normalizeUserList)
    }
    //
    function updateListCounts(cacheUserLists) {
        this.userLists = this.userLists.map((list, index) => ({
            ...list,
            TroveListArticleMinedStatusCounts:
            cacheUserLists[index].TroveListArticleMinedStatusCounts
        }))
    }
    //
    // Reload metadataTypeByMetadata to be reactive
    function normalizeMetadataType (mt) {
        // console.log ('userDataData/normalizeMetadataType - Type %s number %s`, mt.metadataType,  mt.arrayMetadata.length)
        switch (mt.metadataType) {
            case 'Event':
                return { 
                    metadataType: mt.metadataType,
                    arrayMetadata: mt.arrayMetadata.map(mv => 
                        ({ metadataValue: mv.metadataValue,
                            isPrimary: mv.isPrimary ?? false,
                            articleListArray: mv.articleListArray ?? []}))
                }
            case 'Person':
                return { 
                    metadataType: mt.metadataType,
                    arrayMetadata: mt.arrayMetadata.map(mv => 
                        ({ metadataValue: mv.metadataValue,
                            personLinkedList: mv.personLinkedList ?? 0, 
                            hasStory: mv.hasStory ?? 0, 
                            relatedCount: mv.relatedCount ?? 0,
                            articleListArray: mv.articleListArray ?? []}))
                }
            default:
                return { 
                    metadataType: mt.metadataType,
                    arrayMetadata: mt.arrayMetadata.map(mv => 
                        ({ metadataValue: mv.metadataValue, 
                            articleListArray: mv.articleListArray ?? []}))
                }
        }
    }
    function reloadMetadataTypeByMetadata (metadataTypeByMetadata) {
        // console.log ('userData/reloadMetadataTypeByMetadata %s`, JSON.stringify(metadataTypeByMetadata))
        this.metadataTypeByMetadata = metadataTypeByMetadata.map(normalizeMetadataType)
        // console.log ('userData/reloadMetadataTypeByMetadata Normalised %s`, JSON.stringify(this.metadataTypeByMetadata))
    }
    // Whenever viewedArticles is updated update metadataTypeByMetadata to indicate Article link is enabled
    function updMetadataTypeArticleLinks(
        viewedListId,
        viewedArticleId,
        idxViewedArticle,
        viewedArticleMetadata
        ) {
        // console.log ('userDataData/updMetadataTypeArticleLinks - this.metadataTypeByMetadata.length:%s Article:%s, Number Metadata:%s`, this.metadataTypeByMetadata.length, viewedArticleId, viewedArticleMetadata.length)
        // Wait until metadata is loaded
        if (!this.metadataTypeByMetadata.length) {
            setTimeout(() =>
            this.updMetadataTypeArticleLinks(
                viewedListId,
                viewedArticleId,
                idxViewedArticle,
                viewedArticleMetadata
            ), 3000)
            return
        }

        const selected = viewedArticleMetadata
            .filter(m => m[2] === 'Sel')
            .map(m => ({
                MetadataType: m[0],
                MetadataValue: m[1],
                troveArticleId: Number(viewedArticleId),
                troveListId: Number(viewedListId),
                idxViewedArticle
                }))
                .sort(sortMetadataTypeAndValue)
        // console.log ('userData/updMetadataTypeArticleLinks - Number Selected', selected.length)

        for (const entry of selected) {
            // console.log ('userData/updMetadataTypeArticleLinks - ', JSON.stringify(entry))
            const type = this.metadataTypeByMetadata.find(t => t.metadataType === entry.MetadataType)
            if (!type) {
                console.log('ERROR Missing MetadataType', entry.MetadataType)
                continue
            }
            const value = type.arrayMetadata.find(v => v.metadataValue === entry.MetadataValue)
            if (!value) {
                console.log('NOTIFY Missing MetadataValue', entry.MetadataValue)
                continue
            }
            const article = value.articleListArray.find(a => a.troveArticleId === entry.troveArticleId && a.troveListId === entry.troveListId)
            if (!article) {
                console.log(`NOTIFY Missing Article/List for MetadataValue %s`, JSON.stringify(entry))
                continue
            }
            // Direct reactive update — no deep cloning needed
            // console.log ('userData/updMetadataTypeArticleLinks 1 Update - Article %s`, JSON.stringify(article))
            // console.log ('userData/updMetadataTypeArticleLinks 2 Update - Entry %s`, JSON.stringify(entry))
            article.idxViewedArticle = entry.idxViewedArticle
            // Force reactivity
            value.articleListArray = [...value.articleListArray]
            // console.log ('userData/updMetadataTypeArticleLinks 3 Update - %s - %s `, JSON.stringify(article), JSON.stringify(entry))
        }
    }
    //
    function sortMetadataTypeAndValue(a, b) {
        var comparison = 0;
        if (a.MetadataType === b.MetadataType) {
            if (a.Metadata > b.Metadata) {
                comparison = 1;
            } else if (a.Metadata < b.Metadata) {
                comparison = -1;
            }
            return comparison
        }
        if (a.MetadataType > b.MetadataType) {
            comparison = 1;   
        } else if (a.MetadataType < b.MetadataType) {
            comparison = -1;
        }
        return comparison;
    }
    //
    function updateListItemStatusCount(listIdx, loadStatus, count, minedStatusCounts) {
        // console.log(`this updateListItemStatusCount %s %s`, listIdx, JSON.stringify(this.userLists[listIdx]))
        this.userLists[listIdx].TroveListLoadState = loadStatus
        this.userLists[listIdx].TroveListItemCount = count
        this.userLists[listIdx].TroveListArticleMinedStatusCounts = minedStatusCounts
        // console.log ("userData updateListItemStatusCount")
    }
    //
    return { arrayMinedStatus,
        arrayMetadataTypes,
        authUserTroveIds,
        verifiedAuthUserName,
        troveDetails, 
        troveQueryTotal, 
        troveQueryArticleTotal, 
        nbrUserDupArticles,
        nbrUserIgnoredArticles,
        userDuplicateListIds,
        loadedIndex,
        userLists,
        verifiedTroveUserName,
        userListsReady, 
        userReloadList,
        reloadedViewedArticle,
        updatingViewedArticleIdx,
        viewedArticles, 
        metadataValueTotal, 
        metadataTypeByMetadata,
        storyEventsForPersons,
        clearStore,
        clearCacheStore,
        updateAllLists,
        updMetadataTypeArticleLinks,
        updateListItemStatusCount,
        updateListCounts,
        reloadMetadataTypeByMetadata
}
})
