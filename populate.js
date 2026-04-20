require("dotenv").config();
const Profile = require("./models/Profile");
const Profile_data = require("./seed_profiles.json");
const connectDB = require("./db/connectDB");

connectDB(process.env.MONGO_URI);
Profile.deleteMany();
Profile.create(Profile_data);
console.log("Database populated successfully!");

