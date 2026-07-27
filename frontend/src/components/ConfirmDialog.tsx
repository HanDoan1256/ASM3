import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function ConfirmDialog({ isOpen, message, onClose, title }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm leading-7 text-text-secondary">{message}</p>
      <div className="mt-6 flex gap-3">
        <Button variant="danger">Confirm</Button>
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

