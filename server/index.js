const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
require("dotenv").config();

const app = express();

// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://smartmail-automation-system-client.onrender.com",
];

// ✅ Middleware to handle CORS dynamically
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Preflight request
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// ✅ Multer setup for attachments
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test route
app.get("/", (req, res) => res.send("Server running 🚀"));

// Send email endpoint
app.post("/sendemail", upload.array("attachments"), async (req, res) => {
  const { subject, msg, emailList } = req.body;

  let parsedEmails = [];
  try {
    parsedEmails = JSON.parse(emailList || "[]");
  } catch (err) {
    console.error("Invalid emailList format:", err);
    return res.status(400).json({ success: false, error: "Invalid email list JSON" });
  }

  if (!parsedEmails.length)
    return res.status(400).json({ success: false, error: "Email list is empty" });

  try {
    for (const recipient of parsedEmails) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: subject || "SmartMail Automation System",
        text: msg,
        attachments: req.files.map((file) => ({
          filename: file.originalname,
          content: file.buffer,
        })),
      });
      console.log(`✅ Email sent to ${recipient}`);
    }
    res.json({ success: true, message: "Emails sent successfully" });
  } catch (err) {
    console.error("❌ Error sending emails:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to send emails", details: err.message });
  }
});

// Server port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
