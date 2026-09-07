// Simple localStorage-based storage (no IndexedDB issues)
export const OfflineDB = {
  addPendingAction: async (action) => {
    try {
      const actions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
      const newAction = {
        ...action,
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        createdAt: new Date().toISOString(),
        synced: false,
      }
      actions.push(newAction)
      localStorage.setItem('pendingActions', JSON.stringify(actions))
      return newAction
    } catch (error) {
      console.warn('Failed to add pending action:', error)
      return null
    }
  },

  getPendingActions: async () => {
    try {
      const actions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
      return actions.filter(a => !a.synced)
    } catch (error) {
      console.warn('Failed to get pending actions:', error)
      return []
    }
  },

  getPendingCount: async () => {
    try {
      const actions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
      return actions.filter(a => !a.synced).length
    } catch (error) {
      console.warn('Failed to get pending count:', error)
      return 0
    }
  },

  deleteSyncedAction: async (id) => {
    try {
      let actions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
      actions = actions.filter(a => a.id !== id)
      localStorage.setItem('pendingActions', JSON.stringify(actions))
      return true
    } catch (error) {
      console.warn('Failed to delete synced action:', error)
      return null
    }
  },

  clearPendingActions: async () => {
    try {
      localStorage.removeItem('pendingActions')
    } catch (error) {
      console.warn('Failed to clear pending actions:', error)
    }
  },

  clearAll: async () => {
    try {
      localStorage.removeItem('pendingActions')
    } catch (error) {
      console.warn('Failed to clear all:', error)
    }
  },
}

export const db = {
  pendingActions: {
    add: async (data) => {
      const actions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
      const newAction = { ...data, id: Date.now() + Math.random().toString(36).substr(2, 5) }
      actions.push(newAction)
      localStorage.setItem('pendingActions', JSON.stringify(actions))
      return newAction
    },
    where: () => ({
      equals: () => ({
        toArray: async () => {
          const actions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
          return actions.filter(a => !a.synced)
        }
      })
    }),
    clear: async () => {
      localStorage.removeItem('pendingActions')
    }
  }
}
