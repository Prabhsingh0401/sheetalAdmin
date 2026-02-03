import connectDB from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/user.model.js"; // Import your User model

const ensureIndexes = async () => {
  await connectDB();

  try {
    console.log("Connected to MongoDB. Ensuring indexes...");

    // Step 1: Drop potentially conflicting old indexes
    console.log('Attempting to drop old "email_1" index...');
    try {
      await mongoose.connection.db.collection("users").dropIndex("email_1");
      console.log('Successfully dropped old "email_1" index.');
    } catch (error) {
      if (error.codeName === "IndexNotFound") {
        console.log('Old "email_1" index not found, no need to drop.');
      } else {
        console.error('Error dropping "email_1" index:', error.message);
        // Continue despite error, as it might be a different issue, or already dropped
      }
    }

    console.log('Attempting to drop old "phoneNumber_1" index...');
    try {
      await mongoose.connection.db
        .collection("users")
        .dropIndex("phoneNumber_1");
      console.log('Successfully dropped old "phoneNumber_1" index.');
    } catch (error) {
      if (error.codeName === "IndexNotFound") {
        console.log('Old "phoneNumber_1" index not found, no need to drop.');
      } else {
        console.error('Error dropping "phoneNumber_1" index:', error.message);
      }
    }

    // Step 2: Ensure the partial indexes defined in the User model are created
    console.log(
      "Ensuring partial indexes from User model are created/updated...",
    );
    await User.syncIndexes(); // This will create/update indexes based on the schema definition
    console.log("Partial indexes ensured successfully.");
  } catch (error) {
    console.error(
      "Error during index assurance script execution:",
      error.message,
    );
    process.exit(1); // Exit with error code
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

ensureIndexes();
