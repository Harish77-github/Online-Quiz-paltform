const mongoose = require("mongoose");

const connectDB = async () => {
  let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  mongoUri = mongoUri?.replace(
    /:\[([^@\]]+)@([^\]]+)\]\(mailto:[^)]+\)\//,
    (_match, rawPassword, host) => `:${encodeURIComponent(rawPassword)}@${host}/`
  );

  if (!mongoUri) {
    console.warn("MongoDB URI is not set (MONGO_URI/MONGODB_URI). Continuing without database connection.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    console.warn("Continuing without database connection.");
  }
};

module.exports = connectDB;
