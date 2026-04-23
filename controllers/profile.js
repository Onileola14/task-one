const { StatusCodes } = require("http-status-codes");
const Profile = require("../models/Profile");
const fetchApis = require("../utils/fetchApi");
const classifyAge = require("../utils/classifyAge");
const { v7: uuidv7 } = require("uuid");

// ====================== CREATE PROFILE ======================
const createProfile = async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message: "Name is required and must be a string",
    });
  }

  const lowerName = name.toLowerCase();

  const existing = await Profile.findOne({ name: lowerName });
  if (existing) {
    return res.status(200).json({
      status: "success",
      message: "Profile already exists",
      data: existing,
    });
  }

  const { gender, age, country } = await fetchApis(lowerName);

  if (!gender.gender || gender.count === 0) {
    return res.status(502).json({
      status: "error",
      message: "Genderize failed",
    });
  }

  if (age.age === null) {
    return res.status(502).json({
      status: "error",
      message: "Agify failed",
    });
  }

  if (!country.country || country.country.length === 0) {
    return res.status(502).json({
      status: "error",
      message: "Nationalize failed",
    });
  }

  const topCountry = country.country.reduce((max, curr) =>
    curr.probability > max.probability ? curr : max
  );

  const countryNames = {
    NG: "Nigeria",
    KE: "Kenya",
    GH: "Ghana",
    US: "United States",
    GB: "United Kingdom",
  };

  const profile = await Profile.create({
    id: uuidv7(),
    name: lowerName,
    gender: gender.gender,
    gender_probability: gender.probability,
    age: age.age,
    age_group: classifyAge(age.age),
    country_id: topCountry.country_id,
    country_name: countryNames[topCountry.country_id] || "Unknown",
    country_probability: topCountry.probability,
    created_at: new Date(),
  });

  res.status(201).json({
    status: "success",
    data: profile,
  });
};

// ====================== GET SINGLE ======================
const getSingleProfile = async (req, res) => {
  const { id } = req.params;

  const profile = await Profile.findOne({ id });

  if (!profile) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: profile,
  });
};

// ====================== GET ALL (FILTER + SORT + PAGINATION) ======================
const getAllProfiles = async (req, res) => {
  const {
    gender,
    age_group,
    country_id,
    min_age,
    max_age,
    min_gender_probability,
    min_country_probability,
    sort_by,
    order,
    page = 1,
    limit = 10,
  } = req.query;

  const query = {};

  // Filters
  if (gender) query.gender = gender.toLowerCase();
  if (age_group) query.age_group = age_group.toLowerCase();
  if (country_id) query.country_id = country_id.toUpperCase();

  if (min_age || max_age) {
    query.age = {};
    if (min_age) query.age.$gte = parseInt(min_age);
    if (max_age) query.age.$lte = parseInt(max_age);
  }

  if (min_gender_probability) {
    query.gender_probability = { $gte: parseFloat(min_gender_probability) };
  }

  if (min_country_probability) {
    query.country_probability = { $gte: parseFloat(min_country_probability) };
  }

  // Sorting
  const allowedSort = ["age", "created_at", "gender_probability"];
  let sortOption = { created_at: -1 };

  if (sort_by) {
    if (!allowedSort.includes(sort_by)) {
      return res.status(422).json({
        status: "error",
        message: "Invalid query parameters",
      });
    }

    const direction = order === "asc" ? 1 : -1;
    sortOption = { [sort_by]: direction };
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

  const total = await Profile.countDocuments(query);

  const profiles = await Profile.find(query)
    .sort(sortOption)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .select("-__v");

  res.status(200).json({
    status: "success",
    page: pageNum,
    limit: limitNum,
    total,
    data: profiles,
  });
};

// ====================== NLP PARSER ======================
const parseNaturalLanguageQuery = (query) => {
  if (!query || typeof query !== "string") return null;

  const q = query.toLowerCase().trim();
  const filters = {};

  // Gender
  const genders = [];
  if (/\bmale(s)?\b/.test(q)) genders.push("male");
  if (/\bfemale(s)?\b/.test(q)) genders.push("female");

  if (genders.length === 1) {
    filters.gender = genders[0];
  } else if (genders.length > 1) {
    filters.gender = { $in: genders };
  }

  // Age group
  if (/\bchild|children\b/.test(q)) filters.age_group = "child";
  if (/\bteenager|teenagers\b/.test(q)) filters.age_group = "teenager";
  if (/\badult|adults\b/.test(q)) filters.age_group = "adult";
  if (/\bsenior|seniors\b/.test(q)) filters.age_group = "senior";

  // Age rules
  if (/\byoung\b/.test(q)) {
    filters.age = { ...(filters.age || {}), $gte: 16, $lte: 24 };
  }

  const above = q.match(/\b(?:above|over|greater than|more than)\s*(\d+)/);
  if (above) {
    filters.age = { ...(filters.age || {}), $gte: parseInt(above[1]) };
  }

  const below = q.match(/\b(?:below|under|less than)\s*(\d+)/);
  if (below) {
    filters.age = { ...(filters.age || {}), $lte: parseInt(below[1]) };
  }

  // Country
  const countryMap = {
    nigeria: "NG",
    kenya: "KE",
    ghana: "GH",
    usa: "US",
    uk: "GB",
  };

  for (const key in countryMap) {
    if (new RegExp(`\\b${key}\\b`).test(q)) {
      filters.country_id = countryMap[key];
    }
  }

  if (Object.keys(filters).length === 0) return null;

  return filters;
};

// ====================== SEARCH ======================
const searchProfiles = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({
      status: "error",
      message: "Invalid query parameters",
    });
  }

  const filters = parseNaturalLanguageQuery(q);

  if (!filters) {
    return res.status(400).json({
      status: "error",
      message: "Unable to interpret query",
    });
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

  const total = await Profile.countDocuments(filters);

  const profiles = await Profile.find(filters)
    .sort({ created_at: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .select("-__v");

  res.status(200).json({
    status: "success",
    page: pageNum,
    limit: limitNum,
    total,
    data: profiles,
  });
};

// ====================== DELETE ======================
const deleteProfile = async (req, res) => {
  const { id } = req.params;

  const profile = await Profile.findOneAndDelete({ id });

  if (!profile) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Profile deleted",
  });
};

module.exports = {
  createProfile,
  getSingleProfile,
  getAllProfiles,
  searchProfiles,
  deleteProfile,
};