"use client";

import { Check, X } from "lucide-react";
import { Button } from "~/components/ui/button";

export function EditModeActionButtons(props: {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  className?: string;
}) {
  const { onSave, onCancel, isSaving, className } = props;

  return (
    <div className={className}>
      <Button onClick={onSave} className="rounded-md" isLoading={isSaving}>
        <Check className="shrink-0" />
        Save
      </Button>
      <Button onClick={onCancel} variant="outline" className="rounded-md">
        <X className="shrink-0" />
        Cancel
      </Button>
    </div>
  );
}
