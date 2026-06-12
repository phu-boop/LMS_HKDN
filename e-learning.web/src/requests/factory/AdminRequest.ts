import BaseRequest from '../BaseRequest';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { CatalogItem, Tenant, CreateTenantRequest } from '@/types/admin';

export default class AdminRequest extends BaseRequest {
  static className = 'AdminRequest';
  /**
   * GET /api/admin/catalog/:type
   */
  getCatalog(type: string) {
    return this.baseRequest.get<CatalogItem[]>(API_ENDPOINTS.catalogByType(type));
  }

  /**
   * POST /api/admin/catalog/:type
   */
  createCatalog(type: string, data: Partial<CatalogItem>) {
    return this.baseRequest.post<CatalogItem>(API_ENDPOINTS.catalogByType(type), data);
  }

  /**
   * PUT /api/admin/catalog/:type/:id
   */
  updateCatalog(type: string, id: string, data: Partial<CatalogItem>) {
    return this.baseRequest.put<CatalogItem>(API_ENDPOINTS.catalogById(type, id), data);
  }

  /**
   * DELETE /api/admin/catalog/:type/:id
   */
  deleteCatalog(type: string, id: string) {
    return this.baseRequest.delete(API_ENDPOINTS.catalogById(type, id));
  }

  /**
   * GET /api/admin/tenants
   */
  getTenants(params?: { search?: string; status?: string }) {
    return this.baseRequest.get<Tenant[]>(API_ENDPOINTS.tenantsList, { params });
  }

  /**
   * POST /api/admin/tenants
   */
  createTenant(data: CreateTenantRequest) {
    return this.baseRequest.post<Tenant>(API_ENDPOINTS.tenantsCreate, data);
  }

}
