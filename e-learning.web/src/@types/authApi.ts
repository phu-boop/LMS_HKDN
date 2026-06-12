/**
 * BE auth API types, based on provided API docs/screenshots.
 * Keep property names/casing exactly as BE returns.
 */

// POST /api/identity/auth/refresh (200 OK)
export type AuthRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: string;
};

// Unauthorized responses shown for refresh/change-password/reset-password
export type AuthUnauthorizedResponse = {
  code: string;
  message: string;
  retryAfterSeconds: string;
};

// POST /api/identity/auth/logout (204 No Content)
export type AuthLogoutResponse = void;

// POST /api/identity/auth/change-password request body (from BE docs)
export type AuthChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

// Response payload for 200/400 on change-password was not shown in provided docs.
export type AuthChangePasswordOkResponse = unknown;
export type AuthChangePasswordBadRequestResponse = unknown;

// Request/response payload for admin reset-password was not shown in provided docs.
export type AuthResetPasswordRequest = unknown;
export type AuthResetPasswordOkResponse = unknown;
export type AuthResetPasswordBadRequestResponse = unknown;
