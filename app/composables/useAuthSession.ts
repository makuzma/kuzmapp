export function useAuthSession() {
  return useState<{
    user: {
      id: string
      name: string
      email: string
      twoFactorEnabled?: boolean
    }
  } | null>('auth-session', () => null)
}
