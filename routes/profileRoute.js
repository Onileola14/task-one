const express = require("express");
const {
  createProfile,
  getSingleProfile,
  getAllProfiles,
  searchProfiles,
  deleteProfile,
} = require("../controllers/profile");

const authorize = require("../middlewares/authorize");

const router = express.Router();

// 🔓 Read (analyst + admin)
router.get("/", authorize("admin", "analyst"), getAllProfiles);
router.get("/search", authorize("admin", "analyst"), searchProfiles);
router.get("/:id", authorize("admin", "analyst"), getSingleProfile);

// 🔒 Admin only
router.post("/", authorize("admin"), createProfile);
router.delete("/:id", authorize("admin"), deleteProfile);

module.exports = router;