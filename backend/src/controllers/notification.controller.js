import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const notifications = await notificationService.getUserNotifications(req.user.id, parseInt(page), parseInt(limit));
  return successResponse(res, { data: notifications, message: 'Notifications retrieved' });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  return successResponse(res, { data: result, message: 'Unread count retrieved' });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.id, req.user.id);
  return successResponse(res, { data: result, message: 'Notification marked as read' });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  return successResponse(res, { data: result, message: 'All notifications marked as read' });
});
