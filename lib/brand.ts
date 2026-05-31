export const brandConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Instagram Dashboard",
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Meu Instagram",
  brandHandle: process.env.NEXT_PUBLIC_BRAND_HANDLE?.trim() || "@seu_perfil",
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE?.trim() || "Content Manager",
  userRole: process.env.NEXT_PUBLIC_BRAND_USER_ROLE?.trim() || "Admin",
}

export function getInitials(value: string): string {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return initials || "IG"
}

