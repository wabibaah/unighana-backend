import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/UserModel.js";

import { generateToken } from "../config/jwtToken.js";
import { validateMongoDBId } from "../utils/validateMongodbId.js";
import { generateRefreshToken } from "../config/refreshToken.js";
import { sendEmail } from "./emailController.js";

export const createUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const findUser = await User.findOne({ email });
    if (!findUser) {
      // create a new User
      const newUser = await User.create(req.body);
      res.status(201).json(newUser);
    } else {
      throw new Error("User already exists");
    }
  } catch (err) {
    throw new Error("what at all");
  }
});

// it will try to use the email to check first if the user already exist, this will happen even before the registration process that will even check the unique side of mongoose and that too will prevent it

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const findUser = await User.findOne({ email });

  if (!findUser) {
    throw new Error("User does not exist, create one instead");
  }

  if (await findUser.isPasswordMatch(password)) {
    const refreshToken = await generateRefreshToken(findUser?.id);
    const updatedUser = await User.findByIdAndUpdate(
      findUser?._id,
      { refreshToken },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 3 });
    res.status(200).json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
      // so in this token all we have is our user id and nothing else not even the isAdmin property
    });
  } else {
    throw new Error("Passwords do not match");
  }
});

// handle refresh token
export const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  // console.log(cookie);
  if (!cookie?.refreshToken) throw new Error("No refresh token");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error("No user matches this refresh token");
  jwt.verify(refreshToken, process.env.JWT, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("refresh token does not match the user");
    }
    const accessToken = generateToken(user._id);

    res.json({ accessToken });
  });
  res.json(user);
});

export const logoutUser = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No refresh token");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });

  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    res.sendStatus(204);
  }
  await User.findOneAndUpdate({ refreshToken }, { refreshToken: "" });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204);
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDBId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    await user.save();
    res.send("Password updated successfully");
  } else {
    res.send("Password updating failed");
  }
});

export const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error(`User with email ${email} does not exist`);
  try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Hi, please follow this link to reset your password. This link is valid till 10 minutes from now. <a href="http://localhost:3000/reset-password/${token}">Click here</a>`;
    const data = {
      to: email,
      text: `User ${user.firstname}`,
      subject: "Forgot password link on UniGhana Login",
      html: resetURL,
    };
    sendEmail(data);
    res.json(token);
  } catch (err) {
    throw new Error(err);
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new Error("Token expired, Please try again later");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
  } catch (err) {
    throw new Error(err);
  }
});
