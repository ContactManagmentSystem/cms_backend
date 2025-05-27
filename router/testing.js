// src/routes/upload.js

const express = require("express");
const router = express.Router();
const upload = require("../middleware/file_upload");

router.post("/single", upload.single("file"), (req, res) => {
  try {
    console.log(req.file);
    console.log("to look file", `http://localhost:8989/${req.file.path}`);
    res.send("File uploaded successfully");
  } catch (error) {
    res.status(400).send("Error uploading file");
  }
});

router.post("/multi", upload.array("files", 10), (req, res) => {
  try {
    console.log(req.files);
    res.send("Files uploaded successfully");
  } catch (error) {
    res.status(400).send("Error uploading files");
  }
});

module.exports = router;
