"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

type FormSubmitButtonProps = Omit<ComponentProps<typeof Button>, "isLoading" | "type"> & {
  pendingText?: string;
  children: ReactNode;
};

export function FormSubmitButton({
  pendingText,
  children,
  loadingText,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      isLoading={pending}
      loadingText={pendingText ?? loadingText}
      {...props}
    >
      {children}
    </Button>
  );
}

