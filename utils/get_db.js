const { getDb } = require("../db/mongo");

const getCollection = async (collectionName) => {
  const db = await getDb();
  return db.collection(collectionName);
};

module.exports = {
  getCollection,
};
