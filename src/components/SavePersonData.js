import { useDoFetch } from '@/components/DoFetch.js';
//  Post updated data and expect ssePersonChg to trigger reload
export function useSavePersonData(currentDetails, newDetails) {
    console.log("useSavePersonData action " + currentDetails.action);
    var updMetaData = {
        'oldPersonData': currentDetails,
        'updPersonData': newDetails
    };
    console.log('useSavePersonData Sent to Server', JSON.stringify(updMetaData));
    // console.log (updatedData);
    const url = import.meta.env.VITE_SERVER_URL + "/updUserMetaData/userPesonMetadata";
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        //make sure to serialize your JSON body
        body: JSON.stringify(updMetaData)
    };
    // console.log (options);
    useDoFetch('useSavePersonData', url, options);
}