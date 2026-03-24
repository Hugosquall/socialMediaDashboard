import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "outline" | "destructive"
  size?: "sm" | "md" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const variants = {
      default: "bg-[var(--primary)] text-white hover:bg-indigo-500 shadow-sm",
      secondary: "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]",
      ghost: "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
      outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
      destructive: "bg-[var(--destructive)] text-white hover:bg-red-600",
    }

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg",
      md: "h-9 px-4 py-2 text-sm rounded-lg",
      lg: "h-10 px-6 text-sm rounded-lg",
      icon: "h-9 w-9 rounded-lg",
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
