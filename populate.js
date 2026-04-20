require("dotenv").config();
const Profile = require("./models/Profile");
const Profile_data = require("./seed_profiles.json")
const connectDB = require("./db/connectDB")

const populate = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        await Profile.deleteMany();
        await Profile.create(Profile_data);
        console.log("Database populated successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("Error populating database:", error);
        process.exit(1);
    }   
}

populate();