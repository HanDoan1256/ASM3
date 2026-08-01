import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Select } from "../components/Select";
import { Textarea } from "../components/Textarea";
import { accountService } from "../services/accountService";
import type { Address, AddressCreatePayload, AddressUpdatePayload } from "../types/account";
import { sanitizeVietnamPhone } from "../utils/phone";
import {
  appendWardToStreet,
  listVietnamDistricts,
  listVietnamProvinces,
  listVietnamWards,
  splitStreetAndWard,
} from "../utils/vietnamLocations";

interface CustomerProfileState {
  customer_id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface AddressFormState {
  receiver_name: string;
  receiver_phone: string;
  street_line: string;
  city_code: string;
  district_code: string;
  ward: string;
  postal_code: string;
  is_default: boolean;
}

interface AccountHistoryItem {
  action: string;
  created_at: string;
}

const initialAddressForm: AddressFormState = {
  receiver_name: "",
  receiver_phone: "+84 ",
  street_line: "",
  city_code: "",
  district_code: "",
  ward: "",
  postal_code: "",
  is_default: false,
};

function extractApiError(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const maybeResponse = error as { response?: { data?: { detail?: string } } };
    const detail = maybeResponse.response?.data?.detail;
    if (detail) {
      return detail;
    }
  }
  return fallback;
}

function findOptionValueByLabel(options: Array<{ label: string; value: string }>, label: string): string {
  return options.find((option) => option.label === label)?.value ?? "";
}

