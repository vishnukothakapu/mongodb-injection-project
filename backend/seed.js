// seed.js (compat-friendly)
const fakerPkg = require('@faker-js/faker');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mongo_inject_demo';

// Compatibility helper: try several possible faker shapes
const faker = (() => {
  if (fakerPkg.faker) return fakerPkg.faker; // some installs export { faker }
  return fakerPkg; // others export faker functions at top-level
})();

// helper to get first/last name across versions
function firstName() {
  return (
    (faker.name && faker.name.firstName && faker.name.firstName()) ||
    (faker.person && faker.person.firstName && faker.person.firstName()) ||
    // fallback to a simple built-in option
    (faker.name && faker.name.findName && (() => faker.name.findName().split(' ')[0])()) ||
    'John'
  );
}
function lastName() {
  return (
    (faker.name && faker.name.lastName && faker.name.lastName()) ||
    (faker.person && faker.person.lastName && faker.person.lastName()) ||
    (faker.name && faker.name.findName && (() => {
      const parts = faker.name.findName().split(' ');
      return parts.length > 1 ? parts.slice(1).join(' ') : 'Doe';
    })()) ||
    'Doe'
  );
}

function makeUsername(name, i) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '') + i;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    console.log('🧹 Existing users cleared');

    const users = [];
    const csvRows = [];
    // admin
    const adminPlain = 'adminpass';
    const adminHash = await bcrypt.hash(adminPlain, 10);
    users.push({
      username: 'admin',
      fullName: 'Site Administrator',
      email: 'admin@corp.local',
      password: adminPlain,
      role: 'admin',
    });
    csvRows.push(`admin,admin@corp.local,${adminPlain}`);

    // generate 199 users
    for (let i = 1; i <= 199; i++) {
      const first = firstName();
      const last = lastName();
      const fullName = `${first} ${last}`;
      const username = makeUsername(`${first}${last}`, i);
      const email = `${username}@example.com`;
      const passwordPlain = `pass${i}`;
      const passwordHash = await bcrypt.hash(passwordPlain, 10);

      users.push({
        username,
        fullName,
        email,
        password: passwordPlain,
        role: 'user',
      });

      csvRows.push(`${username},${email},${passwordPlain}`);
    }

    // optionally shuffle so admin isn't always first (uncomment if wanted)
    // users.sort(() => Math.random() - 0.5);

    await User.insertMany(users);
    console.log('✅ Seeded 200 users (199 names + 1 admin) successfully!');

    // write lookup CSV for convenience
    const outPath = path.join(__dirname, 'seed-credentials.csv');
    fs.writeFileSync(outPath, 'username,email,plainPassword\n' + csvRows.join('\n'));
    console.log(`🔐 Wrote credentials lookup to ${outPath}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding:', err);
    process.exit(1);
  }
}

seed();
