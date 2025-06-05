const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const maxAge = 3 * 24 * 60 * 60 * 1000; //expires in three days

/**Create JWT token */
const createToken = (id) => {
  const token = jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: maxAge,
  });
  return token;
};

/**Verify Token */
const verifyToken = async (user_token) => {
  const user = await User.findOne({
    resetToken: user_token,
    resetTokenExpiration: { $gt: Date.now() }, //$gt is mongoose for greater than
  });

  return user;
};

/**Error handling */
const handleErrors = (err) => {
  console.log(err);
  let errors = {
    email: "",
    password: "",
  };
  //custom error messages when logging in
  if (err.message === "Incorrect password") {
    errors.password = "Wrong password";
  }
  if (err.message === "Incorrect email") {
    errors.password = "Email not found";
  }
  if (err.message === "Email not verified") {
    errors.password = "You need to verify your email";
  }

  // Check for duplicate key error during signup
  if (err.code === 11000 && err.keyPattern?.email) {
    console.log("DUPLICATE ERROR:", err);
    errors.email = "Email is already registered";
    return errors;
  }

  // Handle validation errors during signup
  if (err.name === "ValidationError") {
    Object.values(err.errors).forEach((error) => {
      errors[error.path] = error.message;
    });
  }

  return errors;
};

/**Signup Post */
exports.signupPost = async (req, res) => {
  const userinfo = req.body;
  //console.log(userinfo);
  try {
    const user = await User.create(userinfo);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.verificationToken = token;
      user.save();
      const verificationUrl = `${process.env.BASE_URL}/verify-email/${token}`;

      const html = `<h2>Verify Your Email</h2
                    <p>Please click the link below to verify your email address:</p>
                    <a href = "${verificationUrl}">${verificationUrl}</a>
                 `;
      const emailsent = await sendEmail(user.email, "Email Verification", html);
      if (emailsent) {
        res.status(201).json({
          userid: user._id,
          message: "Signup successful. Verification email sent.",
        });
      }
    }
  } catch (err) {
    const errors = handleErrors(err);
    res.status(500).json({ errors: errors });
  }
};

/**Verify Email after signup */
exports.verifyEmail = async (req, res) => {
  const token = req.params.token;
  console.log("verification token:", token);
  try {
    const user = await User.findOne({ verificationToken: token });
    console.log(user);
    if (!user) {
      return res
        .status(400)
        .json({ error: "Your verification link is invalid." });
    }
    user.isVerified = true;
    user.verificationToken = null; // clear token
    await user.save();
    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
};

/** Login Post */
exports.loginPost = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    //create jwt token
    const token = createToken(user._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge,
      sameSite: "lax",
      secure: false,
    });
    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

/**Password reset request Post */
exports.password_reset_request_Post = async (req, res) => {
  const email = req.body;

  try {
    const user = await User.findOne(email);

    if (!user) {
      return res.status(404).json({ error: "Email not found" });
    }
    const resetToken = createToken(user._id);
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 1000 * 60 * 60; //expires in an hour
    const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;
    const emailHtml = `<h2>Password Reset</h2>
                        <p>Hello ${user.firstname},<p>
                       <p>You requested to reset your password. Please click the link below to proceed.<br>
                       <p>The link expires in 1 hour from now.</p><br></>
                       <a href=${resetUrl}>${resetUrl}</a>`;
    await sendEmail(user.email, "Password Reset", emailHtml);

    user.save();
    res
      .status(200)
      .json({ message: "Check your inbox for a password reset link." });
  } catch (err) {
    res.status(500).json({ err });
  }
};

/** Verify Password Reset Token Get*/
exports.verify_password_reset_token_Post = async (req, res) => {
  const user_token = req.params.token;
  try {
    const user = await User.findOne({
      resetToken: user_token,
      resetTokenExpiration: { $gt: Date.now() }, //$gt is mongoose for greater than
    });
    if (!user) {
      return res.status(400).json({
        error: "Reset link is invalid or expired. Click reset link again.",
      });
    }

    res.status(200).json({
      message: "Password reset token is valid",
      resetToken: user.resetToken,
    });
  } catch (err) {
    res.status(500).json({ err });
  }
};

/**  Reset Password Post  */
exports.reset_password_Post = async (req, res) => {
  const user_token = req.params.token;

  try {
    const user = await verifyToken(user_token);
    // console.log(user);
    if (!user) {
      return res.status(400).json({
        error: "Reset link is invalid or expired. Click reset link again.",
      });
    }

    const salt = await bcrypt.genSalt();
    const new_password = await bcrypt.hash(req.body.password, salt);
    user.password = new_password;
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();
    res.status(200).json({ message: "Password reset successful." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
};
