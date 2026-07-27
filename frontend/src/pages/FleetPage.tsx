import { useEffect, useState } from "react";

import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import { StatusBadge } from "../components/StatusBadge";
import { SummaryCard } from "../components/SummaryCard";
import { Table } from "../components/Table";
import { fleetService } from "../services/fleetService";
import type { Allocation, Driver, Vehicle } from "../types/fleet";

export function FleetPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<Allocation[]>([]);

  useEffect(() => {
    fleetService.listVehicles().then(setVehicles).catch(() => setVehicles([]));
    fleetService.listDrivers().then(setDrivers).catch(() => setDrivers([]));
    fleetService.listAllocations().then(setAssignments).catch(() => setAssignments([]));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        actions={[{ icon: "add", label: "New Assignment", variant: "primary" }]}
        eyebrow="Fleet Management"
        description="Coordinate vehicles, drivers, and assignments through a professional operational dashboard with tables, filters, and pagination scaffolding."
        title="Fleet"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Available Vehicles"
          trend="Vehicles ready to dispatch"
          value={String(vehicles.filter((vehicle) => vehicle.status === "Available").length)}
        />
        <SummaryCard label="Active Drivers" trend="Drivers in the current roster" value={String(drivers.length)} />
        <SummaryCard label="Open Assignments" trend="Tracked shipment allocations" value={String(assignments.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
        <SearchBar placeholder="Search vehicle, driver, or assignment" />
        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-secondary">Filter: Available</div>
        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-secondary">Region: All</div>
      </div>

      <Table
        columns={[
          { header: "Vehicle ID", render: (vehicle) => vehicle.vehicle_id },
          { header: "Type", render: (vehicle) => vehicle.vehicle_type ?? "-" },
          { header: "Capacity", render: (vehicle) => `${vehicle.capacity} tons` },
          { header: "Status", render: (vehicle) => <StatusBadge status={vehicle.status ?? "Unknown"} /> },
          {
            header: "Action",
            render: () => (
              <button className="font-semibold text-brand-500" onClick={() => setDialogOpen(true)} type="button">
                Manage
              </button>
            ),
          },
        ]}
        data={vehicles}
      />

      <Table
        columns={[
          { header: "Driver", render: (driver) => driver.full_name },
          { header: "Contact", render: (driver) => driver.phone },
          { header: "Status", render: (driver) => <StatusBadge status={driver.status ?? "Unknown"} /> },
          { header: "License", render: (driver) => driver.license_number },
        ]}
        data={drivers}
      />

      <Table
        columns={[
          { header: "Driver", render: (assignment) => assignment.driver_id ?? "-" },
          { header: "Shipment", render: (assignment) => assignment.order_id },
          { header: "Vehicle", render: (assignment) => assignment.vehicle_id ?? "-" },
          { header: "Status", render: (assignment) => <StatusBadge status={assignment.shipment_status} /> },
        ]}
        data={assignments}
      />

      <Pagination currentPage={1} totalPages={4} />

      <ConfirmDialog
        isOpen={dialogOpen}
        message="This placeholder dialog shows where assignment confirmation or delete workflows can be connected later."
        onClose={() => setDialogOpen(false)}
        title="Manage Fleet Item"
      />
    </PageContainer>
  );
}
