const router = require("express").Router();
const authController = require("../controllers/authController.js");

router.post("/signup", authController.signupPost);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/login", authController.loginPost);
router.post(
  "/password-reset-request",
  authController.password_reset_request_Post
);
router.get(
  "/verify-password-reset-token/:token",
  authController.verify_password_reset_token_Post
);
router.post("/reset-password/:token", authController.reset_password_Post);
module.exports = router;
