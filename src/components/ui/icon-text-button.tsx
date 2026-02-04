"use client";

import { forwardRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "~/components/ui/button";

export const IconTextButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    icon: ReactNode;
    label: ReactNode;
  }
>(function IconTextButton(props, ref) {
  const { icon, label, className, ...rest } = props;

  return (
    <Button ref={ref} className={className} {...rest}>
      <span className="shrink-0">{icon}</span>
      <span className="ml-1">{label}</span>
    </Button>
  );
});
