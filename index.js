require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const authrouter = require("./routes/authRoutes");
const app = express();
const dbURI = process.env.DB_URI;
const port = process.env.PORT;
const json = require("express").json();

mongoose
  .connect(dbURI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("DB connection established");
    app.listen(port, async (req, res) => {
      console.log("Server running at port ", port);
    });
  })
  .catch((err) => console.log("Connection error: ", err));

app.use(json);
app.use(authrouter);
