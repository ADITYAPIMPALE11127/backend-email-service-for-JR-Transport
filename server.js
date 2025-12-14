import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import SibApiV3Sdk from "sib-api-v3-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------- HEALTH / PING -------------------- */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* -------------------- ROOT -------------------- */
app.get("/", (req, res) => {
  res.send("Brevo Email API service running");
});

/* -------------------- BREVO CLIENT -------------------- */
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/* -------------------- ENQUIRY ROUTE -------------------- */
app.post("/api/enquiry", async (req, res) => {
  const { name, email, phone, company, message } = req.body;

  // Validate required fields
  if (!name || !phone || !message) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields (name, phone, message)",
    });
  }

  // Optional email validation
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
      to: [{ email: process.env.RECEIVER_EMAIL }],
      sender: { name: process.env.SENDER_NAME, email: process.env.SENDER_EMAIL },
      subject: "New Enquiry from Website",
      replyTo: { email: email || process.env.SENDER_EMAIL },
      htmlContent: `
        <h2>New Enquiry Received</h2>
        <hr />
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    const result = await emailApi.sendTransacEmail(sendSmtpEmail);

    console.log("📧 Email sent info:", result);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  } catch (error) {
    // Log full error details
    console.error("❌ Email send error:", error);

    // Extract Brevo response message if available
    let errorMessage = error.body?.message || error.message || "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: errorMessage,
    });
  }
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
