import { Session } from "next-auth";

export const ROLES = {
  SECURITY_ANALYST: "Security analyste",
  NETWORK_ADMINISTRATOR: "Network administrator",
  PLATFORM_ADMINISTRATOR: "Platform Administrator",
  READER: "Reader",
};

/**
 * Check if a session contains a specific role
 */
export function hasRole(session: Session | null, role: string): boolean {
  if (!session?.roles) return false;
  return session.roles.includes(role);
}

/**
 * Check if the user has permissions to modify resources (create, update, delete).
 * Allowed: Security analyste, Network administrator, Platform Administrator.
 * Denied: Reader.
 */
export function canModify(session: Session | null): boolean {
  if (!session?.roles) return false;
  // If user is just a Reader (and doesn't have other roles), they cannot modify
  return session.roles.some(r => r !== ROLES.READER);
}

/**
 * Check if the user has permissions to view Audits and Users tabs.
 * Allowed: Platform Administrator.
 * Denied: Security analyste, Network administrator, Reader.
 */
export function canViewAuditsAndUsers(session: Session | null): boolean {
  return hasRole(session, ROLES.PLATFORM_ADMINISTRATOR);
}
