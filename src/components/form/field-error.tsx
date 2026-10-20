import { CircleAlertIcon } from "lucide-react";

export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-destructive">
      <CircleAlertIcon className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
