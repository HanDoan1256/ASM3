import type { ReactNode } from "react";

import { Card } from "./Card";

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function Table<T>({ columns, data, emptyMessage = "No records found." }: TableProps<T>) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-brand-50">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className="px-5 py-4 text-sm font-semibold text-text-secondary">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border">
                {columns.map((column) => (
                  <td key={column.header} className="px-5 py-4 align-top text-sm text-text-primary">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && <p className="px-5 py-8 text-sm text-text-secondary">{emptyMessage}</p>}
    </Card>
  );
}

