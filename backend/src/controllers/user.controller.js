import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { userService } from '../services/user.service.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  res.status(200).json(
    ApiResponse.success(profile, 'Profile details retrieved successfully')
  );
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updated = await userService.updateProfile(req.user.id, req.body);
  res.status(200).json(
    ApiResponse.success(updated, 'Profile updated successfully')
  );
});

export const updateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const updated = await userService.updateEmail(req.user.id, email);
  res.status(200).json(
    ApiResponse.success(updated, 'Email updated successfully. Please verify your new email address.')
  );
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user.id);
  res.status(200).json(
    ApiResponse.success(null, 'Your account has been deleted successfully')
  );
});

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await userService.getAddresses(req.user.id);
  res.status(200).json(
    ApiResponse.success(addresses, 'Addresses retrieved successfully')
  );
});

export const addAddress = asyncHandler(async (req, res) => {
  const address = await userService.addAddress(req.user.id, req.body);
  res.status(201).json(
    ApiResponse.success(address, 'Address added successfully', 201)
  );
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await userService.updateAddress(req.user.id, req.params.id, req.body);
  res.status(200).json(
    ApiResponse.success(address, 'Address updated successfully')
  );
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await userService.deleteAddress(req.user.id, req.params.id);
  res.status(200).json(
    ApiResponse.success(null, 'Address deleted successfully')
  );
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await userService.setDefaultAddress(req.user.id, req.params.id);
  res.status(200).json(
    ApiResponse.success(address, 'Default address set successfully')
  );
});

export default {
  getProfile,
  updateProfile,
  updateEmail,
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
