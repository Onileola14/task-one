const express = require("express");
const { createProfile,getSingleProfile, getAllProfiles, deleteProfile  } = require("../controllers/profile");
const router = express.Router();

router.route("/").post(createProfile).get(getAllProfiles);
router.route("/:id").get(getSingleProfile).delete(deleteProfile);

module.exports = router
