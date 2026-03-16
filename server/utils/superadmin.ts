export function isSuperAdmin(email: string): boolean {
  return email === useRuntimeConfig().superAdminEmail
}
