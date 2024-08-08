import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CustomError } from './errorHandler.js'; 
const SECRET_KEY = process.env.JWT_SECRET;

// Function to generate a JWT token
export const generateToken = (user) => {
  try {
    return jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, {
      expiresIn: '1h',
    });
  } catch (err) {
    throw new CustomError('Failed to generate token', 500);
  }
};

// Function to verify a JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    throw new CustomError('Invalid or expired token', 401);
  }
};

// Function to hash a password
export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 12);
  } catch (err) {
    throw new CustomError('Failed to hash password', 500);
  }
};

// Function to compare a password with a hashed password
export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (err) {
    throw new CustomError('Failed to compare passwords', 500);
  }
};
