const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://fame:Sthcnh4525!@power.rgeuppm.mongodb.net/?appName=Power';

async function cleanupUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(connectionString);
    console.log('Connected successfully');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const countBefore = await usersCollection.countDocuments();
    console.log(`Users before cleanup: ${countBefore}`);

    const result = await usersCollection.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users`);

    const countAfter = await usersCollection.countDocuments();
    console.log(`Users after cleanup: ${countAfter}`);

    await mongoose.connection.close();
    console.log('Cleanup complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupUsers();
