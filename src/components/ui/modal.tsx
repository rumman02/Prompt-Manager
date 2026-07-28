import { type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxWidth} mx-4 rounded-2xl bg-card/95 backdrop-blur-xl shadow-lg border`}>
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-headline">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <Icon name="close" size="md" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
