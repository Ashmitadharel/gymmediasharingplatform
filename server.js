const express = require("express");
const multer = require("multer");
const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const app = express();
const upload = multer(); // Middleware for handling file uploads

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.static("public")); // Serve static files (HTML, CSS, JS)

// Azure Cosmos DB and Blob Storage setup
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  key: process.env.COSMOS_DB_PRIMARY_KEY,
});
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_BLOB_CONNECTION_STRING
);
const dbId = process.env.COSMOS_DB_DATABASE;
const containerId = process.env.COSMOS_DB_CONTAINER;
const blobContainerName = "media-container";

const db = cosmosClient.database(dbId);
const cosmosContainer = db.container(containerId);

// Signup API
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const query = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: email }],
    };
    const { resources: users } = await cosmosContainer.items.query(query).fetchAll();

    if (users.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = { username, email, password };
    await cosmosContainer.items.create(newUser);
    res.status(201).json({ message: "Signup successful! Redirecting to login..." });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const query = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: email }],
    };
    const { resources: users } = await cosmosContainer.items.query(query).fetchAll();

    if (users.length === 0 || users[0].password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({ message: "Login successful! Redirecting to dashboard..." });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Media Upload API
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const containerClient = blobServiceClient.getContainerClient(blobContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(req.file.originalname);

    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const metadata = {
      fileName: req.file.originalname,
      uploadDate: new Date().toISOString(),
      description: req.body.description,
    };
    await cosmosContainer.items.create(metadata);

    res.status(200).json({ message: "Media uploaded successfully!" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error uploading media" });
  }
});

// Fetch Media API
app.get("/media", async (req, res) => {
  try {
    const { resources: mediaFiles } = await cosmosContainer.items.readAll().fetchAll();
    res.json(mediaFiles);
  } catch (error) {
    console.error("Fetch media error:", error);
    res.status(500).json({ message: "Error fetching media" });
  }
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
