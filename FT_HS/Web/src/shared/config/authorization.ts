/**
 * Contrato de autorización del frontend.
 *
 * Los valores vienen de `GET /api/v1/users/me`; no se generan ni se guardan
 * como fuente de verdad en el navegador. Los roles de hogar (Owner, Member,
 * Guest) se tratan en su módulo y no deben mezclarse con estos roles globales.
 */
export const SYSTEM_ROLES = ['Administrator', 'Support', 'HomeUser', 'Guest'] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export type AuthorizationContext = {
  roles: SystemRole[];
  permissions: string[];
};

const rolePriority: SystemRole[] = ['Administrator', 'Support', 'HomeUser', 'Guest'];

export function normalizeRoles(roles: unknown): SystemRole[] {
  if (!Array.isArray(roles)) return [];
  return [...new Set(roles.filter((role): role is SystemRole => SYSTEM_ROLES.includes(role as SystemRole)))];
}

export function normalizePermissions(permissions: unknown): string[] {
  if (!Array.isArray(permissions)) return [];
  return [...new Set(permissions.filter((permission): permission is string => typeof permission === 'string'))];
}

export function can(permissions: readonly string[] | undefined, permission: string): boolean {
  return Boolean(permissions?.includes(permission));
}

export function hasRole(roles: readonly SystemRole[] | undefined, role: SystemRole): boolean {
  return Boolean(roles?.includes(role));
}

export function getPrimaryRole(roles: readonly SystemRole[] | undefined): SystemRole | null {
  return rolePriority.find((role) => hasRole(roles, role)) || null;
}

export function roleTranslationKey(role: SystemRole | null): string {
  switch (role) {
    case 'Administrator':
      return 'roles.administrator';
    case 'Support':
      return 'roles.support';
    case 'HomeUser':
      return 'roles.homeUser';
    case 'Guest':
      return 'roles.guest';
    default:
      return 'roles.user';
  }
}

export function roleBadgeClass(role: SystemRole | null): string {
  switch (role) {
    case 'Administrator':
      return 'bg-red-600';
    case 'Support':
      return 'bg-orange-600';
    case 'HomeUser':
      return 'bg-green-600';
    case 'Guest':
      return 'bg-slate-600';
    default:
      return 'bg-blue-600';
  }
}
