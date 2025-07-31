import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.utils.js";
import bcrypt from "bcryptjs";
import validator from "validator";

const SALT_ROUNDS = 12;

export default {
  createUser: async function ({ userInput }, req) {
    const errors = [];

    //#region Validation
    if (!validator.isEmail(userInput.email)) {
      throw new ApiError(422, "Invalid email address", errors);
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      throw new ApiError(422, "Please enter a valid name and password", errors);
    }

    if (errors.length > 0) {
      throw new ApiError(422, "Invalid input");
    }
    //#endregion

    const email = userInput.email.toLowerCase();

    const exisitingUser = await User.findOne({ email: email });
    if (exisitingUser) {
      throw new ApiError(401, "User exists already");
    }
    const hashedPassword = await bcrypt.hash(userInput.password, SALT_ROUNDS);
    const user = new User({
      email: email,
      password: hashedPassword,
      name: userInput.name,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
};
