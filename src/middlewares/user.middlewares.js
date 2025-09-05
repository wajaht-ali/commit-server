import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from "../model/userModel.js";

export const isSignedIn = async (req, res, next) => {
  try {
    const headers = req.headers.authorization;
    if (!headers || !headers.startsWith("Bearer ")) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access denied",
      });
    }
    
    const token = headers.split(" ")[1];
    const decoded = jwt.verify(token, config.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token: user not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error with sign in: ", error);
    return res.status(401).send({
      success: false,
      message: "Unauthorized access",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).send({
        success: false,
        message: "Forbidden: Admins only",
      });
    }
    next();
  } catch (error) {
    console.log("Error with admin check: ", error);
    return res.status(401).send({
      success: false,
      message: "Unauthorized access",
    });
  }
};
