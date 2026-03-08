import { useDoFetch } from '@/components/DoFetch.js';
import { useNavBarStore } from '@/stores/navbar'
import { useUserDataStore } from '@/stores/userdata'
export async function resetServer() {
    const navStore = useNavBarStore()
    const userData = useUserDataStore()
    // Send reset to server
    const url = import.meta.env.VITE_SERVER_URL + "/reset-session";
    console.log('HomeView - Reset Session')
    const options = {
        method: "post",
        mode: "cors",
        credentials: "include"
    };
    const data = await useDoFetch ('resetUser', url, options);
    // Clear all data
    userData.clearStore()
    navStore.clearNavBar()
}