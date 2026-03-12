const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")

const authRoutes = require("./routes/auth")

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(express.static("public"))
app.use(express.urlencoded({extended:true}))

// Use environment variable or local default
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
mongoose.connect(mongoURI).then(() => {
    console.log("Connected to MongoDB")
}).catch(err => console.error("MongoDB connection error:", err))

app.use("/api",authRoutes)

// Use PORT from environment (Glitch provides this)
const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
console.log(`Server running on port ${PORT}`)
})
