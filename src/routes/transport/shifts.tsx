import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { Clock, User, Truck, CheckCircle2, Calendar } from "lucide-react";

export const Route = createFileRoute("/transport/shifts")({
  component: ShiftManagementPage,
});

function ShiftManagementPage() {
  const shifts = [
    { name: "Morning Shift", time: "06:00 AM - 02:00 PM", drivers: 18, vehicles: 15, active: 12 },
    { name: "Afternoon Shift", time: "02:00 PM - 10:00 PM", drivers: 14, vehicles: 12, active: 0 },
    { name: "Night Shift", time: "10:00 PM - 06:00 AM", drivers: 6, vehicles: 6, active: 0 },
  ];

  return (
    <TransportLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#17231A]">Shift Management</h1>
            <p className="text-slate-500 font-bold text-sm">Daily workforce and fleet scheduling</p>
          </div>
          <button className="px-6 py-3 bg-[#16803A] text-white rounded-xl font-black text-sm hover:bg-[#11662d]">Manage Roster</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shifts.map((shift, i) => (
            <div key={i} className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#EAF7EE] rounded-2xl text-[#16803A]">
                  <Clock className="w-5 h-5" />
                </div>
                {shift.active > 0 && (
                  <span className="text-[9px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-black uppercase">Active</span>
                )}
              </div>
              <h3 className="text-lg font-black text-[#17231A]">{shift.name}</h3>
              <p className="text-[11px] font-bold text-slate-400 mb-6">{shift.time}</p>
              
              <div className="space-y-4 flex-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 flex items-center">
                    <User className="w-3 h-3 mr-2" />
                    Drivers
                  </span>
                  <span className="text-[#17231A]">{shift.drivers}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 flex items-center">
                    <Truck className="w-3 h-3 mr-2" />
                    Vehicles
                  </span>
                  <span className="text-[#17231A]">{shift.vehicles}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2" />
                    Active Deliveries
                  </span>
                  <span className="text-[#16803A] font-black">{shift.active}</span>
                </div>
              </div>

              <button className="w-full mt-6 py-3 border border-[#DCE8DF] rounded-xl text-[10px] font-black uppercase text-[#16803A] hover:bg-[#EAF7EE] transition-all">
                View Roster
              </button>
            </div>
          ))}
        </div>
      </div>
    </TransportLayout>
  );
}
