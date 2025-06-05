const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { isEmail } = require("validator");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 5,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [isEmail, " Please enter a valid email"],
    },
    firstname: {
      type: String,
      required: true,
      minlength: [3, "First name must be at least 3 characters"],
    },
    lastname: {
      type: String,
      required: true,
      minlength: [3, "Last name must be at least 3 characters"],
    },
    phonenumber: String,
    profilephoto: {
      type: String,
      default: "https://placehold.co/400",
    },
    role: {
      type: String,
      enum: ["guest", "admin"],
      default: "guest",
    },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalcode: String,
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiration: Date,
  },
  { timestamps: true }
);

//trigger mongoose hook for password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Prevent double hashing on update
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

/**Login static */
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    if (user.isVerified) {
      const auth = await bcrypt.compare(password, user.password);
      if (auth) {
        return user;
      }
      throw Error("Incorrect password");
    }
    throw Error("Email not verified");
  }

  throw Error("Incorrect email");
};

module.exports = mongoose.model("User", userSchema);
