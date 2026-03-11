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

mongoose.connect("mongodb://127.0.0.1:27017/career_guidance")

app.use("/api",authRoutes)

app.listen(3000,()=>{
console.log("Server running on port 3000")
})