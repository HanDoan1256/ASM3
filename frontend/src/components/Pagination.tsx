import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-text-secondary">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary">Previous</Button>
        <Button variant="secondary">Next</Button>
      </div>
    </div>
  );
}

