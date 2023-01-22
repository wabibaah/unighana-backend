import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

import User from "../models/UserModel.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT);
        const user = await User.findById(decoded?.id).select("-password");
        req.user = user;
        next();
      }
    } catch (err) {
      throw new Error("Not authorized token expired, Please Login again");
    }
  } else {
    throw new Error("You are not authenticated");
  }
});

export const isAdmin = asyncHandler(async (req, res, next) => {
  const adminUser = await User.findOne({ email: req.user.email });
  if (adminUser.role === "admin") {
    next();
  } else {
    throw new Error("Not authorized as admin");
  }
});

// you must create more middlewares and also get specific user middlewares so that it will be like role base application
