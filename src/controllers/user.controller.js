const User = require("../models/user.models");
const bcrypt  = require("bcryptjs");
const jwt = require("jsonwebtoken");

//User SignUp
exports.signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if ((!firstName || !lastName || !email || !password)) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });
    return res.status(201).json({data: newUser, msg: "User created successfully" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

//User Login

exports.login = async (req, res) => {
    const { email, password } = req.body;
 try {
    if(!email || !password) {
        return res.status(400).json({ msg: "Please enter all fields" });
    }
    const user = await User.findOne({ email });
    if(!user) {
        return res.status(404).json({ msg: "User not found" });
    }
    if(!user.isVerified) {
        return res.status(400).json({ msg: "Please verify your email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        return res.status(400).json({ msg: "Invalid credentials" });
    }
    // Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return res.status(200).json({ token, msg: "User logged in successfully" });
 } catch (error) {
     console.error(error.message);
     return res.status(500).json({ msg: "Server Error" });
    
 }
}