import { shouldUseAuth0 } from './authMode'
import { useAuth0 } from '@auth0/auth0-vue'
import * as mock from './mockAuth'

export function useAuth() {
    return shouldUseAuth0 ? useAuth0() : mock
}