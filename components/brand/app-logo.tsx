import { brandConfig } from "@/lib/brand"
import { cn } from "@/lib/utils"

type AppLogoProps = {
  showText?: boolean
  size?: "sm" | "md" | "lg"
  titleAs?: "p" | "h1"
  className?: string
}

const sizeClasses = {
  sm: {
    mark: "h-8 w-8",
    title: "text-sm",
    subtitle: "text-xs",
  },
  md: {
    mark: "h-10 w-10",
    title: "text-base",
    subtitle: "text-xs",
  },
  lg: {
    mark: "h-12 w-12",
    title: "text-xl",
    subtitle: "text-sm",
  },
}

export function AppLogo({ showText = true, size = "sm", titleAs = "p", className }: AppLogoProps) {
  const classes = sizeClasses[size]
  const Title = titleAs

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/25 bg-[#0b1220] shadow-lg shadow-cyan-500/15",
          classes.mark
        )}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.38),transparent_42%),radial-gradient(circle_at_78%_76%,rgba(16,185,129,0.32),transparent_45%)]" />
        <svg
          viewBox="0 0 64 64"
          className="relative h-[76%] w-[76%]"
          role="img"
          aria-label={`${brandConfig.appName} logo`}
        >
          <defs>
            <linearGradient id="app-logo-stroke" x1="8" x2="56" y1="8" y2="56">
              <stop stopColor="#22d3ee" />
              <stop offset="0.55" stopColor="#818cf8" />
              <stop offset="1" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <path
            d="M12 33c8-14 32-14 40 0"
            fill="none"
            stroke="url(#app-logo-stroke)"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M17 42c7-7 23-7 30 0"
            fill="none"
            stroke="url(#app-logo-stroke)"
            strokeLinecap="round"
            strokeWidth="3"
            opacity="0.74"
          />
          <path
            d="M21 17v30M43 17v30M22 32h20"
            fill="none"
            stroke="#f8fafc"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="7"
          />
          <circle cx="32" cy="32" r="5" fill="#22d3ee" />
          <circle cx="32" cy="32" r="2" fill="#0b1220" />
        </svg>
      </div>

      {showText && (
        <div className="min-w-0">
          <Title className={cn("truncate font-bold leading-none text-[var(--foreground)]", classes.title)}>
            {brandConfig.appName}
          </Title>
          <p className={cn("mt-0.5 truncate text-[var(--muted-foreground)]", classes.subtitle)}>
            {brandConfig.tagline}
          </p>
        </div>
      )}
    </div>
  )
}
