"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";
export function PropertyDrawer({
  open,
  onClose,
  returnFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content
          className="property-drawer"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus.current?.focus();
          }}
        >
          <div className="drawer-header">
            <div>
              <Dialog.Title>Property details</Dialog.Title>
              <Dialog.Description>
                Fictional inventory · source facts and verification
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="quiet icon-button"
                aria-label="Close property details"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
