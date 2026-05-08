const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  id: String,
  github_id: { type: String, unique: true },
  username: String,
  email: String,
  avatar_url: String,
  role: {
    type: String,
    enum: ["admin", "analyst"],
    default: "analyst",
  },
  is_active: { type: Boolean, default: true },
  last_login_at: Date,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
