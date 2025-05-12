const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI("AIzaSyCeVpAQrxwHuIqvas1fs4fAkByupuXPNAU");

let allPdfText = "";

// Upload route
app.post("/upload", upload.array("pdfs"), async (req, res) => {
  try {
    const files = req.files;
    allPdfText = "";

    for (const file of files) {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      allPdfText += data.text + "\n\n";
      fs.unlinkSync(file.path); // Remove temp file
    }

    res.json({ status: "PDFs processed" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process PDFs." });
  }
});

// Ask route
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!allPdfText.trim()) {
    return res.status(400).json({ error: "No PDF content uploaded yet." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Use only the following textbook content to answer the question.\n\nContent:\n${allPdfText}\n\nQuestion: ${question}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ answer: response.text() });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Failed to generate answer." });
  }
});

// Dynamic port for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
