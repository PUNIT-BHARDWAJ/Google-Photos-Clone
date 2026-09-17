"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

type NavTooltipProps = {
  label: React.ReactNode;
  /** Off in the expanded sidebar, where the label is already visible. */
  enabled: boolean;
  children: React.ReactNode;
};

/**
 * A label for icon-only navigation: appears after a 400ms hover (not
 * instantly, so sweeping the pointer across the rail stays quiet), slides in
 * from the icon on a glass surface with a caret, and vanishes the moment the
 * pointer leaves.
 */
export function NavTooltip({ label, enabled, children }: NavTooltipProps) {
  return (
    <TooltipPrimitive.Root disabled={!enabled}>
      <TooltipPrimitive.Trigger delay={400} closeDelay={0} render={<div className="block" />}>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side="right" sideOffset={14} className="z-50">
          <TooltipPrimitive.Popup className="glass-tooltip relative rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-[opacity,translate] duration-200 ease-out data-[starting-style]:-translate-x-2 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-0">
            {label}
            <TooltipPrimitive.Arrow className="-left-[5px] h-2.5 w-[6px] [clip-path:polygon(100%_0,0_50%,100%_100%)] bg-[rgba(var(--foreground-rgb),0.85)]" />
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
