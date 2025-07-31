import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.utils.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export default {
  createUser: async function ({ userInput }, req) {
    const email = userInput.email;

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
