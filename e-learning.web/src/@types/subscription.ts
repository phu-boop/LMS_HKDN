
export type LoginPolicy = 'BLOCK_NEW' | 'KICK_OLDEST';

export type SubscriptionStatus = 'active' | 'inactive' | 'expired';

export type Subscription = {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolTaxId?: string;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  maxSessions: number;
  loginPolicy: LoginPolicy;
  status: SubscriptionStatus;
  strictExpiry: boolean;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubscriptionRequest = {
  schoolId: string;
  tenantIds: string[];
  startDate: string;
  endDate: string;
  maxSessions: number;
  loginPolicy: LoginPolicy;
  strictExpiry: boolean;
  status: SubscriptionStatus;
};

export type UpdateSubscriptionRequest = Partial<CreateSubscriptionRequest>;
