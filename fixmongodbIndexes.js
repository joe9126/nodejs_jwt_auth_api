require("dotenv").config();
const dbURI = process.env.DB_URI;
const port = process.env.PORT;
const User = require("./models/User");

const mongoose = require("mongoose");
mongoose
  .connect(dbURI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(async () => {
    console.log("DB connection established");
    try {
      await User.collection.dropIndex("email_1");
      await User.collection.createIndex({ email: 1 }, { unique: true });
      console.log("created unique index on email");
    } catch (err) {
      console.log(err);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch((err) => console.log("Connection error: ", err));
