const { StatusCodes } = require('http-status-codes');
const Profile = require("../models/Profile");
const fetchApis = require("../utils/fetchApi");
const classifyAge = require("../utils/classifyAge");
const { v7: uuidv7 } = require("uuid");

const createProfile = async (req, res) => {
  const { name } = req.body;

  //  Validation
  if (name === undefined || name === "") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message: "Name is required",
    });
  }

  if (typeof name !== "string") {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      status: "error",
      message: "Name must be a string",
    });
  }

  const lowerName = name.toLowerCase();

  // Idempotency check
  const existing = await Profile.findOne({ name: lowerName });
  if (existing) {
    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Profile already exists",
      data: existing,
    });
  }

  // 🔹 Fetch APIs
  const { gender, age, country } = await fetchApis(lowerName);

  // 🔹 Edge Cases
  if (!gender.gender || gender.count === 0) {
    return res.status(StatusCodes.BAD_GATEWAY).json({
      status: "error",
      message: "Gender data unavailable",
    });
  }

  if (age.age === null) {
    return res.status(StatusCodes.BAD_GATEWAY).json({
      status: "error",
      message: "Age data unavailable",
    });
  }

  if (!country.country || country.country.length === 0) {
    return res.status(StatusCodes.BAD_GATEWAY).json({
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

  return res.status(StatusCodes.CREATED).json({
    status: "success",
    data: profile,
  });
};


const getSingleProfile = async (req, res) => {
  const { id } = req.params;
  const profile = await Profile.findOne({ id });

  if (!profile) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: "error",
      message: "Profile not found",
    });
  }

  return res.status(StatusCodes.OK).json({
    status: "success",
    data: profile,
  });
};

const getAllProfiles = async (req, res) => {
  const { gender, country_id, age_group } = req.query;

  const queryObject = {};

  // Case-insensitive filtering
  if (gender) {
    queryObject.gender = new RegExp(`^${gender}$`, "i");
  }

  if (country_id) {
    queryObject.country_id = new RegExp(`^${country_id}$`, "i");
  }

  if (age_group) {
    queryObject.age_group = new RegExp(`^${age_group}$`, "i");
  }

  const profiles = await Profile.find(queryObject).select(
    "id name gender age age_group country_id"
  );

  return res.status(StatusCodes.OK).json({
    status: "success",
    count: profiles.length,
    data: profiles,
  });
};
const deleteProfile = async (req, res) => {
  const { id } = req.params;

  const profile = await Profile.findOneAndDelete({ id });

  if (!profile) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: "error",
      message: "Profile not found",
    });
  }

  return res.status(StatusCodes.NO_CONTENT).send();
};


module.exports = { createProfile, getSingleProfile, getAllProfiles, deleteProfile };
