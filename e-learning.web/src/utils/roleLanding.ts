import { PATH_ADMIN, PATH_CLIENT } from '../routes/paths';

/**
 * Role codes from JWT / login API that should open the admin shell after sign-in.
 * Backend may emit LMS_ADMIN for platform operators while UI labels them "Super Admin".
 */
const ADMIN_LANDING_ROLES = new Set([
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'LMS_ADMIN'
]);

function normalizeRoleToken(role: unknown): string {
  return String(role ?? '').trim().toUpperCase();
}

export function isAdminLandingRole(role: unknown): boolean {
  const n = normalizeRoleToken(role);
  return n.length > 0 && ADMIN_LANDING_ROLES.has(n);
}

/** Prefer roles in order of priority when JWT exposes multiple `role` claim values (array). */
export function pickPrimaryJwtRole(roleClaim: unknown): string {
  if (Array.isArray(roleClaim)) {
    const strings = roleClaim.map((r) => String(r ?? '').trim().toUpperCase()).filter(Boolean);
    const priorityRole = [
      'SUPER_ADMIN',
      'LMS_ADMIN',
      'TENANT_ADMIN',
      'SCHOOL',
      'TEACHER',
      'STUDENT',
      'CLIENT'
    ].find((r) => strings.includes(r));
    return priorityRole ?? strings[0] ?? '';
  }
  if (typeof roleClaim === 'string') {
    return normalizeRoleToken(roleClaim);
  }
  return '';
}

export function roleToPostLoginLanding(role: unknown): string {
  const r = normalizeRoleToken(role);
  if (r === 'TENANT_ADMIN') return PATH_ADMIN.tenantAdminDashboard;
  if (r === 'LMS_ADMIN' || r === 'SUPER_ADMIN') return PATH_ADMIN.dashboard;
  return isAdminLandingRole(r) ? PATH_ADMIN.dashboard : PATH_CLIENT.dashboard;
}
