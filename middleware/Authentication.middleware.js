import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.utils.js";

export const isAuthenticated = (req, res, next) => {
  const authHeader = req.get("Authorization");
  //WARN: Check if we even have a auth header before we try to split
  if (!authHeader) {
    // Manually setting this to false so we can handle this inside of our resolvers
    req.isAuth = false;
    return next();
    // throw new ApiError(401, "Not Authenticated");
  }

  // console.log(req.get("Authorization"));
  //INFO: Splitting it after the Bearer word
  const token = req.get("Authorization").split(" ")[1];
  let decodedToken;
  try {
    // Verify both decodes and verifies the token
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // err.statusCode = 500;
    // throw err;
    req.isAuth = false;
    return next();
  }
  // Decoded has worked but unable to verify -> undefined
  if (!decodedToken) {
    // throw new ApiError(401, "Not Authenticated");
    req.isAuth = false;
    next();
  }

  // Now we have a valid token
  // This will also come in handy later as we will want to delete posts adn now we cn verify that said person who created the post is the one deleting it
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
