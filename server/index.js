// server.js
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

// ✅ CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

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
    pass: process.env.EMAIL_PASS, // Use App Password if 2FA enabled
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
    console.log("Emails to send:", parsedEmails);
  } catch (err) {
    console.error("❌ Invalid emailList format:", err);
    return res.status(400).send({ success: false, error: "Invalid emailList format" });
  }

  if (!parsedEmails.length) {
    return res.status(400).send({ success: false, error: "No emails provided" });
  }

  try {
    const attachments = req.files
      ? req.files.map((file) => ({
          filename: file.originalname,
          content: file.buffer,
        }))
      : [];

    console.log("Attachments:", attachments.map((a) => a.filename));

    for (const recipient of parsedEmails) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: subject || "SmartMail Automation System",
        text: msg,
        attachments,
      });
      console.log(`✅ Email sent to ${recipient}`);
    }

    res.send({ success: true });
  } catch (err) {
    console.error("❌ Error sending emails:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// Server port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
