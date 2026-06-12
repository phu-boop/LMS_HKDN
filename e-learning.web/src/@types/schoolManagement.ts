export type SchoolOperationStatus = 'active' | 'inactive';

export type SchoolAccessState = 'active' | 'blocked_expired' | 'inactive';

/** Khớp GET `/api/admin/schools` (item trong `items`). */
export type ManagedSchool = {
  id: string;
  schoolCode: string;
  schoolName: string;
  address?: string;
  province?: string;
  district?: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** `contractStartDate` từ API, dạng yyyy-mm-dd cho input (có thể rỗng). */
  startDate: string;
  /** `contractEndDate` từ API. */
  endDate: string;
  /** Giá trị thô từ API, ví dụ `ACTIVE`. */
  apiStatus: string;
  operationStatus: SchoolOperationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSchoolRequest = {
  address: string | null;
  code: string;
  contactEmail: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contractEndDate: string | null;
  contractStartDate: string | null;
  district: string | null;
  name: string;
  province: string | null;
  taxId: string | null;
};
