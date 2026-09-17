"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/lib/utils"
import { armThemeTransition } from "@/components/provider/theme-transition"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

const subscribeNothing = () => () => {}

// The stored theme only exists in the browser; the server render (and the
// hydration pass that must match it) shows no selection.
function useIsClient() {
  return React.useSyncExternalStore(subscribeNothing, () => true, () => false)
}

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Change theme" />}>
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Radio items mark the current choice with a check - including
            "System", which the sun/moon trigger alone can't show. */}
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            armThemeTransition()
            setTheme(value as string)
          }}
        >
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            // Radio items stay open on click by default; picking a theme is a
            // one-shot choice, like the plain items this menu used to have.
            <DropdownMenuRadioItem key={value} value={value} closeOnClick>
              <Icon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Segmented Light / Dark / System control for the settings page. */
export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const isClient = useIsClient()

  return (
    <RadioGroupPrimitive
      aria-label="Theme"
      value={isClient ? (theme ?? "system") : ""}
      onValueChange={(value) => {
        armThemeTransition()
        setTheme(value as string)
      }}
      className={cn("inline-flex rounded-full bg-muted p-1", className)}
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <RadioPrimitive.Root
          key={value}
          value={value}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-background data-checked:text-foreground data-checked:shadow-sm dark:data-checked:bg-input"
        >
          <Icon className="size-4" />
          {label}
        </RadioPrimitive.Root>
      ))}
    </RadioGroupPrimitive>
  )
}
