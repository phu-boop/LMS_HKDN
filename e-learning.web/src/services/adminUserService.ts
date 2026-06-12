import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

/**
 * Service for Admin User management.
 * Follows the standard pattern for API abstractions.
 */
const adminUserService = {
  /**
   * Fetch all admin users
   */
  getUsers: () => axios.get(API_ENDPOINTS.usersList),

  /**
   * Fetch a specific admin user by ID
   */
  getUser: (id: string) => axios.get(API_ENDPOINTS.userById(id)),

  /**
   * Create a new admin user
   */
  createUser: (data: any) => axios.post(API_ENDPOINTS.usersCreate, data),

  /**
   * Update an existing admin user
   */
  updateUser: (id: string, data: any) => axios.put(API_ENDPOINTS.userUpdate(id), data),

  /**
   * Update user status (e.g. Active/Inactive)
   */
  updateStatus: (id: string, status: string) => axios.patch(API_ENDPOINTS.userStatus(id), { status }),

  /**
   * Reset user password
   */
  resetPassword: (id: string) => axios.post(API_ENDPOINTS.userResetPassword(id)),
};

export default adminUserService;
