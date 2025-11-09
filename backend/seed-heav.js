// seed-heavy.js  (DEMO ONLY)
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});
  // Insert one very long username and many copies
  const long = 'a'.repeat(2000); // long run of 'a's
  const docs = [];
  for (let i=0;i<2000;i++) docs.push({ username: long + i,email:long+i+'@gmail.com', password: 'x' });
  await User.collection.insertMany(docs);
  console.log('seeded heavy users');
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
