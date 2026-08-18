import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Package,
  Bell,
  LogOut,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Home,
  Briefcase,
  Building,
  KeyRound,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { BottomNav } from "@/components/customer/BottomNav";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
import { LocationModal } from "@/components/customer/LocationModal";
import { useAuth } from "@/lib/auth-context";
import { customerApi, authApi, type CustomerAddress } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Profile & Addresses | MARUTHAM KART" },
      { name: "description", content: "Manage your customer profile, delivery addresses, and security on MARUTHAM KART." },
    ],
  }),
  component: CustomerAccountPage,
});

function CustomerAccountPage() {
  const navigate = useNavigate();
  const { user, addresses, activeAddress, logout, refreshAddresses, setDefaultAddress } = useAuth();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Profile Edit State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await customerApi.updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      toast.success("Profile updated successfully!");
      setIsEditProfileOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully!");
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await customerApi.deleteAddress(id);
      await refreshAddresses();
      toast.success("Address deleted.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MK";

  return (
    <div className="min-h-screen bg-[#F8FDF9] flex flex-col justify-between pb-24 md:pb-0">
      <div>
        <CustomerHeader />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Top Profile Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-xl font-black shadow-md shadow-emerald-800/20">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{user?.name || "Customer"}</h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Verified Customer
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {user?.phone || user?.email || "Direct Farm Customer"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-200"
            >
              Edit Profile
            </button>
          </div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/orders"
              className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 hover:border-emerald-600 hover:shadow-xs transition-all"
            >
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">My Orders</h4>
                <p className="text-[10px] text-slate-500 font-medium">History & live fulfillment tracking</p>
              </div>
            </Link>

            <Link
              to="/notifications"
              className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 hover:border-emerald-600 hover:shadow-xs transition-all"
            >
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                <p className="text-[10px] text-slate-500 font-medium">Alerts, offers and order updates</p>
              </div>
            </Link>
          </div>

          {/* Saved Addresses Section */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Saved Delivery Addresses</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Manage locations for smart godown fulfillment</p>
                </div>
              </div>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {addresses.map((addr) => {
                const isDefault = activeAddress?.id === addr.id || addr.is_default;
                return (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-2xl border flex items-start justify-between transition-all ${
                      isDefault ? "border-emerald-600 bg-emerald-50/40" : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white text-emerald-800 border border-slate-200 rounded-xl mt-0.5">
                        {addr.address_label === "Home" && <Home className="w-4 h-4" />}
                        {addr.address_label === "Work" && <Briefcase className="w-4 h-4" />}
                        {addr.address_label === "Other" && <Building className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{addr.address_label}</span>
                          {isDefault && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Active Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {addr.door_no ? `${addr.door_no}, ` : ""}
                          {addr.street_address}, {addr.area}
                        </p>
                        <p className="text-xs text-slate-500 font-bold">
                          {addr.city}, {addr.state} - {addr.postal_code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isDefault && (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Set Default
                        </button>
                      )}
                      {addresses.length > 1 && (
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {addresses.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No addresses saved yet. Click &quot;Add Address&quot; to configure your delivery location.
                </div>
              )}
            </div>
          </section>

          {/* Security & Password */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Account Security</h3>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white text-slate-700 border border-slate-200 rounded-xl">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Change Password</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Update your account password</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Change
              </button>
            </div>
          </section>

          {/* Logout Section */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of MARUTHAM KART</span>
            </button>
          </div>
        </main>
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mobile Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Change Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomerFooter />
      <BottomNav />
    </div>
  );
}
