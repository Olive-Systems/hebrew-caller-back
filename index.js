// Import the necessary modules
const express = require('express');
const bodyParser = require("express");
const Retell  = require('retell-sdk');
const path = require('path');
const serveIndex = require('serve-index');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

const cors = require("cors");
app.use(cors());

app.use(express.static(path.join(__dirname, 'build')));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

// Add middleware to parse raw audio data
app.use(express.raw({ type: 'audio/webm', limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')), serveIndex(path.join(__dirname, 'uploads'), { icons: true }));

app.get("/session", async (req, res) => {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-realtime-preview-2024-12-17",
            voice: "verse",
        }),
    });
    const data = await r.json();

    // Send back the JSON we received from the OpenAI REST API
    res.send(data);
});

// Endpoint to receive and store audio chunks
app.post('/upload_audio', (req, res) => {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const conversationId = req.query.conversationId || 'none';
  const uniqueFilename = `conversation_${conversationId}.webm`;
  const filePath = path.join(uploadsDir, uniqueFilename);
  fs.appendFile(filePath, req.body, (err) => {
    if (err) {
      console.error('Error saving audio chunk:', err);
      return res.status(500).send('Error saving chunk');
    }
    res.status(200).send('Chunk saved');
  });
});

app.listen(process.env.PORT);
console.log("Mkayz, listening on 3000");