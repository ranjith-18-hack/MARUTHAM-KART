import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Package,
  Truck,
  Clock,
  Loader2,
  KeyRound,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Phone,
  Warehouse,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/customer/BottomNav";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
import { EmptyStateIllustration } from "@/components/illustrations/IllustrationLibrary";
import { ordersApi } from "@/lib/api";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders & Tracking | MARUTHAM KART" },
      {
        name: "description",
        content: "Track your orders and view your purchase history of fresh agricultural products.",
      },
    ],
  }),
  component: OrdersPage,
});

interface OrderTracking {
  order_id: string;
  order_code: string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  total_amount: number;
  delivery_charge: number;
  delivery_address?: string;
  destination: string;
  verified_weight_kg?: number;
  package_count?: number;
  godown_name?: string;
  driver_name?: string;
  driver_id_code?: string;
  driver_phone?: string;
  vehicle_code?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  vehicle_capacity?: string;
  eta?: string;
  delivery_otp?: string;
  payment_verified_at?: string;
  driver_assigned_at?: string;
  assignment_duration_seconds?: number;
  assignment_sla_status?: string;
  delay_reason?: string;
  timeline?: { status: string; timestamp: string; notes?: string }[];
  items?: any[];
  created_at: string;
}

function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    ordersApi
      .getOrders({ limit: 20 })
      .then((res) => {
        if (res && res.items) {
          setOrders(res.items);
          if (res.items.length > 0) {
            const firstId = res.items[0].id;
            ordersApi
              .getTracking(firstId)
              .then((trackRes: any) => {
                setTracking(trackRes);
              })
              .catch((err: any) => {
                console.warn("Failed to fetch tracking details:", err);
              });
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch customer orders:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const ORDER_STATUS_ORDER = [
    "Pending",
    "Processing",
    "Picking",
    "Packing",
    "Ready for Dispatch",
    "Driver Assigned",
    "Dispatched",
    "On Route",
    "Out for Delivery",
    "Delivered",
  ];

  const activeOrder = orders[0];
  const activeStatus = tracking?.status || activeOrder?.status || "Pending";
  const pastOrders = orders.slice(1);

  const getStepStatus = (stepName: string, currentStatus: string) => {
    const currentIdx = ORDER_STATUS_ORDER.indexOf(currentStatus);
    const stepIdx = ORDER_STATUS_ORDER.indexOf(stepName);
    if (stepIdx === -1 || currentIdx === -1) return "pending";
    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "current";
    return "pending";
  };

  const displaySteps = [
    { label: "ORDER CONFIRMED", status: getStepStatus("Pending", activeStatus) },
    { label: "PREPARING HARVEST", status: getStepStatus("Picking", activeStatus) },
    { label: "PACKED & WEIGHED", status: getStepStatus("Packing", activeStatus) },
    { label: "DRIVER & VEHICLE ASSIGNED", status: getStepStatus("Driver Assigned", activeStatus) },
    { label: "OUT FOR DELIVERY", status: getStepStatus("Out for Delivery", activeStatus) },
    { label: "DELIVERED", status: getStepStatus("Delivered", activeStatus) },
  ];

  return (
    <div className="min-h-screen bg-[#F8FDF9] flex flex-col justify-between pb-24 md:pb-0">
      <div>
        <CustomerHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Title */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                My Orders & Tracking
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Real-time regional fulfillment & live status
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider">
              {orders.length} Total Orders
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-800 animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Loading orders & tracking status...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto shadow-xs">
              <EmptyStateIllustration type="orders" className="w-44 h-44 drop-shadow-sm" />
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  No orders placed yet
                </h2>
                <p className="text-slate-500 font-semibold max-w-xs mx-auto text-xs">
                  Your basket is waiting for authentic fresh produce from Tamil Nadu farms!
                </p>
              </div>
              <Link
                to="/home"
                className="bg-emerald-800 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-900 transition-all shadow-md shadow-emerald-800/20"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. Active Order Live Tracking Section */}
              {activeOrder && (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-6">
                  {/* Top Bar */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-800/80 flex items-center justify-center border border-emerald-700/60">
                        <Package className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-tight">
                          Active Order #{activeOrder.order_code || activeOrder.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <span className="text-[10px] text-emerald-200 font-medium">
                          Placed on {new Date(activeOrder.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-950 bg-emerald-300 px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeStatus}
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Live Delivery OTP Pill */}
                    {tracking?.delivery_otp && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                              Secure Delivery Verification Code (OTP)
                            </p>
                            <p className="text-xs text-slate-600 font-medium">
                              Share this code with your assigned delivery partner upon arrival.
                            </p>
                          </div>
                        </div>
                        <div className="bg-white border-2 border-emerald-700 text-emerald-900 font-mono font-black text-xl px-4 py-1.5 rounded-xl tracking-widest shadow-2xs">
                          {tracking.delivery_otp}
                        </div>
                      </div>
                    )}

                    {/* Progress Timeline */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Live Fulfillment Timeline
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {displaySteps.map((step, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all ${
                              step.status === "completed"
                                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                                : step.status === "current"
                                ? "bg-emerald-800 text-white border-emerald-900 shadow-sm"
                                : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-black">
                              {step.status === "completed" ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-tight leading-tight">
                              {step.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assigned Logistics Info */}
                    {tracking && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {tracking.godown_name && (
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                              <Warehouse className="w-4 h-4 text-emerald-700" />
                              <span>Origin Godown</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">{tracking.godown_name}</p>
                          </div>
                        )}

                        {tracking.driver_name && (
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                              <UserCheck className="w-4 h-4 text-emerald-700" />
                              <span>Assigned Driver</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              {tracking.driver_name} ({tracking.driver_phone || "Contact via App"})
                            </p>
                          </div>
                        )}

                        {tracking.vehicle_number && (
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                              <Truck className="w-4 h-4 text-emerald-700" />
                              <span>Delivery Vehicle</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              {tracking.vehicle_number} • {tracking.vehicle_type || "Eco Transport"}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Past Order History */}
              {pastOrders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Previous Orders ({pastOrders.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs text-slate-900">
                            Order #{ord.order_code || ord.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {ord.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                          <span>Amount: ₹{Number(ord.total_amount).toFixed(2)}</span>
                          <span>{new Date(ord.created_at).toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CustomerFooter />
      <BottomNav />
    </div>
  );
}
