import { useErrorsArrayStore } from '@/stores/errorsarray'
// Async Do Fetch
const serverUrl = import.meta.env.VITE_SERVER_URL
export async function useDoFetch (calledFrom, inUrl, options) {
    const errorsStore = useErrorsArrayStore()
    const noJsonResponse = ["Ignore Articles", "Search", "Unignore Articles", "loadListArticles", "Manage Ignored Articles", "loadArticle", "saveArticle", "resetUser", "flipStoryPrimaryEvent"];
    const request = new Request(serverUrl + inUrl, options);
    const fetchPromise = fetch(request);
    const response = await fetchPromise
        .catch (error => {
            errorsStore.arrayErrors.push({msg : 'Server not available', param : ''});
            console.log('useDoFetch ' + calledFrom + ' : Error in event handler::', error);
            return
        });
    // console.log(calledFrom + ": response =", response);
    // iterate over all headers
    // for (let [key, value] of response.headers) {
    // console.log(`${key} = ${value}`);
    // }
    console.log('useDoFetch ' + calledFrom + ": response.status =", response.status);
    if (response.status == 200) {
        if (noJsonResponse.includes(calledFrom)) {
        } else {
            const data = await response.json();
            console.log ('useDoFetch ' + calledFrom + ' response ', JSON.stringify(data))
            return data
        }
    } else {
        errorsStore.arrayErrors.push({msg: response.statusText, param: 'Called from:' + calledFrom + ' - With url:' + response.url});
    }
    return false        
}  