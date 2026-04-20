const { StatusCodes } = require("http-status-codes");
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
    return res.status(200).json({
      status: "success",
      message: "Profile already exists",
      data: existing,
    });
  }

  // 🔹 Fetch APIs
  const { gender, age, country } = await fetchApis(lowerName);

  // 🔹 Edge Cases
  // Genderize
  if (!gender.gender || gender.count === 0) {
    return res.status(502).json({
      status: "error",
      message: "Genderize returned an invalid response",
    });
  }

  // Agify
  if (age.age === null) {
    return res.status(502).json({
      status: "error",
      message: "Agify returned an invalid response",
    });
  }

  // Nationalize
  if (!country.country || country.country.length === 0) {
    return res.status(502).json({
      status: "error",
      message: "Nationalize returned an invalid response",
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

  return res.status(201).json({
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

// const getAllProfiles = async (req, res) => {
//   const { gender, country_id, age_group } = req.query;

//   const queryObject = {};

//   // Case-insensitive filtering
//   if (gender) {
//     queryObject.gender = new RegExp(`^${gender}$`, "i");
//   }

//   if (country_id) {
//     queryObject.country_id = new RegExp(`^${country_id}$`, "i");
//   }

//   if (age_group) {
//     queryObject.age_group = new RegExp(`^${age_group}$`, "i");
//   }

//   const profiles = await Profile.find(queryObject).select(
//     "id name gender age age_group country_id",
//   );

//   return res.status(StatusCodes.OK).json({
//     status: "success",
//     count: profiles.length,
//     data: profiles,
//   });
// };

// controllers/profileController.js


// ====================== GET /api/profiles ======================
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
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  const queryObject = {};

  // 1. Basic Filters (exact match, case-insensitive)
  if (gender) queryObject.gender = gender.toLowerCase();
  if (age_group) queryObject.age_group = age_group.toLowerCase();
  if (country_id) queryObject.country_id = country_id.toUpperCase();

  // 2. Age Range
  if (min_age || max_age) {
    queryObject.age = {};
    if (min_age) queryObject.age.$gte = parseInt(min_age);
    if (max_age) queryObject.age.$lte = parseInt(max_age);
  }

  // 3. Probability Filters
  if (min_gender_probability) {
    queryObject.gender_probability = { $gte: parseFloat(min_gender_probability) };
  }
  if (min_country_probability) {
    queryObject.country_probability = { $gte: parseFloat(min_country_probability) };
  }

  // 4. Validation for sort_by
  const allowedSortFields = ['age', 'created_at', 'gender_probability'];
  let sortOption = {};

  if (sort_by) {
    if (!allowedSortFields.includes(sort_by)) {
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        status: 'error',
        message: 'Invalid query parameters',
      });
    }
    const sortOrder = order === 'asc' ? 1 : -1;
    sortOption[sort_by] = sortOrder;
  } else {
    // Default sort: newest first
    sortOption = { created_at: -1 };
  }

  // 5. Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  try {
    const total = await Profile.countDocuments(queryObject);

    const profiles = await Profile.find(queryObject)
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-__v'); // exclude mongoose version key

    res.status(StatusCodes.OK).json({
      status: 'success',
      page: pageNum,
      limit: limitNum,
      total,
      data: profiles,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Server failure',
    });
  }
};

// ====================== GET /api/profiles/search (Natural Language) ======================
const searchProfiles = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q || typeof q !== 'string' || q.trim() === '') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Invalid query parameters',
    });
  }

  const filters = parseNaturalLanguageQuery(q.trim());

  if (!filters) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Unable to interpret query',
    });
  }

  // Reuse the same logic as getAllProfiles for pagination + sorting
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  try {
    const total = await Profile.countDocuments(filters);

    const profiles = await Profile.find(filters)
      .sort({ created_at: -1 }) // default newest first for search
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-__v');

    res.status(StatusCodes.OK).json({
      status: 'success',
      page: pageNum,
      limit: limitNum,
      total,
      data: profiles,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Server failure',
    });
  }
};

// ====================== Rule-based Natural Language Parser ======================
const parseNaturalLanguageQuery = (query) => {
  const q = query.toLowerCase();
  const filters = {};

  // Gender
  if (/\bmale(s)?\b/.test(q)) {
    filters.gender = 'male';
  } else if (/\bfemale(s)?\b/.test(q)) {
    filters.gender = 'female';
  }

  // Age Group
  if (/\b(child|children)\b/.test(q)) filters.age_group = 'child';
  else if (/\b(teenager|teenagers)\b/.test(q)) filters.age_group = 'teenager';
  else if (/\b(adult|adults)\b/.test(q)) filters.age_group = 'adult';
  else if (/\b(senior|seniors)\b/.test(q)) filters.age_group = 'senior';

  // Young = 16-24 (special rule)
  if (/\byoung\b/.test(q)) {
    filters.age = { $gte: 16, $lte: 24 };
  }

  // "above", "over", "greater than", "more than" → min_age
  const aboveMatch = q.match(/\b(?:above|over|greater than|more than)\s*(\d+)/);
  if (aboveMatch) {
    const minAge = parseInt(aboveMatch[1]);
    if (!filters.age) filters.age = {};
    filters.age.$gte = minAge;
  }

  // Country (look for "from <country>")
  const countryMap = {
    nigeria: 'NG',
    angola: 'AO',
    kenya: 'KE',
    benin: 'BJ',
    ghana: 'GH',
    egypt: 'EG',
    tunisia: 'TN',
    morocco: 'MA',
    senegal: 'SN',
    mali: 'ML',
    niger: 'NE',
    chad: 'TD',
    libya: 'LY',
    sudan: 'SD',
    ethiopia: 'ET',
    uganda: 'UG',
    tanzania: 'TZ',
  };

  const fromMatch = q.match(/\bfrom\s+(\w+)/);
  if (fromMatch) {
    const countryName = fromMatch[1];
    if (countryMap[countryName]) {
      filters.country_id = countryMap[countryName];
    }
  }

  // If no meaningful filter was extracted → cannot interpret
  if (Object.keys(filters).length === 0) {
    return null;
  }

  return filters;
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

module.exports = {
  createProfile,
  getSingleProfile,
  getAllProfiles,
  deleteProfile,
  searchProfiles,
};
