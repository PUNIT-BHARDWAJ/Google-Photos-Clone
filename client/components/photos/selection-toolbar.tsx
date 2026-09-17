"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SelectionActionProps = Omit<React.ComponentProps<typeof Button>, "children" | "size"> & {
  icon: React.ReactNode;
  label: string;
};

/**
 * A selection toolbar button: icon + label from `sm` up, icon-only on phones -
 * where four labelled buttons need ~400px next to the count. The label stays
 * in the DOM as screen-reader text, so the button keeps its accessible name.
 */
export function SelectionAction({ icon, label, className, ...props }: SelectionActionProps) {
  return (
    <Button size="sm" className={cn("max-sm:w-9 max-sm:px-0", className)} {...props}>
      {icon}
      <span className="max-sm:sr-only">{label}</span>
    </Button>
  );
}
