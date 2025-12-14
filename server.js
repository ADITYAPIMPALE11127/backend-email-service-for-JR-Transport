import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------- HEALTH / PING ROUTE -------------------- */
/* Used by UptimeRobot to keep server awake */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* -------------------- ROOT TEST ROUTE -------------------- */
app.get("/", (req, res) => {
  res.send("Email service running");
});

/* -------------------- EMAIL TRANSPORTER -------------------- */
const transporter = nodemailer.createTransport({
  service: "yahoo",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Yahoo App Password
  },
});

// Verify transporter credentials
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Transporter verification failed:", error);
  } else {
    console.log("✅ Transporter is ready to send emails");
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
      from: `"Website Enquiry" <${process.env.EMAIL_USER}>`,
      to: "jrtransportco@yahoo.com",
      subject: " New Enquiry from Website",
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

    // Send email and log info
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent info:", info);

    // Optional: send info back to frontend for testing
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      emailInfo: info, // <-- remove in production
    });
  } catch (error) {
    console.error("❌ Email send error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email. Check server logs for details.",
      error: error.message, // optional for debugging
    });
  }
});

/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
