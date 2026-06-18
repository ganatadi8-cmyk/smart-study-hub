const admin = require('firebase-admin');

// Note: For a real hackathon project, place service account JSON in root and load it.
// Here we initialize admin without credentials which relies on GOOGLE_APPLICATION_CREDENTIALS 
// or it's a mock setup if just using client SDK for everything. 
// However, the prompt requested backend Firebase Admin usage.

let db;
let auth;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'dummy_project_id'
    });
    console.log('Firebase Admin initialized successfully');
    db = admin.firestore();
    auth = admin.auth();
  } else {
    throw new Error('No GOOGLE_APPLICATION_CREDENTIALS set.');
  }
} catch (error) {
  console.log('Using Mock Firebase DB for UI Testing mode due to:', error.message);
  
  let mockResources = [
    {
      id: "mock_preload_1",
      title: "Data Structures Initial Notes",
      branch: "CSE",
      subject: "Data Structures",
      type: "Notes",
      description: "Complete notes covering arrays, linked lists, stacks, queues, and trees.",
      uploadedBy: "mock_uid_123",
      createdAt: new Date().toISOString(),
      fileURL: "",
      fileName: ""
    }
  ];

  let mockUsers = [
    {
      id: "mock_uid_123",
      name: "Gana",
      email: "user@email.com",
      role: "Student",
      createdAt: new Date().toISOString(),
      testScore: 85,
      resourcesUploaded: 1
    },
    {
      id: "mock_uid_admin_1",
      name: "System Admin",
      email: "admin@smartstudy.com",
      role: "Admin",
      createdAt: new Date().toISOString(),
      testScore: 0,
      resourcesUploaded: 5
    },
    {
      id: "mock_uid_faculty_1",
      name: "Prof. Rajesh",
      email: "rajesh@smartstudy.com",
      role: "Faculty",
      createdAt: new Date().toISOString(),
      testScore: 0,
      resourcesUploaded: 12
    }
  ];

  let mockTests = [
    {
      id: "test_1",
      subject: "Data Structures",
      branch: "CSE",
      questions: [
        {
          question: "What is a stack?",
          options: ["LIFO data structure", "FIFO data structure", "Tree structure", "Graph structure"],
          correctAnswer: "LIFO data structure"
        },
        {
          question: "What is the time complexity of searching in a balanced BST?",
          options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
          correctAnswer: "O(log n)"
        },
        {
          question: "Which data structure uses LIFO?",
          options: ["Array", "Queue", "Stack", "Linked List"],
          correctAnswer: "Stack"
        }
      ]
    }
  ];

  let mockDiscussions = [
    {
      id: "thread_1",
      user: "Gana",
      role: "Student",
      question: "Can someone thoroughly explain how to balance Binary Search Trees?",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      replies: [
        {
          id: "reply_1",
          user: "Prof. Rajesh",
          role: "Faculty",
          message: "An AVL Tree balances itself by checking the height difference of left and right subtrees. If the difference is > 1, it performs a rotation.",
          timestamp: new Date(Date.now() - 40000000).toISOString()
        }
      ]
    }
  ];

  db = {
    collection: (name) => {
      let filters = [];
      const queryApi = {
        where: (field, op, val) => {
          filters.push({field, op, val});
          return queryApi;
        },
        orderBy: () => queryApi,
        get: async () => {
          let results = [];
          if (name === 'resources') results = [...mockResources];
          if (name === 'users') results = [...mockUsers];
          if (name === 'tests') results = [...mockTests];
          if (name === 'discussions') results = [...mockDiscussions];
          
          filters.forEach(f => {
            if (f.op === '==') {
              results = results.filter(r => r[f.field] === f.val);
            }
          });
          return {
            forEach: (cb) => {
              results.forEach(r => cb({ id: r.id, data: () => r, exists: true }));
            }
          };
        },
        add: async (data) => {
          const id = 'mock_' + Date.now();
          if (name === 'resources') {
            mockResources.push({ id, ...data });
          } else if (name === 'users') {
            mockUsers.push({ id, ...data });
          } else if (name === 'tests') {
            mockTests.push({ id, ...data });
          } else if (name === 'discussions') {
            mockDiscussions.push({ id, ...data });
          }
          return { id };
        },
        doc: (id) => {
          return {
            get: async () => {
               let found = null;
               if (name === 'resources') found = mockResources.find(r => r.id === id);
               if (name === 'users') found = mockUsers.find(u => u.id === id);
               if (name === 'tests') found = mockTests.find(t => t.id === id);
               if (name === 'discussions') found = mockDiscussions.find(d => d.id === id);
               
               return { 
                 exists: !!found, 
                 data: () => found || {}
               };
            },
            delete: async () => {
               if (name === 'resources') {
                 mockResources = mockResources.filter(r => r.id !== id);
               } else if (name === 'users') {
                 mockUsers = mockUsers.filter(u => u.id !== id);
               } else if (name === 'tests') {
                 mockTests = mockTests.filter(t => t.id !== id);
               } else if (name === 'discussions') {
                 mockDiscussions = mockDiscussions.filter(d => d.id !== id);
               }
            },
            update: async (updates) => {
               if (name === 'resources') {
                 const idx = mockResources.findIndex(r => r.id === id);
                 if (idx !== -1) mockResources[idx] = { ...mockResources[idx], ...updates };
               } else if (name === 'users') {
                 const idx = mockUsers.findIndex(u => u.id === id);
                 if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx], ...updates };
               } else if (name === 'tests') {
                 const idx = mockTests.findIndex(t => t.id === id);
                 if (idx !== -1) mockTests[idx] = { ...mockTests[idx], ...updates };
               } else if (name === 'discussions') {
                 const idx = mockDiscussions.findIndex(d => d.id === id);
                 if (idx !== -1) mockDiscussions[idx] = { ...mockDiscussions[idx], ...updates };
               }
            }
          };
        }
      };
      return queryApi;
    }
  };

  auth = {
    verifyIdToken: async () => ({ uid: 'mock_uid' })
  };
}

module.exports = { admin, db, auth };
