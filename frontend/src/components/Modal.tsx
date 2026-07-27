import type { PropsWithChildren } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
}

export function Modal({ children, isOpen, onClose, title }: PropsWithChildren<ModalProps>) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="enterprise-surface w-full max-w-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <button className="text-sm font-medium text-text-secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

