import type { UserRole } from '@/types';

/** Roles con acceso al panel administrativo (/dashboard). */
export const STAFF_ROLES: UserRole[] = ['admin', 'organizer', 'referee', 'delegate'];

export function isStaffRole(role: UserRole | string | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role as UserRole);
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  organizer: 'Organizador',
  referee: 'Árbitro',
  delegate: 'Delegado',
  user: 'Vecino',
};
