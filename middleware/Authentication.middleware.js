import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.utils.js";

export const isAuthenticated = (req, res, next) => {
  const authHeader = req.get("Authorization");
  //WARN: Check if we even have a auth header before we try to split
  if (!authHeader) {
    throw new ApiError(401, "Not Authenticated");
  }

  // console.log(req.get("Authorization"));
  //INFO: Splitting it after the Bearer word
  const token = req.get("Authorization").split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Not Authenticated");
  }
  // Decoded has worked but unable to verify -> undefined
  if (!decodedToken) {
    throw new ApiError(401, "Not Authenticated");
    // req.isAuth = false;
    // next();
  }

  // Now we have a valid token
  // This will also come in handy later as we will want to delete posts adn now we cn verify that said person who created the post is the one deleting it
  req.userId = decodedToken.userId;
  next();
};
