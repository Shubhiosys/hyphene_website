const path = require("path");
const dns = require("dns").promises;
const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Enforce HTTPS redirect in production environments (via x-forwarded-proto header)
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// 2. Normalize trailing slashes (e.g. /about/ -> /about) to prevent duplicate content
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith("/")) {
    const cleanUrl = req.path.slice(0, -1) + req.url.slice(req.path.length);
    return res.redirect(301, cleanUrl);
  }
  next();
});

// 3. Block access to forbidden directories and backend/dev configuration files
const forbiddenPaths = [
  "/temp",
  "/dev",
  "/node_modules",
  "/package.json",
  "/package-lock.json",
  "/server.js",
  "/port.html",
  "/port"
];

app.use((req, res, next) => {
  const cleanPath = req.path.toLowerCase().replace(/\/$/, "");
  const isForbidden = forbiddenPaths.some(p => cleanPath === p || cleanPath.startsWith(p + "/")) || 
                      req.path.includes(".env");
  if (isForbidden) {
    return res.status(403).sendFile(path.join(__dirname, "403.html"));
  }
  next();
});

// 4. Redirect standard index.html or clean index to root homepage (/) to prevent duplicate indexing
app.use((req, res, next) => {
  const cleanPath = req.path.toLowerCase().replace(/\/$/, "");
  if (req.path === "/index.html" || cleanPath === "/index") {
    return res.redirect(301, "/");
  }
  next();
});

// 5. Redirect any direct .html requests to their clean URL counterparts (excluding navbar.html and footer.html)
app.use((req, res, next) => {
  if (req.path.endsWith(".html") && !["/navbar.html", "/footer.html"].includes(req.path)) {
    const cleanUrl = req.path.slice(0, -5);
    return res.redirect(301, cleanUrl + req.url.slice(req.path.length));
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// 6. Explicit Clean URL route mappings
const validCleanRoutes = {
  "/": "index.html",
  "/about": "about.html",
  "/capabilities": "capabilities.html",
  "/career": "career.html",
  "/case-study": "case-study.html",
  "/claimpilot-landing": "claimpilot-landing.html",
  "/contact": "contact.html",
  "/how-it-works": "how-it-works.html",
  "/nurseops-landing": "nurseops-landing.html",
  "/privacy": "privacy.html",
  "/solutions": "solutions.html",
  "/terms": "terms.html"
};

Object.entries(validCleanRoutes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
});

// 7. Serve other static assets
app.use(express.static(__dirname));

const requiredConfig = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "NOTIFICATION_TO"];
const disposableDomains = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com"
]);

function hasMailConfig() {
  return requiredConfig.every((key) => Boolean(process.env[key]));
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function field(label, value) {
  return `
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#334155;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(value || "Not provided")}</td>
    </tr>
  `;
}

function hasControlCharacters(value) {
  return /[\u0000-\u001f\u007f]/.test(value);
}

function isMeaningfulMessage(message) {
  const normalized = message.toLowerCase().replace(/\s+/g, " ").trim();
  const letters = normalized.match(/[a-z]/g) || [];
  const vowels = normalized.match(/[aeiou]/g) || [];
  const words = normalized.match(/[a-z]{2,}/g) || [];
  const uniqueWords = new Set(words);
  const urls = normalized.match(/https?:\/\/|www\./g) || [];

  if (normalized.length < 20) {
    return false;
  }

  if (words.length < 4 || uniqueWords.size < 3) {
    return false;
  }

  if (letters.length >= 8 && vowels.length / letters.length < 0.18) {
    return false;
  }

  if (/(.)\1{4,}/.test(normalized)) {
    return false;
  }

  if (/\b(?:qfqf|asdf|test|testing|dummy|random|timepass|spam)\b/.test(normalized)) {
    return false;
  }

  if (urls.length > 1) {
    return false;
  }

  return true;
}

async function hasDeliverableDomain(email) {
  const domain = email.split("@")[1].toLowerCase();

  if (disposableDomains.has(domain)) {
    return false;
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length > 0) {
      return true;
    }
  } catch (error) {
    // Some valid domains do not publish MX records, so check address records.
  }

  try {
    const addresses = await dns.resolve4(domain);
    if (addresses.length > 0) {
      return true;
    }
  } catch (error) {
    // Try IPv6 next.
  }

  try {
    const addresses = await dns.resolve6(domain);
    return addresses.length > 0;
  } catch (error) {
    return false;
  }
}

