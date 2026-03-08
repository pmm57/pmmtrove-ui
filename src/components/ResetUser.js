import { useDoFetch } from '@/components/DoFetch.js';
import { useNavBarStore } from '@/stores/navbar'
import { useUserDataStore } from '@/stores/userdata'
export async function resetServer() {
    const navStore = useNavBarStore()
    const userData = useUserDataStore()
    // Send reset to server
    console.log('HomeView - Reset Session')
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include"
    };
    const data = await useDoFetch ('resetUser', "/reset-session", options);
    // Clear all data
    userData.clearStore()
    navStore.clearNavBar()
}