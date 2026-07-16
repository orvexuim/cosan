import { ApiError } from '../utils/ApiError.js';
import { userRepository } from '../repositories/user.repository.js';
import { addressRepository } from '../repositories/address.repository.js';

export const userService = {
  /**
   * Get user profile details
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    delete userWithoutPassword.refreshToken;
    delete userWithoutPassword.resetPasswordToken;
    delete userWithoutPassword.resetPasswordExpiresAt;

    return userWithoutPassword;
  },

  /**
   * Update profile information
   * @param {string} userId 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, updateData) {
    const updated = await userRepository.update(userId, updateData);
    
    const userWithoutPassword = { ...updated };
    delete userWithoutPassword.password;
    delete userWithoutPassword.refreshToken;
    delete userWithoutPassword.resetPasswordToken;
    delete userWithoutPassword.resetPasswordExpiresAt;

    return userWithoutPassword;
  },

  /**
   * Update account email address
   * @param {string} userId 
   * @param {string} newEmail 
   * @returns {Promise<Object>}
   */
  async updateEmail(userId, newEmail) {
    const existing = await userRepository.findByEmail(newEmail);
    if (existing && existing.id !== userId) {
      throw new ApiError(400, 'This email address is already in use by another account');
    }

    const updated = await userRepository.update(userId, {
      email: newEmail,
      isEmailVerified: false, // Reset email verification
    });

    const userWithoutPassword = { ...updated };
    delete userWithoutPassword.password;
    delete userWithoutPassword.refreshToken;

    return userWithoutPassword;
  },

  /**
   * Delete account entirely
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async deleteAccount(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await userRepository.softDelete(userId);
  },

  /**
   * Get all addresses for a user
   * @param {string} userId 
   * @returns {Promise<Array>}
   */
  async getAddresses(userId) {
    return addressRepository.findByUserId(userId);
  },

  /**
   * Add a new address
   * @param {string} userId 
   * @param {Object} addressData 
   * @returns {Promise<Object>}
   */
  async addAddress(userId, addressData) {
    return addressRepository.create(userId, addressData);
  },

  /**
   * Update an existing address
   * @param {string} userId 
   * @param {string} addressId 
   * @param {Object} addressData 
   * @returns {Promise<Object>}
   */
  async updateAddress(userId, addressId, addressData) {
    const address = await addressRepository.findByUserIdAndId(userId, addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found or does not belong to this user');
    }

    return addressRepository.update(addressId, addressData);
  },

  /**
   * Delete an address
   * @param {string} userId 
   * @param {string} addressId 
   * @returns {Promise<Object>}
   */
  async deleteAddress(userId, addressId) {
    const address = await addressRepository.findByUserIdAndId(userId, addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found or does not belong to this user');
    }

    return addressRepository.delete(addressId);
  },

  /**
   * Set address as default
   * @param {string} userId 
   * @param {string} addressId 
   * @returns {Promise<Object>}
   */
  async setDefaultAddress(userId, addressId) {
    const address = await addressRepository.findByUserIdAndId(userId, addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found or does not belong to this user');
    }

    await addressRepository.setDefault(userId, addressId);
    return addressRepository.findById(addressId);
  }
};

export default userService;
