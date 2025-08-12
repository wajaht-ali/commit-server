import User from "../model/userModel.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }
    
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).send({
        success: false,
        message: "User already exists",
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
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

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
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
