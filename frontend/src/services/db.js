// Simple mock database for offline support
export const db = {
  pendingActions: {
    add: async (data) => {
      console.log('Adding pending action:', data)
      return { id: Date.now() }
    },
    count: async () => 0,
    toArray: async () => [],
    delete: async () => {},
    clear: async () => {},
  }
}
