import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from "../model/userModel.js";
import userModel from "../model/userModel.js";
import admin from "../config/firebase.js";


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

export const processAuthUser = async (req, res) => {
  try {
    const { name, email, headline, socialLinks } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} found. Logging in.`);
      return res.status(200).send({
        success: true,
        msg: "Logged in successfully",
        userData: existingUser
      });
    }

    const displayName = name && name.trim() !== '' ? name.trim() : email.split('@')[0];
    const baseUserName = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 12);

    let uniqueUserName = baseUserName || `user${Math.random().toString(36).substring(2, 8)}`;

    let counter = 1;
    while (await userModel.findOne({ userName: uniqueUserName })) {
      uniqueUserName = `${baseUserName || 'user'}${counter++}`;
    }

    const newUser = await userModel.create({
      name: name,
      email,
      userName: uniqueUserName,
      password: "firebase-auth",
      headline: headline || "Hey there! I'm using Commit.",
      socialLinks: socialLinks || {
        github: "https://www.github.com/",
        linkedin: "https://www.linkedin.com/"
      },
    });

    res.status(201).send({
      success: true,
      msg: "Sign up successfully",
      userData: newUser
    });

  } catch (err) {
    console.error("Error in user authentication process:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }
    const user = await userModel.findById(userId);

    const { name, headline, socialLinks, password } = req.body;
    if (password && password.length < 8) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }
    const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        name: name || user.name,
        headline: headline || user.headline,
        socialLinks: socialLinks || user.socialLinks,
        password: hashedPassword,
      },
      { new: true }
    ).select("-password");

    res.status(200).send(
      {
        success: true,
        message: "User updated successfully",
        userData: updatedUser
      }
    )
  } catch (error) {
    console.log("Error with update user", error);
    return res.status(500).send({
      success: false,
      message: "Error with update user",
      err: error,
    })
  }
}

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

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      return res.status(200).json({
        success: true,
        message: "User verified. Password reset link can be sent.",
        userRecord,
      });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return res.status(404).json({
          success: false,
          message: "No account found with this email address.",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to verify user. Please try again later.",
      });
    }
  } catch (error) {
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
