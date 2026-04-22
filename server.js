const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const authRoutes = require("./routes/auth")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from public (images, CSS, JS, HTML)
app.use(express.static("public"))

// API routes
app.use("/api", authRoutes)

// Clean URL routing: /about → /public/about.html
app.get("/:page", (req, res, next) => {
  const page = req.params.page
  
  // Skip if already has extension (static middleware handled it)
  if (page.includes('.')) {
    return next()
  }
  
  // Try serving corresponding HTML file
  const filePath = __dirname + "/public/" + page + ".html"
  res.sendFile(filePath, (err) => {
    if (err) {
      // If HTML file not found, return 404
      res.status(404).send('Page not found')
    }
  })
})

// Root route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html")
})

// MongoDB - lazy connect
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

// Ensure DB before API requests
app.use("/api", async (req, res, next) => {
  if (!dbReady) {
    const ok = await connectDB()
    if (!ok) return res.status(503).json({ error: "Database unavailable" })
  }
  next()
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)
  res.status(500).json({ error: "Internal server error" })
})

module.exports = app

// Development server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Connect DB in dev
  connectDB().catch(console.error)
  
  app.listen(PORT, () => {
    console.log(`Dev server: http://localhost:${PORT}`)
  })
}
