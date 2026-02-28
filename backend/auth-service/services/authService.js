import Joi from "joi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as authRepository from "../repositories/authRepository.js";

//schema per /login
const schema_login = Joi.object({
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: {
      allow: ["com", "net", "org", "edu", "gov", "io", "co", "it", "us", "uk"],
    },
  }),

  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,}$")),
});

// schema per /signup
const schema_signup = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),

  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,}$")).required(),

  repeat_password: Joi.ref("password"),

  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: {
        allow: [
          "com",
          "net",
          "org",
          "edu",
          "gov",
          "io",
          "co",
          "it",
          "us",
          "uk",
        ],
      },
    })
    .required(),
}).with("password", "repeat_password");

// payload shema
const jwtPayloadSchema = Joi.object({
  userId: Joi.number().required(),
  username: Joi.string().required(),
  email: Joi.string().email().required(),
});

/**
 * Authenticates a user and generates a JWT token
 * @async
 * @param {Object} userData - User login credentials
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password (plaintext)
 * @returns {Promise<string>} JWT token
 * @throws {Error} "Invalid Credentials" - If email not found or password doesn't match
 * @throws {Error} "Invalid login data" - If validation fails
 * @throws {Error} "Invalid payload" - If JWT payload validation fails
 */
export const loginUser = async (userData) => {
  const validatedUser = await validateUserCredentials(userData);

  const queryResult = await authRepository.findUser(userData.email);
  if (queryResult.rowCount === 0) {
    throw new Error("Invalid Credentials");
  }

  const user = queryResult.rows[0];
  const isMatch = await comparePasswords(
    validatedUser.password,
    user.password_hash
  );
  if (!isMatch) {
    throw new Error("Invalid Credentials");
  }

  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
  };

  validateJwtPayload(payload);
  const token = generateJwtToken(payload, process.env.JWT_SECRET, {
    expiresIn: "7d", // at the moment i have to use 7day maxAge then i will implement a refresh token endpoint
  });

  return token;
};

/**
 * Authenticates a demo user and generates a JWT token
 * @async
 * @param {string} demoUserData - Demo user's email address
 * @returns {Promise<string}>} JWT token
 * @throws {Error} "Invalid payload" - If JWT payload validation fails
 */
export const demoLoginUser = async (demoUserData) => {
  const user = await authRepository.findUser(demoUserData);
  const demo_user = user.rows[0];
  const payload = {
    userId: demo_user.id,
    username: demo_user.username,
    email: demo_user.email,
  };
  validateJwtPayload(payload);
  const token = generateJwtToken(payload, process.env.JWT_SECRET, {
    expiresIn: "7d", // at the moment i have to use 7day maxAge then i will implement a refresh token endpoint
  });

  return token;
};

export async function validateUserCredentials(user) {
  try {
    return await schema_login.validateAsync(user);
  } catch {
    throw new Error("Invalid login data.");
  }
}

export const comparePasswords = async (plaintextPassword, hashedPassword) => {
  return bcrypt.compare(plaintextPassword, hashedPassword);
};

export const generateJwtToken = (payload, secret, options) => {
  return jwt.sign(payload, secret, options);
};

// Per prima cosa geniaramo un Salt ( che e' una stringa causale che andra aggiunta alla password prima di hasharla)
// const saltRounds = 10;
// const salt = await bcrypt.genSalt(saltRounds); // Generate salt
// const hash = await bcrypt.hash(validateUser.password, salt); // adesso abbiamo la password hashata e la possiamo salvare nel db
export const hashPassword = async (plaintextPassword) => {
  if (!plaintextPassword || plaintextPassword.trim() === "") {
    throw new Error("Password cannot be empty");
  }

  //validazione password con la stessa regex dello schema Joi di signup e login
  const passwordRegex = /^[a-zA-Z0-9]{8,}$/;
  if (!passwordRegex.test(plaintextPassword)) {
    throw new Error(
      "Password must be at least 8 characters long and contain only letters and numbers."
    );
  }

  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(plaintextPassword, salt);
    return hash;
  } catch {
    throw new Error("Error hashing password.");
  }
};

export async function validateSignupData(user) {
  try {
    return await schema_signup.validateAsync(user);
  } catch {
    throw new Error("Invalid signup data. Please check your input.");
  }
}

export const validateJwtPayload = (payload) => {
  const { error } = jwtPayloadSchema.validate(payload);
  if (error) {
    throw new Error("Invalid payload");
  }
  return true;
};