export function AccountPage() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [addressError, setAddressError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [customerData, setCustomerData] = useState<CustomerProfileState>({
    customer_id: "",
    full_name: "",
    email: "",
    phone: "",
  });
  const [addressForm, setAddressForm] = useState<AddressFormState>(initialAddressForm);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [history, setHistory] = useState<AccountHistoryItem[]>([]);

  const customerId = customerData.customer_id || localStorage.getItem("smartfm_principal_id") || "";

  const provinceOptions = useMemo(
    () => [{ label: "-- Select City/Province --", value: "" }, ...listVietnamProvinces()],
    [],
  );
  const districtOptions = useMemo(
    () => [{ label: "-- Select District --", value: "" }, ...listVietnamDistricts(addressForm.city_code)],
    [addressForm.city_code],
  );
  const wardOptions = useMemo(
    () => [{ label: "-- Select Ward --", value: "" }, ...listVietnamWards(addressForm.district_code)],
    [addressForm.district_code],
  );

  const loadAddresses = async (activeCustomerId: string) => {
    const addressData = await accountService.listAddresses(activeCustomerId);
    setAddresses(Array.isArray(addressData) ? addressData : []);
  };

  const loadHistory = async (activeCustomerId: string) => {
    const historyData = await accountService.getHistory(activeCustomerId);
    setHistory(Array.isArray(historyData) ? historyData : []);
  };

  useEffect(() => {
    const activeCustomerId = localStorage.getItem("smartfm_principal_id");

    if (!activeCustomerId) {
      setMessage("No active session found. Please sign in again.");
      setLoading(false);
      return;
    }

    const loadAccountData = async () => {
      try {
        const [profileData, addressData, historyData] = await Promise.all([
          accountService.getCustomer(activeCustomerId),
          accountService.listAddresses(activeCustomerId),
          accountService.getHistory(activeCustomerId),
        ]);

        setCustomerData({
          customer_id: profileData.customer_id || activeCustomerId,
          full_name: profileData.full_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
        });
        setAddresses(Array.isArray(addressData) ? addressData : []);
        setHistory(Array.isArray(historyData) ? historyData : []);
      } catch (error) {
        setMessage(extractApiError(error, "Could not load complete account profile from database."));
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, []);

  const resetAddressForm = () => {
    setAddressForm(initialAddressForm);
    setEditingAddress(null);
    setAddressError("");
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    resetAddressForm();
  };

  const openCreateAddressModal = () => {
    resetAddressForm();
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (address: Address) => {
    const provinces = listVietnamProvinces();
    const cityCode = findOptionValueByLabel(provinces, address.city);
    const districts = listVietnamDistricts(cityCode);
    const districtCode = findOptionValueByLabel(districts, address.district);
    const { streetLine, ward } = splitStreetAndWard(address.street);

    setEditingAddress(address);
    setAddressForm({
      receiver_name: address.receiver_name,
      receiver_phone: sanitizeVietnamPhone(address.receiver_phone),
      street_line: streetLine,
      city_code: cityCode,
      district_code: districtCode,
      ward,
      postal_code: address.postal_code || "",
      is_default: Boolean(address.is_default),
    });
    setAddressError("");
    setIsAddressModalOpen(true);
  };

  const syncSingleDefaultAddress = async (nextDefaultAddressId?: number) => {
    const otherDefaults = addresses.filter(
      (address) => address.is_default && address.address_id !== nextDefaultAddressId,
    );

    await Promise.all(
      otherDefaults.map((address) =>
        accountService.updateAddress(address.address_id, {
          is_default: false,
        }),
      ),
    );
  };

  const validateAddressForm = (): string | null => {
    if (!addressForm.receiver_name.trim()) return "Please enter the receiver name.";
    if (addressForm.receiver_phone.trim().length <= 4) return "Please enter a valid Vietnamese phone number.";
    if (!addressForm.street_line.trim()) return "Please enter the street address.";
    if (!addressForm.city_code) return "Please select the city or province.";
    if (!addressForm.district_code) return "Please select the district.";
    if (!addressForm.ward) return "Please select the ward.";
    return null;
  };

  const buildAddressPayload = (): AddressCreatePayload | AddressUpdatePayload => {
    const cityName = provinceOptions.find((option) => option.value === addressForm.city_code)?.label || "";
    const districtName = districtOptions.find((option) => option.value === addressForm.district_code)?.label || "";

    return {
      receiver_name: addressForm.receiver_name.trim(),
      receiver_phone: addressForm.receiver_phone.replace(/\s+/g, ""),
      street: appendWardToStreet(addressForm.street_line, addressForm.ward),
      district: districtName,
      city: cityName,
      postal_code: addressForm.postal_code.trim() || undefined,
      is_default: addressForm.is_default,
    };
  };

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCustomerData((current) => ({ ...current, [name]: value }));
  };

  const handleAddressFieldChange = (field: keyof AddressFormState, value: string | boolean) => {
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await accountService.updateCustomer(customerData.customer_id, {
        full_name: customerData.full_name,
        phone: customerData.phone,
      });
      setMessage("Profile successfully updated.");
      await loadHistory(customerData.customer_id);
      setIsEditingProfile(false);
    } catch (error) {
      setMessage(extractApiError(error, "Network error while saving profile changes."));
      setIsEditingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");

    if (!confirmDelete) {
      return;
    }

    try {
      await accountService.deleteCustomer(customerData.customer_id);
      localStorage.clear();
      window.location.href = "/login";
    } catch (error) {
      setMessage(extractApiError(error, "Failed to delete account. Please try again."));
    }
  };

  const handleSaveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateAddressForm();
    if (validationError) {
      setAddressError(validationError);
      return;
    }
    if (!customerId) {
      setAddressError("No active session found. Please sign in again.");
      return;
    }

    setSavingAddress(true);
    setAddressError("");

    try {
      const payload = buildAddressPayload();

      if (addressForm.is_default) {
        await syncSingleDefaultAddress(editingAddress?.address_id);
      }

      if (editingAddress) {
        await accountService.updateAddress(editingAddress.address_id, payload);
        setMessage("Address updated successfully.");
      } else {
        await accountService.createAddress(customerId, payload as AddressCreatePayload);
        setMessage("Address added successfully.");
      }

      await loadAddresses(customerId);
      closeAddressModal();
    } catch (error) {
      setAddressError(extractApiError(error, "Could not save the address. Please try again."));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    const confirmDelete = window.confirm("Delete this saved address?");
    if (!confirmDelete || !customerId) {
      return;
    }

    try {
      await accountService.deleteAddress(addressId);
      await loadAddresses(customerId);
      setMessage("Address deleted successfully.");
    } catch (error) {
      setMessage(extractApiError(error, "Could not delete the address. Please try again."));
    }
  };

  const handleSetDefaultAddress = async (address: Address) => {
    if (!customerId || address.is_default) {
      return;
    }

    try {
      await syncSingleDefaultAddress(address.address_id);
      await accountService.updateAddress(address.address_id, { is_default: true });
      await loadAddresses(customerId);
      setMessage("Default address updated successfully.");
    } catch (error) {
      setMessage(extractApiError(error, "Could not update the default address."));
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="p-6 text-center text-text-secondary">Loading account details...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Account"
        description="Manage your customer profile and saved delivery addresses."
        title="Account Settings"
      />

      <div className="space-y-6">
        <Card className="p-6 space-y-6">
          {message && (
            <div
              className={`rounded-xl p-3 text-sm font-medium ${
                message.toLowerCase().includes("fail") || message.toLowerCase().includes("error")
                  ? "bg-danger/10 text-danger"
                  : "bg-brand-50 text-brand-500"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-text-secondary">Customer ID</p>
              <input
                type="text"
                value={customerData.customer_id}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-xl border border-border bg-gray-100 p-2.5 font-mono text-xs text-gray-500"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Full Name</p>
              <input
                type="text"
                name="full_name"
                value={customerData.full_name}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={`mt-1 w-full rounded-xl border border-border p-2.5 text-sm font-semibold text-text-primary ${
                  !isEditingProfile ? "bg-gray-50" : "bg-surface focus:ring-2 focus:ring-brand-500"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Email Address</p>
              <input
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleProfileChange}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-xl border border-border bg-gray-50 p-2.5 text-sm font-semibold text-text-primary"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Phone Number</p>
              <input
                type="text"
                name="phone"
                value={customerData.phone}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={`mt-1 w-full rounded-xl border border-border p-2.5 text-sm font-semibold text-text-primary ${
                  !isEditingProfile ? "bg-gray-50" : "bg-surface focus:ring-2 focus:ring-brand-500"
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            {isEditingProfile ? (
              <div className="flex w-full space-x-3">
                <Button variant="secondary" className="w-1/2" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </Button>
                <Button className="w-1/2 bg-success text-white hover:bg-success/90" onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="flex w-full justify-between">
                <Button variant="secondary" onClick={() => setIsEditingProfile(true)}>
                  Edit Profile
                </Button>
                <Button className="border-transparent bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Activity History</h3>
              <p className="mt-1 text-sm text-text-secondary">Review the recent changes made to your profile.</p>
            </div>

            <Button variant="secondary" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "Hide History" : "View History"}
            </Button>
          </div>

          {showHistory && (
            <div className="mt-6 border-t border-border pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <div
                      key={`${item.created_at}-${index}`}
                      className="flex items-center justify-between rounded-lg border-b border-border px-2 py-3 text-sm transition-colors last:border-0 hover:bg-gray-50"
                    >
                      <span className="font-medium text-text-primary">{item.action}</span>
                      <span className="text-xs text-text-secondary">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed border-border bg-gray-50 py-6 text-center text-sm text-gray-400">
                    No recent profile changes found.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Saved Delivery Addresses</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Save frequently used receiver addresses with validated Vietnam location details.
              </p>
            </div>
            <Button onClick={openCreateAddressModal}>Add Address</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <div key={address.address_id} className="space-y-3 rounded-xl border border-border bg-gray-50 p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-primary">
                        Receiver: {address.receiver_name || "N/A"}
                        {address.is_default && (
                          <span className="ml-2 rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-600">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-text-secondary">Phone: {address.receiver_phone || "N/A"}</p>
                      <p className="text-text-secondary">
                        Address: {address.street}, {address.district}, {address.city}
                      </p>
                      {address.postal_code && (
                        <p className="text-text-secondary">Postal Code: {address.postal_code}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {!address.is_default && (
                      <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => handleSetDefaultAddress(address)}>
                        Set Default
                      </Button>
                    )}
                    <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => openEditAddressModal(address)}>
                      Edit
                    </Button>
                    <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => handleDeleteAddress(address.address_id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-2 py-4 text-center text-sm text-gray-400">No saved addresses found.</p>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isAddressModalOpen}
        onClose={closeAddressModal}
        title={editingAddress ? "Edit Address" : "Add Address"}
      >
        <form className="space-y-4" onSubmit={handleSaveAddress}>
          <Input
            label="Receiver Name *"
            value={addressForm.receiver_name}
            onChange={(event) => handleAddressFieldChange("receiver_name", event.target.value)}
          />

          <Input
            label="Receiver Phone *"
            placeholder="+84 901234567"
            value={addressForm.receiver_phone}
            onChange={(event) => handleAddressFieldChange("receiver_phone", sanitizeVietnamPhone(event.target.value))}
          />

          <Textarea
            label="Street / House No. *"
            rows={3}
            value={addressForm.street_line}
            onChange={(event) => handleAddressFieldChange("street_line", event.target.value)}
          />

          <Select
            label="City / Province *"
            options={provinceOptions}
            value={addressForm.city_code}
            onChange={(event) => {
              handleAddressFieldChange("city_code", event.target.value);
              handleAddressFieldChange("district_code", "");
              handleAddressFieldChange("ward", "");
            }}
          />

          <Select
            disabled={!addressForm.city_code}
            label="District *"
            options={districtOptions}
            value={addressForm.district_code}
            onChange={(event) => {
              handleAddressFieldChange("district_code", event.target.value);
              handleAddressFieldChange("ward", "");
            }}
          />

          <Select
            disabled={!addressForm.district_code}
            label="Ward *"
            options={wardOptions}
            value={addressForm.ward}
            onChange={(event) => handleAddressFieldChange("ward", event.target.value)}
          />

          <Input
            label="Postal Code"
            value={addressForm.postal_code}
            onChange={(event) => handleAddressFieldChange("postal_code", event.target.value)}
          />

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-gray-50 px-4 py-3 text-sm font-medium text-text-primary">
            <input
              type="checkbox"
              checked={addressForm.is_default}
              onChange={(event) => handleAddressFieldChange("is_default", event.target.checked)}
            />
            Set as default address
          </label>

          {addressError && <p className="text-sm font-medium text-danger">{addressError}</p>}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeAddressModal}>
              Cancel
            </Button>
            <Button disabled={savingAddress} type="submit">
              {savingAddress ? "Saving..." : editingAddress ? "Save Address" : "Add Address"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
