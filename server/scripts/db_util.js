import connectDB from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/user.model.js"; // Assuming you might want to interact with the User model

const runDbScript = async () => {
  await connectDB();

  try {
    console.log("Connected to MongoDB. Running database script...");

    // --- Database Operations Go Here ---
    // Example: List all users with null email
    console.log("Finding users with null email...");
    const nullEmailUsers = await User.find({ email: null });
    console.log("Users with null email:", nullEmailUsers.length);
    nullEmailUsers.forEach((user) =>
      console.log(`  - User ID: ${user._id}, Phone: ${user.phoneNumber}`),
    );

    // Example: Drop the specific index if it exists (for troubleshooting)
    // This is an example from our previous discussion. Use with caution.
    // try {
    //     await mongoose.connection.db.collection('users').dropIndex('email_1');
    //     console.log('Dropped index: email_1');
    // } catch (error) {
    //     if (error.codeName === 'IndexNotFound') {
    //         console.log('Index email_1 not found, no need to drop.');
    //     } else {
    //         console.error('Error dropping index email_1:', error.message);
    //     }
    // }

    // Example: Ensure partial indexes are created (Mongoose does this on model definition)
    // When your app starts, Mongoose attempts to ensure these indexes exist.
    // No explicit command needed here unless you want to force creation for a specific scenario.
    // await User.syncIndexes(); // Use this if you want to explicitly sync indexes

    // --- End Database Operations ---

    console.log("Database script finished.");
  } catch (error) {
    console.error("Error during database script execution:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

runDbScript();
