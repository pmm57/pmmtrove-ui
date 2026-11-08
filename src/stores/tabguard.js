import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Single active tab per browser using the Web Locks API.
// The lock is released automatically when the holding tab closes or crashes.
const LOCK_NAME = 'trove-active-tab'
const hold = () => new Promise(() => { }) // never resolves - holds the lock for the life of the tab

export const useTabGuardStore = defineStore('tabGuard', () => {
  const state = ref('active') // 'active' | 'passive'
  const passive = computed(() => state.value === 'passive')
  //
  // Passive tab - wait for the active tab to go away, then restart this tab as the active one
  function waitForActive() {
    navigator.locks.request(LOCK_NAME, () => {
      console.log('tabGuard - active tab closed, activating this tab')
      location.reload()
      return hold()
    }).catch((e) => console.log('tabGuard waitForActive ended:', e?.name))
  }
  function becomePassive() {
    state.value = 'passive'
    waitForActive()
  }
  // Take the lock from the active tab - the session on the server is kept
  function useThisTab() {
    navigator.locks.request(LOCK_NAME, { steal: true }, () => {
      console.log('tabGuard - took over as active tab')
      location.reload()
      return hold()
    }).catch((e) => console.log('tabGuard useThisTab ended:', e?.name))
  }
  // Called before the app mounts and before any server call
  async function startGuard() {
    if (!navigator.locks || !window.isSecureContext) {
      console.log('tabGuard - Web Locks unavailable or insecure context, single tab guard skipped')
      return
    }
    await new Promise((resolve) => {
      navigator.locks.request(LOCK_NAME, { ifAvailable: true }, (lock) => {
        if (lock) {
          console.log('tabGuard - this tab is active')
          resolve()
          return hold()
        }
        becomePassive()
        resolve()
      }).catch((e) => {
        // Lock stolen by another tab
        console.log('tabGuard - lock taken by another tab:', e?.name)
        becomePassive()
      })
    })
  }
  return { state, passive, startGuard, useThisTab }
})
