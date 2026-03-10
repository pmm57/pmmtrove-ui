import { shouldUseAuth0 } from './authMode'
import { useAuth0 } from '@auth0/auth0-vue'

export async function useAuth() {
    if (shouldUseAuth0) {
        return useAuth0()
    }
    // Dynamic import ensures mockAuth is NOT bundled in production
    const mock = await import('./mockAuth')
    return {
        isAuthenticated: mock.isAuthenticated,
        isLoading: mock.isLoading,
        user: mock.user,
        loginWithRedirect: mock.loginWithRedirect,
        logout: mock.logout,
        error: mock.error
    }

 }