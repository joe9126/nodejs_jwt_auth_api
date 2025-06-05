const nodemailer = require("nodemailer");
require("dotenv").config();
const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Prime Hotel" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return info;
  console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
