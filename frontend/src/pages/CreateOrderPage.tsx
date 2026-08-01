import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FormSection } from "../components/FormSection";
import { Input } from "../components/Input";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Select } from "../components/Select";
import { Textarea } from "../components/Textarea";
import { useShipmentForm } from "../hooks/useShipmentForm";
import { orderService } from "../services/orderService";
import type { OrderEstimateResponse, ServiceOption } from "../types/order";
import { sanitizeVietnamPhone } from "../utils/phone";
import {
  listVietnamDistricts,
  listVietnamProvinces,
  listVietnamWards,
} from "../utils/vietnamLocations";

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

function useVietnamLocations(selectedCityCode: string, selectedDistrictCode: string) {
  const provinces = useMemo(() => {
    return listVietnamProvinces();
  }, []);

  const districts = useMemo(() => {
    return listVietnamDistricts(selectedCityCode);
  }, [selectedCityCode]);

  const wards = useMemo(() => {
    return listVietnamWards(selectedDistrictCode);
  }, [selectedDistrictCode]);

  return { districts, provinces, wards };
}

export function CreateOrderPage() {
  const navigate = useNavigate();
  const { form, reset, updateField } = useShipmentForm();
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [pickupDate, setPickupDate] = useState("");

  const [senderCityCode, setSenderCityCode] = useState("");
  const [senderDistrictCode, setSenderDistrictCode] = useState("");
  const [senderWard, setSenderWard] = useState("");

  const [receiverCityCode, setReceiverCityCode] = useState("");
  const [receiverDistrictCode, setReceiverDistrictCode] = useState("");
  const [receiverWard, setReceiverWard] = useState("");

  const senderLocations = useVietnamLocations(senderCityCode, senderDistrictCode);
  const receiverLocations = useVietnamLocations(receiverCityCode, receiverDistrictCode);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentOption, setPaymentOption] = useState<"COD" | "Cash" | "Transfer">("COD");
  const [countdown, setCountdown] = useState(15);
  const [authoritativeEstimate, setAuthoritativeEstimate] = useState<OrderEstimateResponse | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  // Pickup Date Constraints Logic (17:00 cutoff & 3 days max limit)
  const pickupDateLimits = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    // If created after 5 PM (17:00), min pickup date is tomorrow; otherwise today
    const minDate = new Date(now);
    if (currentHour >= 17) {
      minDate.setDate(minDate.getDate() + 1);
    }

    // Max allowed pickup date is 3 days from creation time
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 3);

    return {
      min: minDate.toISOString().split("T")[0],
      max: maxDate.toISOString().split("T")[0],
    };
  }, []);

  useEffect(() => {
    if (!form.sender_phone) updateField("sender_phone", "+84 ");
    if (!form.receiver_phone) updateField("receiver_phone", "+84 ");
  }, []);

  useEffect(() => {
    orderService
      .listServiceOptions()
      .then((options) => {
        setServiceOptions(options);
        // Reset service selection so dropdown starts unselected
        updateField("service_id", "");
      })
      .catch(() => setServiceOptions([]));
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isModalOpen && paymentOption === "Transfer" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isModalOpen, paymentOption, countdown]);

  const selectedService = useMemo(
    () => serviceOptions.find((option) => String(option.service_id) === String(form.service_id)) ?? null,
    [form.service_id, serviceOptions],
  );

  const serviceSelectOptions = useMemo(
    () => serviceOptions.map((option) => ({ label: option.service_name, value: String(option.service_id) })),
    [serviceOptions],
  );

  useEffect(() => {
    if (!form.service_id || !form.weight || form.weight <= 0) {
      setAuthoritativeEstimate(null);
      setEstimateError("");
      setEstimating(false);
      return;
    }

    let cancelled = false;
    setEstimating(true);
    setEstimateError("");

    orderService
      .estimateOrder({
        service_id: Number(form.service_id),
        weight: form.weight,
      })
      .then((estimate) => {
        if (cancelled) return;
        setAuthoritativeEstimate(estimate);
      })
      .catch((err: { response?: { data?: { detail?: string } } }) => {
        if (cancelled) return;
        setAuthoritativeEstimate(null);
        setEstimateError(err.response?.data?.detail || "Unable to retrieve backend shipping estimate.");
      })
      .finally(() => {
        if (!cancelled) {
          setEstimating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.service_id, form.weight]);

  const estimatedCost = useMemo(() => {
    if (!authoritativeEstimate) {
      return "0";
    }
    return authoritativeEstimate.estimated_total.toLocaleString("vi-VN");
  }, [authoritativeEstimate]);

  

  const estimatedDelivery = useMemo(() => formatEstimatedDelivery(selectedService?.estimated_days), [selectedService]);

  const handleSenderCityChange = (code: string) => {
    setSenderCityCode(code);
    setSenderDistrictCode("");
    setSenderWard("");
    const provinceName = senderLocations.provinces.find((p) => p.value === code)?.label || "";
    updateField("pickup_city", provinceName);
    updateField("pickup_district", "");
  };

  const handleSenderDistrictChange = (code: string) => {
    setSenderDistrictCode(code);
    setSenderWard("");
    const districtName = senderLocations.districts.find((d) => d.value === code)?.label || "";
    updateField("pickup_district", districtName);
  };

  const handleReceiverCityChange = (code: string) => {
    setReceiverCityCode(code);
    setReceiverDistrictCode("");
    setReceiverWard("");
    const provinceName = receiverLocations.provinces.find((p) => p.value === code)?.label || "";
    updateField("delivery_city", provinceName);
    updateField("delivery_district", "");
  };

  const handleReceiverDistrictChange = (code: string) => {
    setReceiverDistrictCode(code);
    setReceiverWard("");
    const districtName = receiverLocations.districts.find((d) => d.value === code)?.label || "";
    updateField("delivery_district", districtName);
  };

  const handleOpenSummary = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.sender_name.trim()) return setError("Please enter the Sender Name.");
    if (form.sender_phone.trim().length <= 4) return setError("Please enter a valid Sender Phone Number.");
    if (!form.pickup_street.trim()) return setError("Please enter the Pickup Street Address.");
    if (!senderCityCode) return setError("Please select the Pickup City / Province.");
    if (!senderDistrictCode) return setError("Please select the Pickup District.");
    if (!senderWard) return setError("Please select the Pickup Ward.");

    if (!form.receiver_name.trim()) return setError("Please enter the Receiver Name.");
    if (form.receiver_phone.trim().length <= 4) return setError("Please enter a valid Receiver Phone Number.");
    if (!form.delivery_street.trim()) return setError("Please enter the Delivery Street Address.");
    if (!receiverCityCode) return setError("Please select the Delivery City / Province.");
    if (!receiverDistrictCode) return setError("Please select the Delivery District.");
    if (!receiverWard) return setError("Please select the Delivery Ward.");

    if (!form.service_id) return setError("Please select a Shipping Service Type.");
    if (!form.weight || form.weight <= 0) return setError("Please enter a valid Package Weight.");
    if (!form.dimensions.trim()) return setError("Please enter Package Dimensions.");
    if (estimating) return setError("Please wait for the backend pricing estimate to finish loading.");
    if (!authoritativeEstimate) return setError(estimateError || "Unable to fetch an authoritative shipping estimate.");

    setCountdown(15);
    setIsModalOpen(true);
  };

    const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const customerId = localStorage.getItem("smartfm_principal_id") || "CUST-001";
      const dimensions = parseDimensions(form.dimensions);

      const billingStatus = paymentOption === "Cash" || paymentOption === "Transfer" ? "Completed" : "Pending";

      const response = await orderService.createOrder({
        customer_id: customerId,
        service_id: form.service_id,
        sender_address: {
          receiver_name: form.sender_name,
          receiver_phone: form.sender_phone.replace(/\s+/g, ""),
          street: `${form.pickup_street}, Ward ${senderWard}`,
          district: form.pickup_district,
          city: form.pickup_city,
        },
        receiver_address: {
          receiver_name: form.receiver_name,
          receiver_phone: form.receiver_phone.replace(/\s+/g, ""),
          street: `${form.delivery_street}, Ward ${receiverWard}`,
          district: form.delivery_district,
          city: form.delivery_city,
        },
        package_details: {
          weight: form.weight,
          height: dimensions.height,
          length: dimensions.length,
          width: dimensions.width,
          package_type: form.package_type || "Standard",
          declared_value: form.declared_value || 0,
          fragile: form.notes === "Fragile",
          security_level: form.notes === "High-Security" ? "High-Security" : "Standard",
        },
        notes: `Payment Method: ${paymentOption} | Billing Status: ${billingStatus}${
          pickupDate ? ` | Requested Pickup Date: ${pickupDate}` : ""
        }${form.notes ? ` | Notes: ${form.notes}` : ""}`,
      });

      setIsModalOpen(false);
      reset();
      
      // Automatically redirect to the created order details page
      navigate(`/orders/${response.order_id}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Order creation failed. Please confirm the API server is running.",
      );
      setIsModalOpen(false);
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

      <form className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]" onSubmit={handleOpenSummary}>
        <div className="space-y-4">
          {/* SENDER SECTION */}
          <FormSection description="Capture the origin contact and collection location." title="Sender">
            <Input
              label="Sender Name *"
              value={form.sender_name}
              onChange={(event) => updateField("sender_name", event.target.value)}
            />
            <Input
              label="Pickup Contact *"
              placeholder="+84 901234567"
              value={form.sender_phone || "+84 "}
              onChange={(event) => updateField("sender_phone", sanitizeVietnamPhone(event.target.value))}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Pickup Address (Street/House No.) *"
                value={form.pickup_street}
                onChange={(event) => updateField("pickup_street", event.target.value)}
              />
            </div>
            <Select
              label="Pickup City / Province *"
              options={[{ label: "-- Select City/Province --", value: "" }, ...senderLocations.provinces]}
              value={senderCityCode}
              onChange={(event) => handleSenderCityChange(event.target.value)}
            />
            <Select
              disabled={!senderCityCode}
              label="Pickup District *"
              options={[{ label: "-- Select District --", value: "" }, ...senderLocations.districts]}
              value={senderDistrictCode}
              onChange={(event) => handleSenderDistrictChange(event.target.value)}
            />
            <Select
              disabled={!senderDistrictCode}
              label="Pickup Ward *"
              options={[
                { label: "-- Select Ward --", value: "" },
                ...senderLocations.wards.map((w) => ({ label: w.label, value: w.value })),
              ]}
              value={senderWard}
              onChange={(event) => setSenderWard(event.target.value)}
            />
          </FormSection>

          {/* RECEIVER SECTION */}
          <FormSection description="Specify who receives the shipment and where it is delivered." title="Receiver">
            <Input
              label="Receiver Name *"
              value={form.receiver_name}
              onChange={(event) => updateField("receiver_name", event.target.value)}
            />
            <Input
              label="Delivery Contact *"
              placeholder="+84 909876543"
              value={form.receiver_phone || "+84 "}
              onChange={(event) => updateField("receiver_phone", sanitizeVietnamPhone(event.target.value))}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Delivery Address (Street/House No.) *"
                value={form.delivery_street}
                onChange={(event) => updateField("delivery_street", event.target.value)}
              />
            </div>
            <Select
              label="Delivery City / Province *"
              options={[{ label: "-- Select City/Province --", value: "" }, ...receiverLocations.provinces]}
              value={receiverCityCode}
              onChange={(event) => handleReceiverCityChange(event.target.value)}
            />
            <Select
              disabled={!receiverCityCode}
              label="Delivery District *"
              options={[{ label: "-- Select District --", value: "" }, ...receiverLocations.districts]}
              value={receiverDistrictCode}
              onChange={(event) => handleReceiverDistrictChange(event.target.value)}
            />
            <Select
              disabled={!receiverDistrictCode}
              label="Delivery Ward *"
              options={[
                { label: "-- Select Ward --", value: "" },
                ...receiverLocations.wards.map((w) => ({ label: w.label, value: w.value })),
              ]}
              value={receiverWard}
              onChange={(event) => setReceiverWard(event.target.value)}
            />
          </FormSection>
          {/* PACKAGE DETAILS SECTION */}
          <FormSection description="Define dimensions, weight, and package handling information." title="Package Details">
            <Input
              label="Weight (kg) *"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={form.weight ?? 0}
              onChange={(event) => {
                const val = event.target.value.replace(/[^0-9.]/g, "");
                updateField("weight", val !== "" ? Number(val) : 0);
              }}
            />
            <Input
              label="Dimensions *"
              placeholder="120 x 80 x 90 cm"
              value={form.dimensions}
              onChange={(event) => updateField("dimensions", event.target.value)}
            />
            <Input
              label="Declared Value (VND)"
              placeholder="0"
              type="text"
              inputMode="numeric"
              value={form.declared_value ?? 0}
              onChange={(event) => {
                const val = event.target.value.replace(/[^0-9]/g, "");
                updateField("declared_value", val !== "" ? Number(val) : 0);
              }}
            />
            <Select
              label="Package Type"
              options={[
                { label: "Standard", value: "Standard" },
                { label: "Document", value: "Document" },
                { label: "Fragile", value: "Fragile" },
                { label: "Heavy", value: "Heavy" },
                { label: "Cold/Fresh", value: "Cold/Fresh" },
              ]}
              value={form.package_type}
              onChange={(event) => updateField("package_type", event.target.value)}
            />
          </FormSection>

          {/* SHIPPING SERVICE SECTION */}
          <FormSection description="Select the service level and fulfillment priority." title="Shipping Service">
            <Select
              label="Service Type *"
              options={[{ label: "-- Select Service Type --", value: "" }, ...serviceSelectOptions]}
              value={String(form.service_id || "")}
              onChange={(event) => updateField("service_id", event.target.value ? Number(event.target.value) : "")}
            />
            <Input
              label="Requested Pickup Date"
              max={pickupDateLimits.max}
              min={pickupDateLimits.min}
              type="date"
              value={pickupDate}
              onChange={(event) => setPickupDate(event.target.value)}
            />
          </FormSection>
        </div>

        {/* SIDE PANEL SUMMARY */}
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
                <span className="text-sm font-semibold text-text-primary">
                  {form.weight && form.weight > 0 ? `${form.weight} kg` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Shipping Fee</span>
                <span className="text-sm font-semibold text-text-primary">
                  {estimating ? "Calculating..." : authoritativeEstimate ? `₫${estimatedCost}` : "₫0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Estimated Delivery</span>
                <span className="text-sm font-semibold text-text-primary">{estimatedDelivery}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" type="submit">
                Create Order
              </Button>
              <Button
                onClick={() => {
                  reset();
                  setPickupDate("");
                  setSenderCityCode("");
                  setSenderDistrictCode("");
                  setSenderWard("");
                  setReceiverCityCode("");
                  setReceiverDistrictCode("");
                  setReceiverWard("");
                  updateField("sender_phone", "+84 ");
                  updateField("receiver_phone", "+84 ");
                }}
                variant="secondary"
              >
                Reset
              </Button>
            </div>
            {estimateError && <p className="mt-4 text-sm font-medium text-amber-600">{estimateError}</p>}
            {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
          </Card>
        </div>
      </form>

      {/* POPUP MODAL FOR ORDER SUMMARY & PAYMENT SELECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">Order Confirmation & Payment</h2>
            <p className="mt-1 text-sm text-gray-500">Please review details before finalizing shipment creation.</p>

            <div className="mt-4 space-y-3 border-b border-t py-3 text-sm text-gray-700">
              <div>
                <strong>Sender:</strong> {form.sender_name} ({form.sender_phone})
                <br />
                <span className="text-xs text-gray-500">
                  {form.pickup_street}, Ward {senderWard}, {form.pickup_district}, {form.pickup_city}
                </span>
              </div>
              <div>
                <strong>Receiver:</strong> {form.receiver_name} ({form.receiver_phone})
                <br />
                <span className="text-xs text-gray-500">
                  {form.delivery_street}, Ward {receiverWard}, {form.delivery_district}, {form.delivery_city}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t pt-2">
                <div>
                  <strong>Package Type:</strong> {form.package_type || "Standard"}
                </div>
                <div>
                  <strong>Declared Value:</strong> ₫{(form.declared_value || 0).toLocaleString("vi-VN")}
                </div>
                <div>
                  <strong>Service:</strong> {selectedService?.service_name}
                </div>
                <div>
                  <strong>Shipping Fee:</strong> <span className="font-bold text-blue-600">₫{estimatedCost}</span>
                </div>
                <div>
                  <strong>Est. Delivery:</strong> {estimatedDelivery}
                </div>
                <div>
                  <strong>Billing Status:</strong>{" "}
                  <span
                    className={`font-semibold ${
                      paymentOption === "COD" ? "text-amber-600" : "text-green-600"
                    }`}
                  >
                    {paymentOption === "COD" ? "Pending (COD)" : "Completed"}
                  </span>
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTION */}
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-800">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption("COD")}
                  className={`rounded border p-2 text-xs font-semibold ${
                    paymentOption === "COD" ? "border-blue-600 bg-blue-50 text-blue-600" : "bg-gray-50"
                  }`}
                >
                  Ship COD
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("Cash")}
                  className={`rounded border p-2 text-xs font-semibold ${
                    paymentOption === "Cash" ? "border-blue-600 bg-blue-50 text-blue-600" : "bg-gray-50"
                  }`}
                >
                  Sender Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("Transfer")}
                  className={`rounded border p-2 text-xs font-semibold ${
                    paymentOption === "Transfer" ? "border-blue-600 bg-blue-50 text-blue-600" : "bg-gray-50"
                  }`}
                >
                  Bank Transfer
                </button>
              </div>
            </div>

            {/* SIMULATED BANK TRANSFER QR CODE DISPLAY */}
            {paymentOption === "Transfer" && (
              <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-center">
                <p className="text-xs font-bold text-gray-700">Scan QR Code via Mobile Banking</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VietQR_Simulated_${authoritativeEstimate?.estimated_total ?? 0}`}
                  alt="VietQR Transfer"
                  className="mx-auto my-2 rounded border"
                />
                <p className="text-xs font-semibold text-red-500">
                  Session expires in: <span className="text-sm font-bold">{countdown}s</span>
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={handleFinalSubmit}>
                {submitting ? "Processing..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
