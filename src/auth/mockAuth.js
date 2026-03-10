import { ref } from 'vue'
import { useDoFetch } from '@/components/DoFetch.js';

export const isLoading = ref(false)   // mockAuth never loads asynchronously
export const error = ref([])        // no errors by default
export const isAuthenticated = ref(false)
export const user = ref({})
export const availableUsers = ref([])

export async function loadMockUsers() {
    const options = {
        method: "get",
        mode: "cors",
        credentials: "include", // to send HTTP only cookies
        headers: {
            'Accept': 'application/json'
        }
    };
    const data = await useDoFetch('loadMockUsers', "/authUsers", options);
    if (typeof data == 'boolean') {
        // Load failed
        console.log(`mockAuth/loadMockUsers Load Failed:%s`, JSON.stringify(data))
        return
    }
    console.log(`mockAuth/loadMockUsers Load Success:%s`, JSON.stringify(data))
    availableUsers.value = [...data]
    console.log(`mockAuth/loadMockUsers availableUsers:%s`, JSON.stringify(availableUsers.value))
}

export function selectMockUser(name) {
    console.log(`mockAuth/selectMockUser selectd:%s`, name)
    user.value = {
        nickname: name
    }
    isAuthenticated.value = true
}

export function loginWithRedirect() {
    console.log('Mock login — use selectMockUser() instead')
}

export function logout() {
    isAuthenticated.value = false
    user.value = null
}