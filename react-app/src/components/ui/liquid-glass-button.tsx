import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Liquid Glass & Metal Button Variants
 * Matches the exact Apple VisionOS / frosted liquid glass pill capsule design.
 */
const buttonVariants = cva(
  "liquid-glass-btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none overflow-hidden cursor-pointer",
  {
    variants: {
      variant: {
        default: "liquid-glass-default text-neutral-900",
        glass: "liquid-glass-default text-neutral-900",
        metal: "liquid-glass-metal text-white",
        darkGlass: "liquid-glass-dark text-cyan-300",
        destructive: "liquid-glass-destructive text-white",
        outline: "liquid-glass-outline text-neutral-900",
        secondary: "liquid-glass-secondary text-neutral-800",
        ghost: "hover:bg-black/10 text-neutral-900",
        link: "text-neutral-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-7 text-sm font-semibold rounded-full min-w-[130px]",
        sm: "h-9 px-4 text-xs font-medium rounded-full",
        lg: "h-12 px-8 text-base font-semibold rounded-full",
        xl: "h-14 px-10 text-lg font-bold rounded-full",
        xxl: "h-11 px-6 py-2 text-sm font-semibold rounded-full min-w-[140px]",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Custom hook to detect touch devices
 */
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false)

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
      )
    }
    checkTouch()
  }, [])

  return isTouch
}

/**
 * High-Fidelity Liquid Glass Capsule CSS Styling
 */
const LiquidGlassStyles: React.FC = () => (
  <style>{`
    .liquid-glass-btn {
      position: relative;
      isolation: isolate;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Poppins", sans-serif;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    /* Exact Pill Liquid Glass Visual from Reference Image */
    .liquid-glass-default {
      color: #0f172a !important;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.98) 0%,
        rgba(246, 248, 252, 0.94) 40%,
        rgba(230, 236, 245, 0.90) 80%,
        rgba(210, 218, 230, 0.94) 100%
      );
      border: 1.5px solid rgba(22, 28, 38, 0.85);
      box-shadow:
        0 10px 25px -4px rgba(0, 0, 0, 0.35),
        0 4px 10px -2px rgba(0, 0, 0, 0.2),
        inset 0 2px 3px 0 rgba(255, 255, 255, 1),
        inset 0 -2px 4px 0 rgba(0, 0, 0, 0.25),
        inset 0 6px 12px -2px rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    /* Top Crescent Highlight Reflection */
    .liquid-glass-default::before {
      content: "";
      position: absolute;
      top: 1px;
      left: 10%;
      right: 10%;
      height: 48%;
      border-radius: 9999px 9999px 50% 50%;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(255, 255, 255, 0.3) 70%,
        transparent 100%
      );
      pointer-events: none;
      z-index: 1;
      transition: all 0.35s ease;
    }

    /* Moving Specular Glint Sweep on Hover */
    .liquid-glass-default::after {
      content: "";
      position: absolute;
      top: -50%;
      left: -80%;
      width: 45%;
      height: 200%;
      background: linear-gradient(
        60deg,
        transparent 0%,
        rgba(255, 255, 255, 0.75) 50%,
        transparent 100%
      );
      transform: rotate(25deg);
      transition: all 0.75s ease;
      pointer-events: none;
      z-index: 2;
      opacity: 0;
    }

    .liquid-glass-default:hover {
      transform: translateY(-2px) scale(1.03);
      color: #000000 !important;
      border-color: rgba(10, 15, 24, 0.95);
      box-shadow:
        0 15px 30px -4px rgba(0, 0, 0, 0.45),
        0 6px 14px -2px rgba(0, 0, 0, 0.25),
        inset 0 2px 4px 0 rgba(255, 255, 255, 1),
        inset 0 -2px 5px 0 rgba(0, 0, 0, 0.2),
        inset 0 8px 16px -2px rgba(255, 255, 255, 0.95);
    }

    .liquid-glass-default:hover::after {
      left: 140%;
      opacity: 1;
    }

    .liquid-glass-default:active {
      transform: translateY(1px) scale(0.97);
      box-shadow:
        0 4px 12px -2px rgba(0, 0, 0, 0.3),
        inset 0 2px 4px 0 rgba(0, 0, 0, 0.2),
        inset 0 -1px 2px 0 rgba(255, 255, 255, 0.8);
    }

    /* Metal Variant */
    .liquid-glass-metal {
      color: #ffffff !important;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #334155 100%);
      border: 1.5px solid rgba(226, 232, 240, 0.4);
      box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.5),
        inset 0 1px 2px rgba(255, 255, 255, 0.4),
        inset 0 -2px 4px rgba(0, 0, 0, 0.6);
    }

    .liquid-glass-metal:hover {
      transform: translateY(-2px) scale(1.03);
      border-color: #ffffff;
      box-shadow:
        0 10px 25px rgba(0, 0, 0, 0.6),
        inset 0 2px 3px rgba(255, 255, 255, 0.6);
    }

    .liquid-glass-metal:active {
      transform: translateY(1px) scale(0.97);
    }

    /* Dark Glass Variant */
    .liquid-glass-dark {
      color: #00D9FF !important;
      background: rgba(11, 17, 32, 0.75);
      border: 1.5px solid rgba(0, 217, 255, 0.5);
      box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.4),
        0 0 15px rgba(0, 217, 255, 0.2),
        inset 0 1px 2px rgba(255, 255, 255, 0.3);
    }

    .liquid-glass-dark:hover {
      transform: translateY(-2px) scale(1.03);
      border-color: #00D9FF;
      box-shadow:
        0 10px 25px rgba(0, 0, 0, 0.5),
        0 0 25px rgba(0, 217, 255, 0.5);
    }

    .liquid-glass-dark:active {
      transform: translateY(1px) scale(0.97);
    }

    /* Touch optimization */
    .touch-device.liquid-glass-btn:hover {
      transform: none;
    }
    .touch-device.liquid-glass-btn:active {
      transform: scale(0.97);
    }
  `}</style>
)

/**
 * Generic Base Button Component
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isTouch = useIsTouchDevice()

    return (
      <>
        <LiquidGlassStyles />
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            isTouch && "touch-device"
          )}
          ref={ref}
          {...props}
        />
      </>
    )
  }
)
Button.displayName = "Button"

/**
 * LiquidButton: Primary Liquid Glass component
 */
const LiquidButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "xxl", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("liquid-button-enhanced", className)}
        {...props}
      />
    )
  }
)
LiquidButton.displayName = "LiquidButton"

/**
 * MetalButton: Metallic variant component
 */
const MetalButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "metal", size = "default", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("metal-button-enhanced", className)}
        {...props}
      />
    )
  }
)
MetalButton.displayName = "MetalButton"

export { Button, LiquidButton, MetalButton, buttonVariants }
