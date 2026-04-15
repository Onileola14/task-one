const Profile = require("../models/Profile");
const fetchApis = require("../utils/fetchApi");
const classifyAge = require("../utils/classifyAge");
const { v7: uuidv7 } = require("uuid");

const createProfile = async (req, res) => {
  const { name } = req.body;

  //  Validation
  if (name === undefined || name === "") {
    return res.status(400).json({
      status: "error",
      message: "Name is required",
    });
  }

  if (typeof name !== "string") {
    return res.status(422).json({
      status: "error",
      message: "Name must be a string",
    });
  }

  const lowerName = name.toLowerCase();

  // Idempotency check
  const existing = await Profile.findOne({ name: lowerName });
  if (existing) {
    return res.status(200).json({
      status: "success",
      message: "Profile already exists",
      data: existing,
    });
  }

  // 🔹 Fetch APIs
  const { gender, age, country } = await fetchApis(lowerName);

  // 🔹 Edge Cases
  if (!gender.gender || gender.count === 0) {
    return res.status(404).json({
      status: "error",
      message: "Gender data unavailable",
    });
  }

  if (age.age === null) {
    return res.status(404).json({
      status: "error",
      message: "Age data unavailable",
    });
  }

  if (!country.country || country.country.length === 0) {
    return res.status(404).json({
      status: "error",
      message: "Country data unavailable",
    });
  }

  // 🔹 Get highest probability country
  const topCountry = country.country.reduce((max, curr) =>
    curr.probability > max.probability ? curr : max,
  );

  // 🔹 Build Object
  const profileData = {
    id: uuidv7(),
    name: lowerName,
    gender: gender.gender,
    gender_probability: gender.probability,
    sample_size: gender.count,
    age: age.age,
    age_group: classifyAge(age.age),
    country_id: topCountry.country_id,
    country_probability: topCountry.probability,
    created_at: new Date().toISOString(),
  };

  // 🔹 Save
  const profile = await Profile.create(profileData);

  return res.status(200).json({
    status: "success",
    data: profile,
  });
};

module.exports = { createProfile };
