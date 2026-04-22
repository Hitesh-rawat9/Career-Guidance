const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const authRoutes = require("./routes/auth")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

// API routes only
app.use("/api", authRoutes)

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI)
    console.log("Connected to MongoDB")
  } catch (err) {
    console.error("MongoDB connection error:", err)
    if (process.env.NODE_ENV === 'production') {
      setTimeout(connectDB, 3000)
    }
  }
}

connectDB()

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
  if (process.env.NODE_ENV === 'production') {
    setTimeout(connectDB, 3000)
  }
})

// Export for Vercel
module.exports = app

// Local dev server (for testing static files locally)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000
    
    // Serve static files in dev
    app.use(express.static("public"))
    
    // Serve HTML pages in dev
    app.get("/", (req, res) => {
      res.sendFile(__dirname + "/public/index.html")
    })
    app.get("/:page", (req, res) => {
      const page = req.params.page
      if (page.includes('.')) return res.status(404).send('Not found')
      res.sendFile(__dirname + "/public/" + page + ".html", (err) => {
        if (err) res.status(404).send('Not found')
      })
    })
    
    app.listen(PORT,()=>{
        console.log(`Server running on port ${PORT}`)
    })
}
  
  res.sendFile(__dirname + "/public/" + page + ".html", (err) => {
    if (err) {
      res.status(404).end()
    }
  })
})

// Clean URLs for HTML pages only
app.get("/:page", (req, res) => {
  const page = req.params.page
  
  // Skip if has file extension (images, .js, .css, etc.)
  if (page.includes('.')) {
    return res.status(404).end()
  }
  
  res.sendFile(__dirname + "/public/" + page + ".html", (err) => {
    if (err) {
      res.status(404).end()
    }
  })
})

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI)
    console.log("Connected to MongoDB")
  } catch (err) {
    console.error("MongoDB connection error:", err)
    if (process.env.NODE_ENV === 'production') {
      setTimeout(connectDB, 3000)
    }
  }
}

connectDB()

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
  if (process.env.NODE_ENV === 'production') {
    setTimeout(connectDB, 3000)
  }
})

// Export for Vercel
module.exports = app

// Local dev server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000
    app.listen(PORT,()=>{
        console.log(`Server running on port ${PORT}`)
    })
}
