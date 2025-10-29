import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from "../model/userModel.js";
import userModel from "../model/userModel.js";
import admin from "../config/firebase.js";
import { Resend } from 'resend';
import { getForgotPasswordTemplate } from "../config/emailTemplates.js";

import Mailjet from "node-mailjet";

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

export const registerUser = async (req, res) => {
  try {
    let { name, userName, email, password } = req.body;
    if (!name || !userName || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }
    email = email.trim().toLowerCase();
    password = password.trim();
    name = name.trim();
    userName = userName.trim().toLowerCase();

    const user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).send({
        success: false,
        message: "User already exists",
      });
    }

    let hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      name,
      userName,
      email,
      password: hashedPassword,
    });

    res.status(201).send({
      success: true,
      message: "User registered successfully",
      userData: newUser,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to register user",
      error: error.message,
    });
  }
};

export const googleSignup = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) return res.status(400).send({ message: "Email required" });
    let user = await userModel.findOne({ email });
    if (!user) {
      const baseUserName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 12);

      let uniqueUserName = baseUserName;
      let counter = 1;

      while (await userModel.findOne({ userName: uniqueUserName })) {
        uniqueUserName = `${baseUserName}${counter++}`;
      }

      user = await userModel.create({
        name,
        email,
        userName: uniqueUserName,
        password: "firebase-auth",
      });
    }

    res.status(201).send({
      success: true,
      msg: "Sign up successfully",
      userData: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }

    email = email.trim().toLowerCase();
    password = password.trim();

    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({
        success: false,
        message: "Invalid Password",
      });
    }

    const jwtToken = jwt.sign(
      { id: user.id || user._id },
      config.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(200).send({
      success: true,
      message: "Login successfully!",
      token: jwtToken,
      user: user,
    });
  } catch (error) {
    console.log("Error with login user", error);
    return res.status(500).send({
      success: false,
      message: "Error with login user",
      err: error,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Check if user exists in Firebase
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return res.status(404).json({
          success: false,
          message: "No account found with this email address.",
        });
      }
      console.error("❌ Firebase user lookup error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to verify user. Please try again later.",
      });
    }

    // Generate Firebase password reset link
    let resetLink;
    try {
      resetLink = await admin.auth().generatePasswordResetLink(email);
    } catch (error) {
      console.error("❌ Failed to generate password reset link:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to generate password reset link. Please try again.",
      });
    }

    // Send email via Mailjet
    try {
      const request = mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: process.env.SENDER_EMAIL, // You can use Gmail safely
              Name: "Code Commit",
            },
            To: [
              {
                Email: email,
                Name: userRecord.displayName || "User",
              },
            ],
            Subject: "Reset Your Code Commit Password",
            HTMLPart: `
              <h2>Hello ${userRecord.displayName || "User"},</h2>
              <p>You requested to reset your password for Code Commit.</p>
              <p>Click below to reset it:</p>
              <p><a href="${resetLink}" target="_blank">Reset Password</a></p>
              <p>If you did not request this, please ignore this email.</p>
              <br/>
              <p>– The Code Commit Team</p>
            `,
          },
        ],
      });

      const result = await request;

      const status = result?.body?.Messages?.[0]?.Status || "unknown";

      if (status.toLowerCase() !== "success") {
        console.error("⚠️ Mailjet returned non-success status:", status);
        return res.status(500).json({
          success: false,
          message:
            "Failed to send password reset email. Please try again later.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Password reset link has been sent to your email address.",
      });
    } catch (error) {
      console.error("❌ Mailjet email sending error:", error);
      return res.status(500).json({
        success: false,
        message:
          "Unable to send reset email. Please check your connection or try again later.",
      });
    }
  } catch (error) {
    console.error("🔥 Unexpected resetPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");
    return res.status(200).send({
      success: true,
      message: "Get all users data",
      usersData: users,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to get users data",
      error: error.message,
    });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).send({
      success: true,
      message: "Get single user data",
      userData: user,
    });
  } catch (error) {
    console.log("Error with get single user", error);
    return res.status(500).send({
      success: false,
      message: "Error with get single user",
      err: error ? error.message : "Internal Server Error",
    });
  }
};
