const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI("AIzaSyCeVpAQrxwHuIqvas1fs4fAkByupuXPNAU");

let allPdfText = "";

app.post("/upload", upload.array("pdfs"), async (req, res) => {
  const files = req.files;
  allPdfText = "";

  for (const file of files) {
    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdfParse(dataBuffer);
    allPdfText += data.text + "\n\n";
    fs.unlinkSync(file.path); // Clean up
  }

  res.json({ status: "PDFs processed" });
});

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are answering based only on the uploaded textbook content. Here's the content:\n\n"${allPdfText}"\n\nQuestion: ${question}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ answer: response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("Backend server running on http://localhost:5000");
});
