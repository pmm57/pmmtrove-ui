import { useErrorsArrayStore } from '@/stores/errorsarray'
const errorsStore = useErrorsArrayStore()
// Async Do Fetch
export async function useDoFetch (calledFrom, url, options) {
const request = new Request(url, options);
const fetchPromise = fetch(request);
const response = await fetchPromise
    .catch (error => {
        errorsStore.arrayErrors.push({msg : 'Server not available', param : ''});
        console.log('doFetch ' + calledFrom + ' : Error in event handler::', error);
        return
    });
console.log(calledFrom + ": response =", response);
// iterate over all headers
// for (let [key, value] of response.headers) {
// console.log(`${key} = ${value}`);
// }
console.log(calledFrom + ": response.status =", response.status);
if (response.status == 200) {
    const data = await response.json();
    console.log ('doFetch ' + calledFrom + ' response ', data)
} else {
    errorsStore.arrayErrors = response.error
}             
}  