import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { transportEmployees } from "@/data/mockData";
import { User, Shield, Clock, Search, MapPin } from "lucide-react";

export const Route = createFileRoute("/transport/employees/")({
  component: EmployeesPage,
});

function EmployeesPage() {
  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Transport Personnel</h1>
            <p className="text-slate-500 font-bold text-sm">Managing assigned transport division staff</p>
          </div>
        </div>

        <div className="bg-white border border-[#DCE8DF] rounded-[2.5rem] p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transportEmployees.map((emp) => (
              <div key={emp.id} className="p-6 bg-[#F8FAFB] border border-[#DCE8DF] rounded-[2rem] hover:border-[#16803A]/30 transition-all">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 bg-white border border-[#DCE8DF] rounded-2xl flex items-center justify-center text-[#16803A]">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[#17231A]">{emp.name}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{emp.id} • {emp.role}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-[#17231A] uppercase">
                    <span className="text-slate-400">Shift</span>
                    <span>{emp.shift}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-[#17231A] uppercase">
                    <span className="text-slate-400">Current Task</span>
                    <span className="text-[#16803A]">{emp.currentTask}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${
                    emp.status === 'On Duty' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {emp.status}
                  </span>
                  <button className="text-[10px] font-black text-[#16803A] uppercase hover:underline">Full Profile</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TransportLayout>
  );
}