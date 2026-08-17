import { useDoFetch } from '@/components/DoFetch.js';
import { useNavBarStore } from '@/stores/navbar'
import { useUserDataStore } from '@/stores/userdata'
export async function resetUser(clearTroveUser) {
    const navStore = useNavBarStore()
    const userData = useUserDataStore()
    // Send reset to server
    console.log('ResetUser - Reset Session')
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        //make sure to serialize your JSON body
        body: JSON.stringify({
            clearTroveUser: clearTroveUser
        })
    };
    await useDoFetch ('resetUser', "/reset-session", options);
    // Clear all data
    userData.clearStore()
    navStore.clearNavBar(false)
}