// MOCK FIREBASE CONFIGURATION FOR LOCAL TESTING
// Bypasses the need for valid API keys in .env

export const auth = {
  currentUser: null
};

export const db = {
  collection: () => ({
    where: () => ({
      get: async () => ({
        empty: true,
        forEach: () => {}
      })
    }),
    doc: () => ({ get: async () => ({ exists: false }) })
  })
};

export const storage = {};

export default { auth, db, storage };

