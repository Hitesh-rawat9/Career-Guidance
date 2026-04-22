const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const authRoutes = require("./routes/auth")
const path = require("path")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from public (EXPLICIT absolute path)
app.use(express.static(path.join(__dirname, "public")))

// API routes
app.use("/api", authRoutes)

// HTML page routes (for clean URLs like /assessment → assessment.html)
app.get("/:page", (req, res, next) => {
  const page = req.params.page
  // Skip if has file extension (static files already handled)
  if (page.includes('.')) return next()
  
  const filePath = path.join(__dirname, "public", page + ".html")
  res.sendFile(filePath, (err) => {
    if (err) next()
  })
})

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// MongoDB
let dbReady = false
const connectDB = async () => {
  if (dbReady) return true
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    })
    dbReady = true
    console.log("✅ MongoDB connected")
    return true
  } catch (err) {
    console.error("❌ MongoDB error:", err.message)
    return false
  }
}

// Ensure DB for API
app.use("/api", async (req, res, next) => {
  if (!dbReady) {
    const ok = await connectDB()
    if (!ok) return res.status(503).json({ error: "Database unavailable" })
  }
  next()
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Internal server error" })
})

module.exports = app

// Development only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  connectDB().catch(console.error)
  app.listen(PORT, () => {
    console.log(`Dev: http://localhost:${PORT}`)
  })
}
