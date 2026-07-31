import React, { useState, useEffect } from 'react';
import { Card } from "../components/Card";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";

export function AccountPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 1. THÊM STATE ĐIỀU KHIỂN ẨN/HIỆN LỊCH SỬ
  const [showHistory, setShowHistory] = useState(false);

  const [customerData, setCustomerData] = useState({
    customer_id: '',
    full_name: '',
    email: '',
    phone: ''
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const customerId = localStorage.getItem("smartfm_principal_id");

    if (!customerId) {
      setMessage('No active session found. Please sign in again.');
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/api/accounts/customers/${customerId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch customer profile");
        return res.json();
      })
      .then(data => {
        if (data) {
          setCustomerData({
            customer_id: data.customer_id || customerId,
            full_name: data.full_name || '',
            email: data.email || '',
            phone: data.phone || ''
          });
        }
      })
      .catch(err => {
        console.error("Error fetching customer:", err);
        setMessage('Could not load customer profile from database.');
      });

    fetch(`http://localhost:8000/api/accounts/customers/${customerId}/addresses`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch addresses");
        return res.json();
      })
      .then(addrList => {
        if (Array.isArray(addrList)) {
          setAddresses(addrList);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching addresses:", err);
        setLoading(false);
      });

    fetch(`http://localhost:8000/api/accounts/customers/${customerId}/history`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch history");
        return res.json();
      })
      .then(historyData => {
        if (Array.isArray(historyData)) {
          setHistory(historyData);
        }
      })
      .catch(err => {
        console.error("Error fetching history:", err);
      });

  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/accounts/customers/${customerData.customer_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: customerData.full_name,
          email: customerData.email,
          phone: customerData.phone
        })
      });

      if (response.ok) {
        setMessage('Profile successfully updated!');
        
        fetch(`http://localhost:8000/api/accounts/customers/${customerData.customer_id}/history`)
          .then(res => res.json())
          .then(historyData => {
            if (Array.isArray(historyData)) setHistory(historyData);
          });

      } else {
        setMessage('Failed to update profile.');
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Network error while saving changes.');
      setIsEditing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:8000/api/accounts/customers/${customerData.customer_id}`, {
          method: 'DELETE',
        });

        if (response.ok || response.status === 204) {
          alert('Account deleted successfully.');
          localStorage.clear();
          window.location.href = '/login'; 
        } else {
          setMessage('Failed to delete account. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        setMessage('Network error while attempting to delete account.');
      }
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
        {/* CARD 1: Thông tin Profile */}
        <Card className="p-6 space-y-6">
          {message && (
            <div className={`p-3 text-sm font-medium rounded-xl ${message.includes('Failed') || message.includes('error') ? 'bg-danger/10 text-danger' : 'bg-brand-50 text-brand-500'}`}>
              {message}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-text-secondary font-medium">Customer ID</p>
              <input type="text" value={customerData.customer_id} disabled className="mt-1 w-full p-2.5 bg-gray-100 border border-border rounded-xl font-mono text-xs text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">Full Name</p>
              <input type="text" name="full_name" value={customerData.full_name} onChange={handleChange} disabled={!isEditing} className={`mt-1 w-full p-2.5 border border-border rounded-xl text-sm font-semibold text-text-primary ${!isEditing ? 'bg-gray-50' : 'bg-surface focus:ring-2 focus:ring-brand-500'}`} />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">Email Address</p>
              <input type="email" name="email" value={customerData.email} onChange={handleChange} disabled={!isEditing} className={`mt-1 w-full p-2.5 border border-border rounded-xl text-sm font-semibold text-text-primary ${!isEditing ? 'bg-gray-50' : 'bg-surface focus:ring-2 focus:ring-brand-500'}`} />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">Phone Number</p>
              <input type="text" name="phone" value={customerData.phone} onChange={handleChange} disabled={!isEditing} className={`mt-1 w-full p-2.5 border border-border rounded-xl text-sm font-semibold text-text-primary ${!isEditing ? 'bg-gray-50' : 'bg-surface focus:ring-2 focus:ring-brand-500'}`} />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            {isEditing ? (
              <div className="flex space-x-3 w-full">
                <Button variant="secondary" className="w-1/2" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button className="w-1/2 bg-success hover:bg-success/90 text-white" onClick={handleSave}>Save Changes</Button>
              </div>
            ) : (
              <div className="flex justify-between w-full">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white border-transparent" onClick={handleDeleteAccount}>Delete Account</Button>
              </div>
            )}
          </div>
        </Card>

        {/* 2. CARD MỚI: ACTIVITY HISTORY VỚI NÚT TOGGLE */}
        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Activity History</h3>
              <p className="text-sm text-text-secondary mt-1">Review the recent changes made to your profile.</p>
            </div>
            
            {/* Nút bấm chuyển đổi trạng thái showHistory */}
            <Button 
              variant="secondary" 
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Hide History" : "View History"}
            </Button>
          </div>

          {/* Khối chứa lịch sử sẽ chỉ hiển thị khi showHistory là true */}
          {showHistory && (
            <div className="mt-6 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-border text-sm last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                      <span className="text-text-primary font-medium">{item.action}</span>
                      <span className="text-text-secondary text-xs">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-border mt-4">
                    No recent profile changes found.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* CARD 3: Sổ Địa Chỉ */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Saved Delivery Addresses</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {addresses.length > 0 ? (
              addresses.map((addr, index) => (
                <div key={index} className="p-4 border border-border rounded-xl bg-gray-50 space-y-1 text-sm">
                  <p className="font-semibold text-text-primary">Receiver: {addr.receiver_name || 'N/A'}</p>
                  <p className="text-text-secondary">Phone: {addr.receiver_phone || 'N/A'}</p>
                  <p className="text-text-secondary">Address: {addr.street}, {addr.district}, {addr.city}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 col-span-2 text-center py-4">No saved addresses found.</p>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}