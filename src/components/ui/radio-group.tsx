"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { CircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-3", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="relative flex items-center justify-center">
        <CircleIcon className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

/**
 * Segmented control: a radio group drawn as joined buttons (UI_UX "Form"). Arrow keys move between options,
 * as in any radio group. On narrow screens it wraps into a full-width list.
 */
function SegmentedControl({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="segmented-control"
      orientation="horizontal"
      className={cn("flex flex-wrap gap-1 rounded-lg bg-muted p-1", className)}
      {...props}
    />
  );
}

function SegmentedControlItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="segmented-control-item"
      className={cn(
        "min-h-8 flex-1 basis-[calc(50%-0.25rem)] rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:basis-auto data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Radio card: one option of a `RadioGroup` drawn as a bordered card with a short description under the label,
 * for questions whose options need an example on screen (UI_UX "Form"). The label is the accessible name and
 * the description its accessible description.
 */
function RadioCard({
  className,
  label,
  description,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & { label: string; description?: string }) {
  const id = React.useId();
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      aria-labelledby={`${id}-label`}
      aria-describedby={description ? `${id}-description` : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-input p-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 data-[state=checked]:inset-ring-1 data-[state=checked]:inset-ring-primary",
        className,
      )}
      {...props}
    >
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input">
        <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
      </span>
      <span className="space-y-0.5">
        <span id={`${id}-label`} className="block text-sm font-medium">
          {label}
        </span>
        {description && (
          <span id={`${id}-description`} className="block text-sm text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem, RadioCard, SegmentedControl, SegmentedControlItem };
