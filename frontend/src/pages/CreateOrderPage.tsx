import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FormSection } from "../components/FormSection";
import { Input } from "../components/Input";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Select } from "../components/Select";
import { StatusBadge } from "../components/StatusBadge";
import { Textarea } from "../components/Textarea";
import { useShipmentForm } from "../hooks/useShipmentForm";
import { orderService } from "../services/orderService";
import type { ServiceOption, ShipmentOrder } from "../types/order";

function parseDimensions(dimensions: string) {
  const values = dimensions
    .split(/[^0-9.]+/)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  const [length = 1, width = 1, height = 1] = values;
  return { height, length, width };
}

function formatEstimatedDelivery(estimatedDays?: number) {
  if (estimatedDays === undefined) {
    return "-";
  }
  const date = new Date();
  date.setDate(date.getDate() + estimatedDays);
  return date.toISOString().slice(0, 10);
}

export function CreateOrderPage() {
  const { form, reset, updateField } = useShipmentForm();
  const [createdOrder, setCreatedOrder] = useState<ShipmentOrder | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    orderService
      .listServiceOptions()
      .then((options) => {
        setServiceOptions(options);
        if (options.length > 0 && form.service_id === 0) {
          updateField("service_id", options[0].service_id);
        }
      })
      .catch(() => setServiceOptions([]));
  }, [form.service_id, updateField]);

  const selectedService = useMemo(
    () => serviceOptions.find((option) => option.service_id === form.service_id) ?? null,
    [form.service_id, serviceOptions],
  );

  const serviceSelectOptions = useMemo(
    () => serviceOptions.map((option) => ({ label: option.service_name, value: String(option.service_id) })),
    [serviceOptions],
  );

  const estimatedCost = useMemo(() => {
    if (!selectedService) {
      return "0.00";
    }
    const total = selectedService.base_price + form.weight * 5 + form.declared_value * 0.01;
    return total.toFixed(2);
  }, [form.declared_value, form.weight, selectedService]);

  const estimatedDelivery = useMemo(() => formatEstimatedDelivery(selectedService?.estimated_days), [selectedService]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const customerId = localStorage.getItem("smartfm_principal_id");
      if (!customerId) {
        throw new Error("Please sign in before creating an order.");
      }

      const dimensions = parseDimensions(form.dimensions);
      const response = await orderService.createOrder({
        customer_id: customerId,
        service_id: form.service_id,
        sender_address: {
          receiver_name: form.sender_name,
          receiver_phone: form.sender_phone,
          street: form.pickup_street,
          district: form.pickup_district,
          city: form.pickup_city,
          postal_code: form.pickup_postal_code,
        },
        receiver_address: {
          receiver_name: form.receiver_name,
          receiver_phone: form.receiver_phone,
          street: form.delivery_street,
          district: form.delivery_district,
          city: form.delivery_city,
          postal_code: form.delivery_postal_code,
        },
        package_details: {
          weight: form.weight,
          height: dimensions.height,
          length: dimensions.length,
          width: dimensions.width,
          package_type: form.package_type || "General",
          declared_value: form.declared_value,
        },
        notes: form.notes || undefined,
      });
      setCreatedOrder(response);
      reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Order creation failed. Please confirm the API server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Order Intake"
        description="Capture sender, receiver, package, and shipping service details in a clean operational workflow optimized for fast internal entry."
        title="Create Order"
      />

      <form className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <FormSection description="Capture the origin contact and collection location." title="Sender">
            <Input label="Sender Name" value={form.sender_name} onChange={(event) => updateField("sender_name", event.target.value)} />
            <Input
              label="Pickup Contact"
              placeholder="+1 555 123 4567"
              value={form.sender_phone}
              onChange={(event) => updateField("sender_phone", event.target.value)}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Pickup Address"
                value={form.pickup_street}
                onChange={(event) => updateField("pickup_street", event.target.value)}
              />
            </div>
            <Input label="Pickup District" value={form.pickup_district} onChange={(event) => updateField("pickup_district", event.target.value)} />
            <Input label="Pickup City" value={form.pickup_city} onChange={(event) => updateField("pickup_city", event.target.value)} />
            <Input
              label="Pickup Postal Code"
              value={form.pickup_postal_code}
              onChange={(event) => updateField("pickup_postal_code", event.target.value)}
            />
          </FormSection>

          <FormSection description="Specify who receives the shipment and where it is delivered." title="Receiver">
            <Input
              label="Receiver Name"
              value={form.receiver_name}
              onChange={(event) => updateField("receiver_name", event.target.value)}
            />
            <Input
              label="Delivery Contact"
              placeholder="+1 555 555 0100"
              value={form.receiver_phone}
              onChange={(event) => updateField("receiver_phone", event.target.value)}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Delivery Address"
                value={form.delivery_street}
                onChange={(event) => updateField("delivery_street", event.target.value)}
              />
            </div>
            <Input
              label="Delivery District"
              value={form.delivery_district}
              onChange={(event) => updateField("delivery_district", event.target.value)}
            />
            <Input label="Delivery City" value={form.delivery_city} onChange={(event) => updateField("delivery_city", event.target.value)} />
            <Input
              label="Delivery Postal Code"
              value={form.delivery_postal_code}
              onChange={(event) => updateField("delivery_postal_code", event.target.value)}
            />
          </FormSection>

          <FormSection description="Define dimensions, weight, and package handling information." title="Package Details">
            <Input
              label="Weight (kg)"
              min="0.1"
              step="0.1"
              type="number"
              value={form.weight}
              onChange={(event) => updateField("weight", Number(event.target.value))}
            />
            <Input
              label="Dimensions"
              placeholder="120 x 80 x 90 cm"
              value={form.dimensions}
              onChange={(event) => updateField("dimensions", event.target.value)}
            />
            <Input
              label="Declared Value"
              placeholder="$ 2,500"
              type="number"
              value={form.declared_value}
              onChange={(event) => updateField("declared_value", Number(event.target.value))}
            />
            <Input
              label="Package Type"
              placeholder="Pallet / Carton / Document"
              value={form.package_type}
              onChange={(event) => updateField("package_type", event.target.value)}
            />
          </FormSection>

          <FormSection description="Select the service level and fulfillment priority." title="Shipping Service">
            <Select
              label="Service Type"
              options={serviceSelectOptions}
              value={String(form.service_id)}
              onChange={(event) => updateField("service_id", Number(event.target.value))}
            />
            <Input label="Requested Pickup Date" type="date" />
            <Input label="Reference Number" placeholder="Customer PO / Job code" />
            <Input
              label="Special Handling"
              placeholder="Fragile, cold chain, secure docs"
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </FormSection>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Order Summary</h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Service Type</span>
                <span className="text-sm font-semibold text-text-primary">{selectedService?.service_name ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Weight</span>
                <span className="text-sm font-semibold text-text-primary">{form.weight} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Estimated Shipping Cost</span>
                <span className="text-sm font-semibold text-text-primary">${estimatedCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Estimated Delivery</span>
                <span className="text-sm font-semibold text-text-primary">{estimatedDelivery}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" disabled={submitting} type="submit">
                {submitting ? "Submitting..." : "Create Order"}
              </Button>
              <Button onClick={reset} variant="secondary">
                Reset
              </Button>
            </div>
            {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Live API Response</h3>
            {createdOrder ? (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm text-text-secondary">Order ID</p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">{createdOrder.order_id}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Status</span>
                  <StatusBadge status={createdOrder.order_status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Estimated Shipping Cost</span>
                  <span className="text-sm font-semibold text-text-primary">${createdOrder.total_price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Estimated Delivery Date</span>
                  <span className="text-sm font-semibold text-text-primary">{estimatedDelivery}</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                Submit the form to display the backend-generated order reference, estimated shipping cost, estimated
                delivery date, and current status.
              </p>
            )}
          </Card>
        </div>
      </form>
    </PageContainer>
  );
}
