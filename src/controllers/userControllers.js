import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from "../model/userModel.js";
import userModel from "../model/userModel.js";

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
