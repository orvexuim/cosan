import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { userRepository } from '../repositories/user.repository.js';
import { emailService } from './email.service.js';

/**
 * Generate Access and Refresh JWT Tokens
 * @param {string} userId 
 * @param {string} role 
 * @returns {Object} Access & Refresh tokens
 */
const generateTokenPair = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

export const authService = {
  /**
   * Register a new luxury boutique user
   * @param {Object} userData 
   * @returns {Promise<Object>} The registered user profile and JWT pair
   */
  async register(userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ApiError(400, 'A user with this email address already exists');
    }

    // Hash user password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create the user
    const newUser = await userRepository.create({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || null,
      role: 'CUSTOMER', // Default role
      isEmailVerified: false,
    });

    // Generate Verification Token (For simulation or simple validation, let's use a secure randomized hex)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // We can reuse the reset token fields or rely on temporary setup in memory/redis. 
    // Let's store verification details securely as part of the user model's resetPasswordToken for simplicity,
    // or better, standardise on resetPasswordToken format if no other fields exist.
    // However, the cleanest way without extra migrations is to reuse the resetPasswordToken as temporary activation token.
    await userRepository.setResetToken(newUser.email, verificationToken, verificationExpires);

    // Send Verification Email
    await emailService.sendVerificationEmail(newUser.email, verificationToken, newUser.firstName);

    // Generate initial tokens
    const { accessToken, refreshToken } = generateTokenPair(newUser.id, newUser.role);
    await userRepository.setRefreshToken(newUser.id, refreshToken);

    // Omit sensitive data
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;
    delete userWithoutPassword.refreshToken;
    delete userWithoutPassword.resetPasswordToken;
    delete userWithoutPassword.resetPasswordExpiresAt;

    return {
      user: userWithoutPassword,
      tokens: { accessToken, refreshToken },
    };
  },

  /**
   * Authenticate a luxury boutique user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);
    await userRepository.setRefreshToken(user.id, refreshToken);

    // Send Welcome Email if this is their first login (can check verified flag or simply login)
    // Avoid blocking flow
    if (user.isEmailVerified) {
      emailService.sendWelcomeEmail(user.email, user.firstName).catch(() => {});
    }

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    delete userWithoutPassword.refreshToken;

    return {
      user: userWithoutPassword,
      tokens: { accessToken, refreshToken },
    };
  },

  /**
   * Refresh the access and refresh token pair
   * @param {string} oldRefreshToken 
   * @returns {Promise<Object>} New tokens
   */
  async refreshTokens(oldRefreshToken) {
    try {
      const decoded = jwt.verify(oldRefreshToken, config.jwt.refreshSecret);
      
      const user = await userRepository.findById(decoded.id);
      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new ApiError(401, 'Invalid refresh token. Please sign in again.');
      }

      // Generate new pair
      const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);
      await userRepository.setRefreshToken(user.id, refreshToken);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(401, 'Refresh token has expired or is invalid. Please sign in again.');
    }
  },

  /**
   * Logout user by clearing their token
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async logout(userId) {
    await userRepository.setRefreshToken(userId, null);
  },

  /**
   * Generate password reset request
   * @param {string} email 
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists. Just return successfully.
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.setResetToken(email, resetToken, resetExpires);
    await emailService.sendPasswordResetEmail(email, resetToken, user.firstName);
  },

  /**
   * Reset user password with token
   * @param {string} token 
   * @param {string} newPassword 
   * @returns {Promise<void>}
   */
  async resetPassword(token, newPassword) {
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new ApiError(400, 'Password reset token is invalid or has expired');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRepository.updatePassword(user.id, hashedPassword);
    await emailService.sendPasswordChangedNotification(user.email, user.firstName);
  },

  /**
   * Change user password manually from profile settings
   * @param {string} userId 
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User account not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRepository.updatePassword(userId, hashedPassword);
    await emailService.sendPasswordChangedNotification(user.email, user.firstName);
  },

  /**
   * Verify Email with Token
   * @param {string} token 
   * @returns {Promise<void>}
   */
  async verifyEmail(token) {
    // We are matching the token from resetPasswordToken used as verificationToken
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new ApiError(400, 'Verification token is invalid or has expired');
    }

    // Set isEmailVerified to true
    await userRepository.verifyEmail(user.id);

    // Clear the token
    await userRepository.setResetToken(user.email, null, null);

    // Send welcome email upon verification success
    await emailService.sendWelcomeEmail(user.email, user.firstName);
  },

  /**
   * Resend Verification Email
   * @param {string} email 
   * @returns {Promise<void>}
   */
  async resendVerification(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, 'User not found with this email');
    }

    if (user.isEmailVerified) {
      throw new ApiError(400, 'This account is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await userRepository.setResetToken(email, verificationToken, verificationExpires);
    await emailService.sendVerificationEmail(email, verificationToken, user.firstName);
  },

  /**
   * Get Current Authenticated User Profile without password
   * @param {string} userId 
   * @returns {Promise<Object>} User data
   */
  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    delete userWithoutPassword.refreshToken;
    delete userWithoutPassword.resetPasswordToken;
    delete userWithoutPassword.resetPasswordExpiresAt;

    return userWithoutPassword;
  }
};

export default authService;
