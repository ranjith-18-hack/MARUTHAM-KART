import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { warehouseEmployees } from "@/data/mockData";
import { Users, Search, Filter, Mail, Phone, MoreVertical, Circle } from "lucide-react";

export const Route = createFileRoute("/godown/employees")({
  head: () => ({
    meta: [
      { title: "Employee Management | MARUTHAM KART" },
      { name: "description", content: "Manage warehouse staff, roles, shifts, and performance." },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Warehouse Personnel</h1>
            <p className="text-sm text-secondary-text font-bold">Manage and monitor warehouse staff and assignments</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
              <input 
                type="text" 
                placeholder="Search by ID or Name..." 
                className="pl-10 pr-4 py-2 bg-white border border-[#DCE8DF] rounded-xl text-xs w-64 focus:ring-1 focus:ring-[#16803A] outline-none"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-[#16803A] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428]">
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#DCE8DF] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5FBF7] border-b border-[#DCE8DF]">
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Shift</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Current Task</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {warehouseEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#F5FBF7] rounded-xl flex items-center justify-center text-[#16803A] border border-[#DCE8DF] font-black text-[10px]">
                          {emp.id.slice(-2)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-primary-text">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-primary-text">{emp.role}</td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary-text">{emp.shift}</td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-primary-text truncate max-w-[150px]">{emp.currentTask || 'Idle'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <Circle className={`w-2 h-2 fill-current ${
                          emp.status === 'Active' ? 'text-green-500' : 
                          emp.status === 'On Leave' ? 'text-amber-500' : 'text-slate-300'
                        }`} />
                        <span className="text-[10px] font-black uppercase tracking-tight">{emp.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button className="p-2 text-slate-400 hover:text-[#16803A] rounded-lg transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </GodownLayout>
  );
}
