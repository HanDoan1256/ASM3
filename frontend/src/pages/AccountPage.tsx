import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Select } from "../components/Select";
import { Textarea } from "../components/Textarea";
import { Icon } from "../components/Icon";
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

interface UserProfileState {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role?: string;
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
  const navigate = useNavigate();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [addressError, setAddressError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const isStaff = localStorage.getItem("smartfm_principal_type") === "staff";
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem("smartfm_access_token");

  const [userData, setUserData] = useState<UserProfileState>({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [addressForm, setAddressForm] = useState<AddressFormState>(initialAddressForm);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [history, setHistory] = useState<AccountHistoryItem[]>([]);

  const activeId = userData.id || localStorage.getItem("smartfm_principal_id") || "";

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

  const handleProtectedAction = (actionCallback?: () => void) => {
    if (!isLoggedIn) {
      setIsGuestModalOpen(true);
    } else if (actionCallback) {
      actionCallback();
    }
  };

  const loadAddresses = async (id: string) => {
    try {
      const addressData = await accountService.listAddresses(id);
      setAddresses(Array.isArray(addressData) ? addressData : []);
    } catch {
      setAddresses([]);
    }
  };

  const loadHistory = async (id: string) => {
    try {
      const historyData = await accountService.getHistory(id);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    const principalId = localStorage.getItem("smartfm_principal_id");

    if (!isLoggedIn || !principalId) {
      setUserData({
        id: "GUEST-ID-000",
        full_name: "Guest User",
        email: "guest@smartfm.com",
        phone: "N/A",
        role: "Guest",
      });
      setAddresses([]);
      setHistory([]);
      setLoading(false);
      return;
    }

    const loadAccountData = async () => {
      try {
        if (isStaff) {
          const staffProfile = await accountService.getStaff(principalId);
          setUserData({
            id: staffProfile.staff_id || staffProfile.id || principalId,
            full_name: staffProfile.full_name || "",
            email: staffProfile.email || "",
            phone: staffProfile.phone || "",
            role: staffProfile.role || "Staff",
          });
        } else {
          const profileData = await accountService.getCustomer(principalId);
          setUserData({
            id: profileData.customer_id || principalId,
            full_name: profileData.full_name || "",
            email: profileData.email || "",
            phone: profileData.phone || "",
          });
        }

        await loadAddresses(principalId);
        await loadHistory(principalId);
      } catch (error) {
        setMessage(extractApiError(error, "Could not load complete account profile from database."));
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, [isLoggedIn, isStaff]);

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
    handleProtectedAction(() => {
      resetAddressForm();
      setIsAddressModalOpen(true);
    });
  };

  const openEditAddressModal = (address: Address) => {
    handleProtectedAction(() => {
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
    });
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
    setUserData((current) => ({ ...current, [name]: value }));
  };

  const handleAddressFieldChange = (field: keyof AddressFormState, value: string | boolean) => {
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      if (isStaff) {
        if (typeof (accountService as any).updateStaff === "function") {
          await (accountService as any).updateStaff(userData.id, {
            full_name: userData.full_name,
            phone: userData.phone,
          });
        }
        setMessage("Staff profile successfully updated.");
      } else {
        await accountService.updateCustomer(userData.id, {
          full_name: userData.full_name,
          phone: userData.phone,
        });
        setMessage("Profile successfully updated.");
        await loadHistory(userData.id);
      }
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
      if (!isStaff) {
        await accountService.deleteCustomer(userData.id);
      }
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
    if (!activeId) {
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
        await accountService.createAddress(activeId, payload as AddressCreatePayload);
        setMessage("Address added successfully.");
      }

      await loadAddresses(activeId);
      closeAddressModal();
    } catch (error) {
      setAddressError(extractApiError(error, "Could not save the address. Please try again."));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    handleProtectedAction(async () => {
      const confirmDelete = window.confirm("Delete this saved address?");
      if (!confirmDelete || !activeId) {
        return;
      }

      try {
        await accountService.deleteAddress(addressId);
        await loadAddresses(activeId);
        setMessage("Address deleted successfully.");
      } catch (error) {
        setMessage(extractApiError(error, "Could not delete the address. Please try again."));
      }
    });
  };

  const handleSetDefaultAddress = async (address: Address) => {
    handleProtectedAction(async () => {
      if (!activeId || address.is_default) {
        return;
      }

      try {
        await syncSingleDefaultAddress(address.address_id);
        await accountService.updateAddress(address.address_id, { is_default: true });
        await loadAddresses(activeId);
        setMessage("Default address updated successfully.");
      } catch (error) {
        setMessage(extractApiError(error, "Could not update the default address."));
      }
    });
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
        eyebrow="Account Management"
        description="Manage your personal profile, role permissions, activity history, and saved delivery addresses."
        title="Account Settings"
      />

      <div className="space-y-6">
        {/* Profile Details Card */}
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
              <p className="text-sm font-medium text-text-secondary">User ID</p>
              <input
                type="text"
                value={userData.id}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-xl border border-border bg-gray-100 p-2.5 font-mono text-xs text-gray-500"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Full Name</p>
              <input
                type="text"
                name="full_name"
                value={userData.full_name}
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
                value={userData.email}
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
                value={userData.phone}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className={`mt-1 w-full rounded-xl border border-border p-2.5 text-sm font-semibold text-text-primary ${
                  !isEditingProfile ? "bg-gray-50" : "bg-surface focus:ring-2 focus:ring-brand-500"
                }`}
              />
            </div>
            {userData.role && (
              <div>
                <p className="text-sm font-medium text-text-secondary">Staff Role / Department</p>
                <input
                  type="text"
                  value={userData.role}
                  disabled
                  className="mt-1 w-full cursor-not-allowed rounded-xl border border-border bg-gray-50 p-2.5 text-sm font-semibold text-text-primary"
                />
              </div>
            )}
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
                <Button variant="secondary" onClick={() => handleProtectedAction(() => setIsEditingProfile(true))}>
                  Edit Profile
                </Button>
                {!isStaff && (
                  <Button className="border-transparent bg-red-600 text-white hover:bg-red-700" onClick={() => handleProtectedAction(handleDeleteAccount)}>
                    Delete Account
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Activity History Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Activity History</h3>
              <p className="mt-1 text-sm text-text-secondary">Review recent modifications and log entries.</p>
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
                    No recent activity history found.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Saved Delivery Addresses Card */}
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

      {/* Address Form Modal - ĐÃ TỐI ƯU RESPONSIVE, CÓ THANH CUỘN BÊN TRONG */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={closeAddressModal}
        title={editingAddress ? "Edit Address" : "Add Address"}
      >
        <form className="flex flex-col max-h-[80vh]" onSubmit={handleSaveAddress}>
          {/* Phần nội dung form được phép cuộn dọc khi vượt quá chiều cao màn hình */}
          <div className="space-y-4 overflow-y-auto pr-1 pb-4">
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

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-gray-50 px-4 py-3 text-sm font-medium text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={addressForm.is_default}
                onChange={(event) => handleAddressFieldChange("is_default", event.target.checked)}
              />
              Set as default address
            </label>

            {addressError && <p className="text-sm font-medium text-danger">{addressError}</p>}
          </div>

          {/* Phần Footer chứa nút bấm luôn được ghim cố định ở đáy modal, không bị che khuất */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2 bg-white">
            <Button variant="secondary" type="button" onClick={closeAddressModal}>
              Cancel
            </Button>
            <Button disabled={savingAddress} type="submit">
              {savingAddress ? "Saving..." : editingAddress ? "Save Address" : "Add Address"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Guest Mode Authentication Required Modal */}
      <Modal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        title="Authentication Required"
      >
        <div className="py-4 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-inner">
            <Icon className="text-3xl" name="lock" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-text-primary">Sign in required</h3>
            <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
              Please sign in or register an account to modify account settings or manage addresses.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button variant="secondary" onClick={() => setIsGuestModalOpen(false)}>
              Close & Keep Viewing
            </Button>
            <Button
              onClick={() => {
                setIsGuestModalOpen(false);
                navigate("/login");
              }}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}