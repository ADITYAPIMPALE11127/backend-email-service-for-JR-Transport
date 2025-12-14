import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "yahoo",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: "jrtransportco@yahoo.com",
  subject: "Test Email",
  text: "Hello! This is a test from Nodemailer",
}, (err, info) => {
  if (err) console.error("Send error:", err);
  else console.log("Email sent info:", info);
});
