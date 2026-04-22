const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const authRoutes = require("./routes/auth")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

// API routes
app.use("/api", authRoutes)

// Lazy MongoDB connection - only connect when needed
let dbPromise = null

const connectDB = async () => {
  if (dbPromise) return dbPromise
  
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  
  dbPromise = mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  
  try {
    await dbPromise
    console.log("Connected to MongoDB")
  } catch (err) {
    console.error("MongoDB connection error:", err.message)
    dbPromise = null
    throw err
  }
  
  return dbPromise
}

// Middleware to ensure DB is connected before API routes
app.use("/api", async (req, res, next) => {
  try {
    if (!dbPromise) {
      await connectDB()
    }
    next()
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" })
  }
})

// Export for Vercel
module.exports = app

// Local development server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Serve static files
  app.use(express.static("public"))
  
  // Routes
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
  })
  
  app.get("/:page", (req, res, next) => {
    const page = req.params.page
    if (!page.includes('.')) {
      res.sendFile(__dirname + "/public/" + page + ".html", (err) => {
        if (err) next()
      })
    } else {
      next()
    }
  })
  
  // Connect DB in dev
  connectDB().catch(console.error)
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}
