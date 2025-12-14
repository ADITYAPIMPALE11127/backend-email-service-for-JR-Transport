import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------- HEALTH / PING ROUTE -------------------- */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* -------------------- ROOT TEST ROUTE -------------------- */
app.get("/", (req, res) => {
  res.send("Email service running");
});

/* -------------------- BREVO TRANSPORTER -------------------- */
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT, 10),
  secure: false, // TLS for port 587
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

// Optional: log env variables to verify
console.log("🔹 SMTP USER:", process.env.BREVO_SMTP_USER ? "✅ set" : "❌ missing");
console.log("🔹 SMTP PASS:", process.env.BREVO_SMTP_PASS ? "✅ set" : "❌ missing");

/* -------------------- Verify transporter -------------------- */
transporter.verify((error) => {
  if (error) {
    console.error("❌ Brevo SMTP verification failed:", error);
  } else {
    console.log("✅ Brevo SMTP ready to send emails");
  }
});

/* -------------------- ENQUIRY ROUTE -------------------- */
app.post("/api/enquiry", async (req, res) => {
  const { name, email, phone, company, message } = req.body;

  // Backend validation
  if (!name || !phone || !message) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields (name, phone, message)",
    });
  }

  try {
    const mailOptions = {
      from: `"Website Enquiry" <${process.env.BREVO_SMTP_USER}>`,
      to: "jrtransportco@yahoo.com",
      replyTo: email || process.env.BREVO_SMTP_USER,
      subject: "New Enquiry from Website",
      html: `
        <h2>New Enquiry Received</h2>
        <hr />
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent info:", info);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      emailInfo: info, // optional, remove in production
    });
  } catch (error) {
    console.error("❌ Email send error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email. Check server logs for details.",
      error: error.message,
    });
  }
});

/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
