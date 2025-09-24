import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Name is required"],
      maxlength: 100,
    },

    userName: {
      type: String,
      trim: true,
      required: [true, "Username is required"],
      lowercase: true,
      unique: true,
      minlength: 3,
      maxlength: 50,
      match: [/^[a-z0-9._-]+$/, "Username contains invalid characters"],
    },

    email: {
      type: String,
      trim: true,
      required: [true, "Email is required"],
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "Email is invalid"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // exclude by default from queries
    },

    status: {
      type: String,
      enum: ["viewer", "editor", "admin"],
      default: "viewer",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("users", userSchema);
export default userModel;
