import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Package, Truck, Clock, Loader2, KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/customer/BottomNav";
import { EmptyStateIllustration } from "@/components/illustrations/IllustrationLibrary";
import { ordersApi } from "@/lib/api";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders | MARUTHAM KART" },
      { name: "description", content: "Track your orders and view your purchase history of fresh agricultural products." },
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
    ordersApi.getOrders({ limit: 20 })
      .then((res) => {
        if (res && res.items) {
          setOrders(res.items);
          if (res.items.length > 0) {
            const firstId = res.items[0].id;
            ordersApi.getTracking(firstId)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-very-light-green pb-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-green animate-spin mb-3" />
        <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading orders...</p>
        <BottomNav />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-very-light-green pb-24 flex flex-col">
        <header className="bg-white p-4 border-b border-border-color sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg font-black text-primary-text uppercase tracking-tight">My Orders</h1>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <EmptyStateIllustration type="orders" className="w-48 h-48 drop-shadow-sm" />
          <div className="space-y-2">
            <h2 className="text-xl font-black text-primary-text uppercase tracking-tight">No orders yet</h2>
            <p className="text-secondary-text font-semibold max-w-xs mx-auto text-sm">
              Your basket is waiting for some fresh farm products!
            </p>
          </div>
          <Link to="/home" className="bg-primary-green text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-dark-green transition-all shadow-lg shadow-primary-green/20">
            Start Shopping
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

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
  const activeStatus = tracking?.status || activeOrder.status;
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
    { label: "PREPARING ORDER", status: getStepStatus("Picking", activeStatus) },
    { label: "PACKED & VERIFIED", status: getStepStatus("Packing", activeStatus) },
    { label: "VEHICLE & DRIVER ASSIGNED", status: getStepStatus("Driver Assigned", activeStatus) },
    { label: "OUT FOR DELIVERY", status: getStepStatus("Out for Delivery", activeStatus) },
    { label: "DELIVERED", status: getStepStatus("Delivered", activeStatus) },
  ];

  return (
    <div className="min-h-screen bg-very-light-green pb-24">
      <header className="bg-white p-4 border-b border-border-color sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-black text-primary-text">My Orders ({orders.length})</h1>
          <span className="text-[10px] font-bold text-primary-green bg-light-green px-2.5 py-1 rounded-full uppercase">
            Live Updates
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Active Order Card */}
        {activeOrder && (
          <div className="bg-white rounded-2xl border border-border-color overflow-hidden shadow-sm">
            <div className="p-4 bg-light-green/30 border-b border-border-color flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary-green" />
                <span className="font-black text-sm text-primary-text">
                  Order #{activeOrder.order_code || activeOrder.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] font-black text-primary-green bg-white px-2.5 py-1 rounded-full border border-primary-green/20 uppercase tracking-wider">
                {activeStatus}
              </span>
            </div>

            <div className="p-4 space-y-6">
              {/* Order Info */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-very-light-green rounded-xl flex items-center justify-center text-2xl">🌾</div>
                <div className="flex-1">
                  <h4 className="font-black text-sm text-primary-text">
                    {activeOrder.order_items && activeOrder.order_items.length > 0
                      ? `${activeOrder.order_items[0].product_name || 'Farm Items'}${activeOrder.order_items.length > 1 ? ` + ${activeOrder.order_items.length - 1} more` : ''}`
                      : 'Farm Direct Order'}
                  </h4>
                  <p className="text-[10px] text-secondary-text font-medium">
                    {new Date(activeOrder.created_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {tracking?.payment_method || activeOrder.payment_method || "COD"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary-green">₹{Number(activeOrder.total_amount || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-secondary-text font-medium">{activeOrder.order_items?.length || 1} Items</p>
                </div>
              </div>

              {/* Delivery OTP Banner */}
              {tracking?.delivery_otp && (
                <div className="bg-gradient-to-r from-dark-green to-primary-green text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-accent-yellow" />
                      <span className="text-xs font-black uppercase tracking-wider text-accent-yellow">Delivery Handshake OTP</span>
                    </div>
                    <p className="text-[11px] text-white/90 font-medium">Share this code with your delivery partner at the doorstep</p>
                  </div>
                  <div className="bg-white text-primary-green font-black text-xl px-4 py-2 rounded-xl tracking-widest shadow-inner">
                    {tracking.delivery_otp}
                  </div>
                </div>
              )}

              {/* Verified Weight & Logistics Badge */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-very-light-green p-3 rounded-xl border border-primary-green/10">
                  <p className="text-[10px] font-bold text-secondary-text uppercase">Packed Weight</p>
                  <p className="font-black text-primary-text text-sm">
                    {tracking?.verified_weight_kg ? `${tracking.verified_weight_kg} kg` : "Weighing in progress"}
                  </p>
                  {tracking?.package_count && (
                    <p className="text-[10px] text-secondary-text">{tracking.package_count} package(s)</p>
                  )}
                </div>
                <div className="bg-very-light-green p-3 rounded-xl border border-primary-green/10">
                  <p className="text-[10px] font-bold text-secondary-text uppercase">Assignment SLA</p>
                  <p className="font-black text-primary-text text-sm truncate">
                    {tracking?.assignment_duration_seconds !== undefined && tracking?.assignment_duration_seconds !== null
                      ? `${tracking.assignment_duration_seconds}s (${tracking.assignment_sla_status || 'WITHIN_SLA'})`
                      : tracking?.delay_reason
                      ? `Delayed: ${tracking.delay_reason}`
                      : "Processing (Target: 120s)"}
                  </p>
                </div>
              </div>

              {/* Driver & Vehicle Details if assigned */}
              {tracking?.driver_name && (
                <div className="bg-light-green/40 p-4 rounded-2xl border border-primary-green/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-primary-green/10 pb-2">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-primary-green" />
                      <span className="text-xs font-black uppercase tracking-wider text-primary-text">Delivery Partner</span>
                    </div>
                    {tracking.driver_id_code && (
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-primary-green/20 text-primary-green">
                        ID: {tracking.driver_id_code}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-secondary-text font-bold uppercase">Driver Name</p>
                      <p className="font-black text-primary-text">{tracking.driver_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondary-text font-bold uppercase">Vehicle ID & Type</p>
                      <p className="font-black text-primary-text">
                        {tracking.vehicle_code || tracking.vehicle_number || "MK-VH"} • {tracking.vehicle_type || "Vehicle"}
                      </p>
                    </div>
                  </div>
                  {tracking.vehicle_capacity && (
                    <p className="text-[10px] text-secondary-text font-medium">
                      Vehicle Capacity: <span className="font-bold text-primary-text">{tracking.vehicle_capacity}</span> {tracking.eta ? `• ETA: ${tracking.eta}` : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Timeline Stepper */}
              <div className="space-y-0 pl-3">
                {displaySteps.map((step, i) => (
                  <div key={i} className="relative flex items-start pb-6 last:pb-0">
                    {i !== displaySteps.length - 1 && (
                      <div className={`absolute left-[9px] top-6 w-[2px] h-full ${step.status === 'completed' ? 'bg-primary-green' : 'bg-border-color'}`} />
                    )}
                    <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center mr-4 ${
                      step.status === 'completed' ? 'bg-primary-green text-white' :
                      step.status === 'current' ? 'bg-white border-2 border-primary-green text-primary-green' :
                      'bg-white border-2 border-border-color'
                    }`}>
                      {step.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <div className={`w-2 h-2 rounded-full ${step.status === 'current' ? 'bg-primary-green animate-ping' : ''}`} />}
                    </div>
                    <div className="flex-1 -mt-1">
                      <p className={`text-[11px] font-black ${step.status === 'pending' ? 'text-secondary-text/50' : 'text-primary-text'}`}>{step.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-secondary-text uppercase tracking-wider px-1">Order History</h3>
            {pastOrders.map((o) => (
              <div key={o.id} className="bg-white p-4 rounded-2xl border border-border-color flex items-center space-x-4">
                <div className="w-12 h-12 bg-very-light-green rounded-xl flex items-center justify-center text-2xl">📦</div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-primary-text">Order #{o.order_code || o.id.slice(0, 8).toUpperCase()}</h4>
                  <p className="text-[10px] text-secondary-text">
                    {new Date(o.created_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • ₹{Number(o.total_amount).toFixed(2)}
                  </p>
                </div>
                <span className="text-[10px] font-black text-primary-green bg-very-light-green px-2.5 py-1 rounded-md">
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
