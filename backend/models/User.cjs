const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty"], default: "student" },
  createdAt: { type: Date, default: Date.now },
  verificationCode: String,
  verificationExpires: Date,
  isVerified: { type: Boolean, default: false },
  resetCode: String,
  resetCodeExpires: Date,
});

module.exports = mongoose.model("User", UserSchema);