async function validateSubmission(body) {
  if (String(body.company_website || "").trim()) {
    return { error: "Unable to submit this form." };
  }

  const fullName = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const institution = String(body.institution || "").trim();
  const department = String(body.department || "").trim();
  const message = String(body.message || "").trim();

  if (!fullName || !email || !message) {
    return { error: "Full name, email, and message are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  if (
    fullName.length > 120 ||
    email.length > 254 ||
    institution.length > 160 ||
    department.length > 80 ||
    message.length > 2000
  ) {
    return { error: "Please shorten your submission and try again." };
  }

  if ([fullName, email, institution, department, message].some(hasControlCharacters)) {
    return { error: "Please remove invalid characters and try again." };
  }

  if (!isMeaningfulMessage(message)) {
    return { error: "Please enter a clear message with enough detail for our team to respond." };
  }

  const domainCanReceiveMail = await hasDeliverableDomain(email);

  if (!domainCanReceiveMail) {
    return { error: "Please use a valid email address that can receive mail." };
  }

  return {
    submission: {
      fullName,
      email,
      institution,
      department,
      message
    }
  };
}

async function validateApplication(body) {
  if (String(body.company_website || "").trim()) {
    return { error: "Unable to submit this form." };
  }

  const fullName = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const position = String(body.position || "").trim();
  const resumeFile = String(body.resume_file || "").trim();
  const resumeName = String(body.resume_name || "").trim();
  const message = String(body.message || "").trim();

  if (!fullName || !email || !position || !resumeFile || !resumeName) {
    return { error: "Full name, email, position, and resume file are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  if (!/\.(pdf|doc|docx)$/i.test(resumeName)) {
    return { error: "Only .pdf, .doc, and .docx files are allowed." };
  }

  if (!/^data:.*base64,/i.test(resumeFile)) {
    return { error: "Invalid resume file upload." };
  }

  if (resumeFile.length > 7.5 * 1024 * 1024) {
    return { error: "Resume file must be smaller than 5MB." };
  }

  if (
    fullName.length > 120 ||
    email.length > 254 ||
    position.length > 120 ||
    resumeName.length > 255 ||
    message.length > 2000
  ) {
    return { error: "Please shorten your submission and try again." };
  }

  if ([fullName, email, position, resumeName, message].some(hasControlCharacters)) {
    return { error: "Please remove invalid characters and try again." };
  }

  const domainCanReceiveMail = await hasDeliverableDomain(email);

  if (!domainCanReceiveMail) {
    return { error: "Please use a valid email address that can receive mail." };
  }

  return {
    submission: {
      fullName,
      email,
      position,
      resumeFile,
      resumeName,
      message
    }
  };
}

app.post("/api/contact", async (req, res) => {
  const { error, submission } = await validateSubmission(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  if (!hasMailConfig()) {
    return res.status(500).json({ message: "Notification email is not configured." });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const subject = `New Hyphene contact form submission from ${submission.fullName}`;
  const text = [
    "New contact form submission",
    "",
    `Full Name: ${submission.fullName}`,
    `Email: ${submission.email}`,
    `Institution: ${submission.institution || "Not provided"}`,
    `Department: ${submission.department || "Not provided"}`,
    "",
    "Message:",
    submission.message
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 12px;">New Hyphene Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%;max-width:680px;">
        ${field("Full Name", submission.fullName)}
        ${field("Email", submission.email)}
        ${field("Institution", submission.institution)}
        ${field("Department", submission.department)}
        ${field("Message", submission.message)}
      </table>
    </div>
  `;

  const confirmationSubject = "We received your message - Hyphene";
  const confirmationText = [
    `Hi ${submission.fullName},`,
    "",
    "Thank you for contacting Hyphene. We received your message and our team will get back to you shortly.",
    "",
    "Your submitted details:",
    `Institution: ${submission.institution || "Not provided"}`,
    `Department: ${submission.department || "Not provided"}`,
    "",
    "Message:",
    submission.message,
    "",
    "Regards,",
    "Hyphene Team"
  ].join("\n");

  const confirmationHtml = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
      <h2 style="margin:0 0 12px;">Thank you for contacting Hyphene</h2>
      <p>Hi ${escapeHtml(submission.fullName)},</p>
      <p>We received your message and our team will get back to you shortly.</p>
      <h3 style="margin:20px 0 8px;">Your submitted details</h3>
      <table style="border-collapse:collapse;width:100%;max-width:680px;">
        ${field("Institution", submission.institution)}
        ${field("Department", submission.department)}
        ${field("Message", submission.message)}
      </table>
      <p style="margin-top:20px;">Regards,<br>Hyphene Team</p>
    </div>
  `;

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"Hyphene Website" <${process.env.GMAIL_USER}>`,
        to: process.env.NOTIFICATION_TO,
        replyTo: submission.email,
        subject,
        text,
        html
      }),
      transporter.sendMail({
        from: `"Hyphene" <${process.env.GMAIL_USER}>`,
        to: submission.email,
        replyTo: process.env.NOTIFICATION_TO,
        subject: confirmationSubject,
        text: confirmationText,
        html: confirmationHtml
      })
    ]);

    return res.status(200).json({ message: "Message sent successfully." });
  } catch (mailError) {
    console.error("Contact notification failed:", mailError);
    return res.status(500).json({ message: "Unable to send notification email." });
  }
});

app.post("/api/apply", async (req, res) => {
  const { error, submission } = await validateApplication(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  if (!hasMailConfig()) {
    return res.status(500).json({ message: "Notification email is not configured." });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const attachmentBuffer = Buffer.from(submission.resumeFile.split("base64,")[1] || submission.resumeFile, "base64");

  const subject = `New Hyphene Job Application: ${submission.position} from ${submission.fullName}`;
  const text = [
    "New Job Application received",
    "",
    `Position: ${submission.position}`,
    `Full Name: ${submission.fullName}`,
    `Email: ${submission.email}`,
    `Resume File: Attached (${submission.resumeName})`,
    "",
    "Cover Note / Message:",
    submission.message || "None provided"
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 12px;">New Hyphene Job Application</h2>
      <table style="border-collapse:collapse;width:100%;max-width:680px;">
        ${field("Position", submission.position)}
        ${field("Full Name", submission.fullName)}
        ${field("Email", submission.email)}
        ${field("Resume File", `Attached (${submission.resumeName})`)}
        ${field("Cover Note", submission.message)}
      </table>
    </div>
  `;

  const confirmationSubject = `We received your application for ${submission.position} - Hyphene`;
  const confirmationText = [
    `Hi ${submission.fullName},`,
    "",
    `Thank you for applying for the ${submission.position} position at Hyphene. We have received your application and our team will review it shortly.`,
    "",
    "Your submitted details:",
    `Position: ${submission.position}`,
    `Resume File: ${submission.resumeName}`,
    "",
    "Regards,",
    "Hyphene Recruitment Team"
  ].join("\n");

  const confirmationHtml = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
      <h2 style="margin:0 0 12px;">Thank you for applying to Hyphene</h2>
      <p>Hi ${escapeHtml(submission.fullName)},</p>
      <p>Thank you for applying for the <strong>${escapeHtml(submission.position)}</strong> position. We have received your application and our recruitment team will review it shortly.</p>
      <h3 style="margin:20px 0 8px;">Your submitted details</h3>
      <table style="border-collapse:collapse;width:100%;max-width:680px;">
        ${field("Position", submission.position)}
        ${field("Resume File", submission.resumeName)}
      </table>
      <p style="margin-top:20px;">Regards,<br>Hyphene Recruitment Team</p>
    </div>
  `;

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"Hyphene Careers" <${process.env.GMAIL_USER}>`,
        to: process.env.NOTIFICATION_TO,
        replyTo: submission.email,
        subject,
        text,
        html,
        attachments: [
          {
            filename: submission.resumeName,
            content: attachmentBuffer
          }
        ]
      }),
      transporter.sendMail({
        from: `"Hyphene Careers" <${process.env.GMAIL_USER}>`,
        to: submission.email,
        replyTo: process.env.NOTIFICATION_TO,
        subject: confirmationSubject,
        text: confirmationText,
        html: confirmationHtml
      })
    ]);

    return res.status(200).json({ message: "Application submitted successfully." });
  } catch (mailError) {
    console.error("Application notification failed:", mailError);
    return res.status(500).json({ message: "Unable to send application email." });
  }
});

// Catch-all route to serve the 404 page with a proper status code
app.use((req, res) => {
  const ext = path.extname(req.path);
  if (ext && ext !== ".html") {
    return res.status(404).send("Not Found");
  }
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

app.listen(port, () => {
  console.log(`Hyphene site running at http://localhost:${port}`);
});
