const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")

const User = require("../models/user")

router.post("/signup", async(req,res)=>{

const {name,email,password}=req.body

// Check if user already exists
const existingUser = await User.findOne({email})
if(existingUser) {
    return res.status(400).json({success: false, message: "Email already registered"})
}

const hash = await bcrypt.hash(password,10)

const user = new User({
name,
email,
password:hash
})

await user.save()

res.json({success: true, message: "Signup successful"})

})

router.post("/login", async(req,res)=>{

const {email,password}=req.body

const user = await User.findOne({email})

if(!user) return res.status(401).json({success: false, message: "User not found"})

const valid = await bcrypt.compare(password,user.password)

if(!valid) return res.status(401).json({success: false, message: "Wrong password"})

res.json({
    success: true, 
    message: "Login successful",
    user: {
        id: user._id,
        name: user.name,
        email: user.email
    }
})

})

router.post("/logout", (req, res) => {
    res.json({success: true, message: "Logged out successfully"})
})

router.get("/me", async(req, res) => {
    // This endpoint can be extended with authentication middleware
    res.json({success: false, message: "Not authenticated"})
})

module.exports = router

