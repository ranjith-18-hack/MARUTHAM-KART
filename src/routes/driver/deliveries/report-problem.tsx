import { createFileRoute } from "@tanstack/react-router";
import { 
    AlertCircle, 
    ArrowLeft, 
    CheckCircle, 
    Clock, 
    Navigation, 
    MessageSquare,
    Phone
} from "lucide-react";

export const Route = createFileRoute("/driver/deliveries/report-problem")({
  component: ReportProblem,
});

function ReportProblem() {
  const issues = [
    "Customer not available",
    "Incorrect address",
    "Cannot contact customer",
    "Location inaccessible",
    "Traffic Delay",
    "Vehicle Breakdown",
    "Other"
  ];

  return (
    <div className="min-h-screen bg-[#F5FBF7] p-6 flex flex-col">
      <header className="flex items-center mb-8">
        <button className="mr-4 p-2 bg-white rounded-full border border-[#DCE8DF]"><ArrowLeft className="w-5 h-5 text-[#16803A]" /></button>
        <h2 className="font-black text-xl text-primary-text">Report a Problem</h2>
      </header>

      <div className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm flex-1 flex flex-col">
        <h3 className="font-black text-primary-text mb-4 text-sm uppercase text-secondary-text">Select Issue Type</h3>
        
        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {issues.map((issue, i) => (
                <label key={i} className="flex items-center p-4 bg-[#F5FBF7] rounded-xl border border-[#DCE8DF] cursor-pointer hover:border-[#16803A] transition-all">
                    <input type="radio" name="issue" className="w-5 h-5 accent-[#16803A]" />
                    <span className="ml-3 font-bold text-sm text-primary-text">{issue}</span>
                </label>
            ))}
        </div>

        <div className="mt-6">
            <label className="block text-[10px] font-black uppercase text-secondary-text mb-2">Additional Notes</label>
            <textarea 
                className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#16803A] resize-none" 
                rows={3}
                placeholder="Describe the problem..."
            ></textarea>
        </div>

        <button className="w-full mt-6 py-5 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200">
            Submit Problem
        </button>
      </div>
    </div>
  );
}
