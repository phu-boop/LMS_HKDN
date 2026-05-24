export type AccountType = "LMS_ADMIN" | "TENANT_ADMIN" | "SCHOOL_ADMIN" | "TEACHER";

export interface User {
  id: string;
  fullName: string;
  email: string;
  accountType: AccountType;
  isActive: boolean;
}
