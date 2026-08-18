import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { transportQueue } from "@/data/mockData";
import { 
  Search, 
  Filter, 
  MapPin, 
  Truck, 
  Package, 
  ChevronRight, 
  AlertCircle,
  MoreVertical,
  Calendar,
  Weight,
  Info
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/transport/queue")({
  component: DeliveryQueuePage,
});

function DeliveryQueuePage() {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = ['All', 'Awaiting Assignment', 'Vehicle Assigned', 'Driver Assigned', 'Picked Up', 'On Route', 'Delivered'];

  const filteredOrders = transportQueue.filter(order => {
    const matchesFilter = filter === 'All' || order.status === filter;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Delivery Orders</h1>
            <p className="text-slate-500 font-bold text-sm">Managing the active logistics queue for all sectors</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ID or Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white border border-[#DCE8DF] rounded-2xl text-xs font-bold text-[#17231A] w-64 outline-none focus:ring-2 focus:ring-[#16803A] focus:border-transparent transition-all"
              />
            </div>
            <button className="flex items-center space-x-2 px-5 py-3 bg-white border border-[#DCE8DF] rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-[#16803A] transition-all">
              <Filter className="w-4 h-4" />
              <span>Advanced Filters</span>
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex space-x-2 overflow-x-auto custom-scrollbar pb-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === t ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'bg-white border border-[#DCE8DF] text-slate-400 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-[#DCE8DF] rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFB] border-b border-[#DCE8DF]">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-[#F8FAFB] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          order.type === 'Bulk Delivery' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {order.type === 'Bulk Delivery' ? <Truck className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#17231A]">{order.id}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{order.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-[180px]">
                        <p className="text-xs font-black text-[#17231A] truncate">{order.customerName || 'Business Partner'}</p>
                        <div className="flex items-center text-[10px] font-bold text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1 text-[#16803A]" />
                          {order.destination}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3 text-xs font-bold text-[#17231A]">
                        <Weight className="w-4 h-4 text-slate-400" />
                        <span>{order.quantity}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-[10px] font-bold text-slate-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {order.requiredDate}
                        </div>
                        {order.eta && (
                          <div className="text-[10px] font-black text-blue-600 uppercase">
                            ETA: {order.eta}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {order.driverId ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-[#DCE8DF] flex items-center justify-center text-[10px] font-black text-slate-600">
                            {order.driverId.split('-').pop()}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[#17231A]">{order.driverId}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{order.vehicleId}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-orange-500 space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase italic tracking-tighter">Needs Assignment</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        order.status === 'On Route' ? 'bg-blue-50 text-blue-600' :
                        order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                        order.status === 'Delayed' ? 'bg-red-50 text-red-600' :
                        'bg-slate-100 text-slate-500 border border-[#DCE8DF]'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="px-4 py-2 bg-[#EAF7EE] text-[#16803A] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#16803A] hover:text-white transition-all">
                          Manage
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-lg font-black text-[#17231A]">No orders found</h4>
              <p className="text-slate-400 font-bold text-sm">Try adjusting your filters or search term</p>
            </div>
          )}
          
          {/* Pagination */}
          <div className="px-8 py-6 border-t border-[#DCE8DF] flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {filteredOrders.length} of {transportQueue.length} Active Orders
            </p>
            <div className="flex space-x-2">
              <button disabled className="px-4 py-2 border border-[#DCE8DF] rounded-xl text-[10px] font-black uppercase text-slate-300">Previous</button>
              <button className="px-4 py-2 border border-[#16803A] text-[#16803A] rounded-xl text-[10px] font-black uppercase">1</button>
              <button className="px-4 py-2 border border-[#DCE8DF] rounded-xl text-[10px] font-black uppercase text-slate-600">Next</button>
            </div>
          </div>
        </div>
      </div>
    </TransportLayout>
  );
}
