const { connectDatabase } = require('../db/connection');
const { createStore } = require('../db/store');
const connection = connectDatabase();
module.exports = { db: createStore(connection.orm), closeDatabase: connection.close };
