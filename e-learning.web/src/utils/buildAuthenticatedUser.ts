import type { AuthenticatedUser } from '../@types/auth';

type AuthenticatedUserInput = {
  id?: string;
  email?: string;
  displayName?: string;
  name?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
  role?: string;
  username?: string | null;
  tenantId?: string | null;
  schoolId?: string | null;
  subdomain?: string | null;
  jti?: string | null;
  exp?: number | null;
  iss?: string | null;
  aud?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  address?: string | null;
  state?: string | null;
  city?: string | null;
  zipCode?: string | null;
  about?: string | null;
  isPublic?: boolean;
};

export default function buildAuthenticatedUser(input: AuthenticatedUserInput): AuthenticatedUser {
  return {
    ...input,
    id: input.id ?? '',
    email: input.email ?? '',
    displayName: input.displayName ?? input.email ?? '',
    name: input.name ?? null,
    photoURL: input.photoURL ?? null,
    avatarUrl: input.avatarUrl ?? input.photoURL ?? null,
    role: input.role ?? '',
    jti: input.jti ?? null,
    exp: input.exp ?? null,
    iss: input.iss ?? null,
    aud: input.aud ?? null,
    username: input.username ?? null,
    tenantId: input.tenantId ?? null,
    schoolId: input.schoolId ?? null,
    subdomain: input.subdomain ?? null,
  };
}
