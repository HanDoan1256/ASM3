import { useEffect, useState } from "react";

import { Button } from "../components/Button";
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<Allocation[]>([]);
  const [allocateOrderId, setAllocateOrderId] = useState("");
  const [allocateMessage, setAllocateMessage] = useState("");
  const [allocating, setAllocating] = useState(false);

  const refresh = () => {
    fleetService.listVehicles().then(setVehicles).catch(() => setVehicles([]));
    fleetService.listDrivers().then(setDrivers).catch(() => setDrivers([]));
    fleetService.listAllocations().then(setAssignments).catch(() => setAssignments([]));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleToggleVehicleStatus = async (vehicle: Vehicle) => {
    const nextStatus = vehicle.status === "Available" ? "Assigned" : "Available";
    try {
      await fleetService.updateVehicle(vehicle.vehicle_id, { status: nextStatus });
      refresh();
    } catch {
      // Ignore; the table simply won't reflect the change if the update fails.
    }
  };

  const handleAllocate = async () => {
    if (!allocateOrderId.trim()) return;
    setAllocating(true);
    setAllocateMessage("");
    try {
      const result = await fleetService.allocateOrder(allocateOrderId.trim());
      setAllocateMessage(result.message);
      setAllocateOrderId("");
      refresh();
    } catch (error) {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Allocation failed. Confirm the order exists and is Approved.";
      setAllocateMessage(detail);
    } finally {
      setAllocating(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
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

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3">
        <span className="text-sm font-semibold text-text-primary">Allocate Order:</span>
        <input
          className="rounded border border-border px-3 py-1.5 text-sm"
          onChange={(event) => setAllocateOrderId(event.target.value)}
          placeholder="Order ID (e.g. ORD-XXXXXXXX)"
          value={allocateOrderId}
        />
        <Button disabled={allocating} onClick={handleAllocate}>
          {allocating ? "Allocating..." : "Allocate Vehicle & Driver"}
        </Button>
        {allocateMessage && <span className="text-sm text-text-secondary">{allocateMessage}</span>}
      </div>

      <Table
        columns={[
          { header: "Vehicle ID", render: (vehicle) => vehicle.vehicle_id },
          { header: "Type", render: (vehicle) => vehicle.vehicle_type ?? "-" },
          { header: "Capacity", render: (vehicle) => `${vehicle.capacity} tons` },
          { header: "Status", render: (vehicle) => <StatusBadge status={vehicle.status ?? "Unknown"} /> },
          {
            header: "Action",
            render: (vehicle) => (
              <button
                className="font-semibold text-brand-500"
                onClick={() => handleToggleVehicleStatus(vehicle)}
                type="button"
              >
                {vehicle.status === "Available" ? "Mark Assigned" : "Mark Available"}
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
    </PageContainer>
  );
}
