import { jest } from '@jest/globals';
import authService from '../../src/services/auth.service.js';
import mockPrisma from '../helpers/mockDb.js';
import { mockUser } from '../helpers/mockData.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ApiError from '../../src/utils/ApiError.js';

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'luxury@cosman.com',
        password: 'securePassword123',
        firstName: 'Karim',
        lastName: 'Bennani',
        phone: '+212600000000',
      };

      mockPrisma.user.findUnique.mockSetValue(null);
      
      const createdUser = mockUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
      });
      mockPrisma.user.create.mockSetValue(createdUser);

      const result = await authService.register(userData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.email).toBe(userData.email);
      expect(result.password).toBeUndefined(); // Password must be excluded from return val
    });

    it('should throw an ApiError if the email is already registered', async () => {
      const userData = {
        email: 'luxury@cosman.com',
        password: 'securePassword123',
        firstName: 'Karim',
        lastName: 'Bennani',
      };

      const existingUser = mockUser({ email: userData.email });
      mockPrisma.user.findUnique.mockSetValue(existingUser);

      await expect(authService.register(userData)).rejects.toThrow(ApiError);
      await expect(authService.register(userData)).rejects.toHaveProperty('statusCode', 400);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully authenticate user with correct credentials', async () => {
      const plainPassword = 'correctPassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      const user = mockUser({ password: hashedPassword });

      mockPrisma.user.findUnique.mockSetValue(user);
      mockPrisma.user.update.mockSetValue(user);

      const result = await authService.login(user.email, plainPassword);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: user.email },
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(user.email);
      expect(result.user.password).toBeUndefined();
    });

    it('should throw an ApiError if the password is wrong', async () => {
      const plainPassword = 'correctPassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      const user = mockUser({ password: hashedPassword });

      mockPrisma.user.findUnique.mockSetValue(user);

      await expect(authService.login(user.email, 'wrongPassword123')).rejects.toThrow(ApiError);
      await expect(authService.login(user.email, 'wrongPassword123')).rejects.toHaveProperty('statusCode', 401);
    });

    it('should throw an ApiError if the user is not found', async () => {
      mockPrisma.user.findUnique.mockSetValue(null);

      await expect(authService.login('nonexistent@cosman.com', 'somePass')).rejects.toThrow(ApiError);
      await expect(authService.login('nonexistent@cosman.com', 'somePass')).rejects.toHaveProperty('statusCode', 401);
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset password token for registered user', async () => {
      const user = mockUser();
      mockPrisma.user.findUnique.mockSetValue(user);
      mockPrisma.user.update.mockSetValue(user);

      const result = await authService.forgotPassword(user.email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: user.email },
      });
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result).toHaveProperty('resetToken');
      expect(result.user.email).toBe(user.email);
    });

    it('should throw an ApiError if user is not found during forgot password', async () => {
      mockPrisma.user.findUnique.mockSetValue(null);

      await expect(authService.forgotPassword('nonexistent@cosman.com')).rejects.toThrow(ApiError);
      await expect(authService.forgotPassword('nonexistent@cosman.com')).rejects.toHaveProperty('statusCode', 404);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset user password with valid token', async () => {
      const user = mockUser();
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      
      mockPrisma.user.findFirst.mockSetValue(user);
      mockPrisma.user.update.mockSetValue(user);

      const result = await authService.resetPassword(token, 'newStrongPassword99');

      expect(mockPrisma.user.findFirst).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw an ApiError if reset token is invalid or expired', async () => {
      const invalidToken = 'thisIsAnInvalidTokenStr';

      await expect(authService.resetPassword(invalidToken, 'newStrongPassword99')).rejects.toThrow(ApiError);
      await expect(authService.resetPassword(invalidToken, 'newStrongPassword99')).rejects.toHaveProperty('statusCode', 400);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should successfully generate new access and refresh tokens with valid refresh token', async () => {
      const user = mockUser();
      const token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

      mockPrisma.user.findFirst.mockSetValue(user);
      mockPrisma.user.update.mockSetValue(user);

      const result = await authService.refreshTokens(token);

      expect(mockPrisma.user.findFirst).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw an ApiError if refresh token is invalid', async () => {
      const invalidToken = 'thisIsAnInvalidRefreshToken';

      await expect(authService.refreshTokens(invalidToken)).rejects.toThrow(ApiError);
      await expect(authService.refreshTokens(invalidToken)).rejects.toHaveProperty('statusCode', 401);
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid verification token', async () => {
      const user = mockUser({ isEmailVerified: false });
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

      mockPrisma.user.findUnique.mockSetValue(user);
      mockPrisma.user.update.mockSetValue(mockUser({ isEmailVerified: true }));

      const result = await authService.verifyEmail(token);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
      });
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw an ApiError if verification token is invalid', async () => {
      const invalidToken = 'invalidVerificationToken';

      await expect(authService.verifyEmail(invalidToken)).rejects.toThrow(ApiError);
      await expect(authService.verifyEmail(invalidToken)).rejects.toHaveProperty('statusCode', 400);
    });
  });
});
