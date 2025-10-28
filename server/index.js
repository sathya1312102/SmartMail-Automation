const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
require("dotenv").config();

const app = express();

// ✅ CORS Setup (allow frontend URL or fallback)
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Multer setup for multiple file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Nodemailer transporter setup (use Gmail App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Endpoint to send emails
app.post("/sendemail", upload.array("attachments"), async (req, res) => {
  const { subject, msg, emailList } = req.body;
  const parsedEmails = JSON.parse(emailList || "[]");

  try {
    for (const recipient of parsedEmails) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: subject || "SmartMail Automation System",
        text: msg,
        attachments: req.files.map((file) => ({
          filename: file.originalname,
          content: file.buffer,
        })),
      };
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${recipient}`);
    }
    res.send(true);
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.send(false);
  }
});

// ✅ Render PORT setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
