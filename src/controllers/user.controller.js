const User = require("../models/user.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { sendEmail } = require("../config/email");

//User SignUp
exports.signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const otp = uuidv4().substring(0, 6).toUpperCase(); // Generate 6-character OTP

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      otp,
    });

    const htmlTemplate = fs.readFileSync(
      path.join(__dirname, "../views/signup.html"),
      "utf-8"
    );
    const emailTemplate = htmlTemplate
      .replace("{{firstName}}", firstName)
      .replace("{{otp}}", otp);

      await sendEmail(emailTemplate, "Your Otp Has Been Sent", email);
      
    return res
      .status(201)
      .json({ data: newUser, msg: "User created successfully" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};  

//User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (!user.isVerified) {
      return res.status(400).json({ msg: "Please verify your email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      id: user._id,
    };
    // Token
    const token = jwt.sign({ payload }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const htmlTemplate = fs.readFileSync(
      path.join(__dirname, "../views/login-success.html"),
      "utf-8"
    );
    const emailTemplate = htmlTemplate
      .replace("{{firstName}}", user.firstName);

      await sendEmail(emailTemplate, "You Just Logged In", email);
    return res
      .status(200)
      .json({ msg: "User logged in successfully", payload, token });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

// Verify Otp

exports.verifyOtp = async (req, res) => {
  const { otp } = req.body;
  try {
    if (!otp) {
      return res.status(400).json({ msg: "Please enter OTP" });
    }
    const user = await User.findOne({ otp });
    if (!user) {
      return res.status(404).json({ msg: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    await user.save();
    return res.status(200).json({ msg: "OTP verified successfully" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ msg: "Please enter email" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const otp = uuidv4().substring(0, 6).toUpperCase(); // Generate 6-character OTP
    user.otp = otp;
    await user.save();
    return res.status(200).json({ msg: "OTP sent to your email", data: user });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

// Reset Password

exports.resetPassword = async (req, res) => {
  const { otp } = req.query;
  const { newPassword, confirmPassword } = req.body;
  try {
    if (!newPassword || !confirmPassword) {
      return res.status(400).message("Please Fill All Fields");
    }
    const user = await User.findOne({ otp });
    if (!user) {
      return res.status(404).json({ msg: "Invalid OTP" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }
    console.log(user.password);

    const hashPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashPassword;
    user.otp = null;
    console.log(hashPassword);
    await user.save();
    return res.status(200).json({ msg: "Password Reset Successfully" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};
