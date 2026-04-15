const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  id: String,
  name: { type: String, unique: true },
  gender: String,
  gender_probability: Number,
  sample_size: Number,
  age: Number,
  age_group: String,
  country_id: String,
  country_probability: Number,
  created_at: String,
});

module.exports = mongoose.model("Profile", ProfileSchema);
