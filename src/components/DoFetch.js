import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
// Async Do Fetch
export async function useDoFetch (calledFrom, url, options) {
    const noJsonResponse = ["Ignore Articles", "Search", "Unignore Articles", "Ignore List Articles", "loadListArticles"];
    const request = new Request(url, options);
    const fetchPromise = fetch(request);
    const response = await fetchPromise
        .catch (error => {
            errorsStore.arrayErrors.push({msg : 'Server not available', param : ''});
            console.log('doFetch ' + calledFrom + ' : Error in event handler::', error);
            return
        });
    // console.log(calledFrom + ": response =", response);
    // iterate over all headers
    // for (let [key, value] of response.headers) {
    // console.log(`${key} = ${value}`);
    // }
    console.log(calledFrom + ": response.status =", response.status);
    if (response.status == 200) {
        if (noJsonResponse.includes(calledFrom)) {
        } else {
            const data = await response.json();
            console.log ('doFetch ' + calledFrom + ' response ', JSON.stringify(data))
        }
    } else {
        errorsStore.arrayErrors.push({msg: response.statusText, param: 'Called from:' + calledFrom + ' - With url:' + response.url});
    }             
}  