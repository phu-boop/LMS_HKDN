import BaseRequest from '../BaseRequest';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import type { IdentifyResponse, Workspace, SelectWorkspaceResponse } from '../../types/identity';

// Re-export for convenience
export type {
  TenantBranding,
  IdentifyResponse,
  Workspace,
  SelectWorkspaceResponse,
} from '../../types/identity';

export default class IdentityRequest extends BaseRequest {
  static className = 'IdentityRequest';
  /**
   * POST /identity/identify
   * Nhận identifier (email/username), trả về tenant branding config + nextStep.
   * - SINGLE_TENANT → trả về tenantBranding để áp white-label
   * - Super Admin / multi-tenant → tenantBranding = undefined → giữ branding mặc định
   * - Không tồn tại → server trả lỗi generic
   */
  identify(identifier: string) {
    return this.baseRequest.post<IdentifyResponse>(
      API_ENDPOINTS.identityIdentify,
      { identifier },
      { headers: { 'x-skip-auth': 'true' } }
    );
  }

  /**
   * GET /identity/workspaces
   * Danh sách tenant user được gán (còn hiệu lực).
   * Chỉ gọi sau khi đã có access_token (multi-tenant user).
   */
  getWorkspaces(accessToken?: string) {
    const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined;
    return this.baseRequest.get<Workspace[]>(API_ENDPOINTS.identityWorkspaces, config);
  }

  /**
   * POST /identity/workspaces/{tenantId}/select
   * Chọn workspace → server trả về token đã scope vào tenant đó.
   * Backend yêu cầu RefreshToken trong body để rotate session.
   */
  selectWorkspace(tenantId: string, refreshToken: string) {
    return this.baseRequest.post<SelectWorkspaceResponse>(
      API_ENDPOINTS.identityWorkspaceSelect(tenantId),
      { 
        refreshToken,
        refresh_token: refreshToken 
      }
    );
  }
}
