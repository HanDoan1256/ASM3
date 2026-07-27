import { useState } from "react";

import type { OrderFormState } from "../types/order";

const initialState: OrderFormState = {
  sender_name: "",
  sender_phone: "",
  pickup_street: "",
  pickup_district: "",
  pickup_city: "",
  pickup_postal_code: "",
  receiver_name: "",
  receiver_phone: "",
  delivery_street: "",
  delivery_district: "",
  delivery_city: "",
  delivery_postal_code: "",
  weight: 1,
  dimensions: "",
  package_type: "",
  declared_value: 0,
  service_id: 0,
  notes: "",
};

export function useShipmentForm() {
  const [form, setForm] = useState<OrderFormState>(initialState);

  const updateField = (name: keyof OrderFormState, value: string | number) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const reset = () => setForm(initialState);

  return { form, updateField, reset };
}
