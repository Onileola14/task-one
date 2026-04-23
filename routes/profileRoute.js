const express = require("express");
const {
  createProfile,
  getSingleProfile,
  getAllProfiles,
  deleteProfile,
  searchProfiles,
} = require("../controllers/profile");

const router = express.Router();


router.route("/").post(createProfile).get(getAllProfiles);

router.route("/search").get(searchProfiles);

router.route("/:id").get(getSingleProfile).delete(deleteProfile);

module.exports = router;