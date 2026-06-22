"use client";

import { useEffect, useState } from "react";
import AdminTopbar from "@/components/admin/Topbar";
import { getAllStudents, getFinances } from "@/lib/collections";
import type { Student, Finances } from "@/types";
import Link from "next/link";

interface StudentFinanceData {
  student: Student;
  finance: Finances | null;
}

export default function AdminFeesPage() {
  const [data, setData] = useState<StudentFinanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const students = await getAllStudents();
        // Fetch finances for all students
        const financePromises = students.map(s => getFinances(s.uid).catch(() => null));
        const finances = await Promise.all(financePromises);
        
        const merged = students.map((s, idx) => ({
          student: s,
          finance: finances[idx]
        }));

        setData(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminTopbar title="Global Finances" subtitle="View all student payments" />
        <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#0A0E1A" }}>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FFD700" }} />
        </div>
      </div>
    );
  }

  // Calculate global stats
  const totalExpected = data.reduce((sum, item) => sum + (item.finance?.totalFees ?? item.student.totalFees ?? 0), 0);
  const totalCollected = data.reduce((sum, item) => sum + (item.finance?.paidAmount ?? item.student.feesPaid ?? 0), 0);
  const totalOutstanding = totalExpected - totalCollected;

  return (
    <div className="flex flex-col min-h-screen relative">
      <AdminTopbar title="Global Finances" subtitle="View all student payments and dues" />

      <main className="flex-1 p-8">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl p-6" style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Total Expected Fees</p>
            <h3 className="text-2xl font-bold text-white">₹{totalExpected.toLocaleString('en-IN')}</h3>
          </div>
          <div className="rounded-xl p-6" style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(34,197,94,0.7)" }}>Total Collected</p>
            <h3 className="text-2xl font-bold" style={{ color: "#86efac" }}>₹{totalCollected.toLocaleString('en-IN')}</h3>
          </div>
          <div className="rounded-xl p-6" style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,215,0,0.7)" }}>Total Outstanding</p>
            <h3 className="text-2xl font-bold" style={{ color: "#FFD700" }}>₹{totalOutstanding.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Master Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)" }}>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                   <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]" style={{ color: "#FFD700" }}>Student</th>
                   <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]" style={{ color: "#FFD700" }}>Total Fees</th>
                   <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]" style={{ color: "#FFD700" }}>Paid Amount</th>
                   <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]" style={{ color: "#FFD700" }}>Remaining</th>
                   <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]" style={{ color: "#FFD700" }}>Status</th>
                   <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]" style={{ color: "#FFD700" }}>Action</th>
                 </tr>
               </thead>
               <tbody>
                 {data.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>No student data available.</td>
                   </tr>
                 ) : (
                   data.map(({ student, finance }) => {
                     const total = finance?.totalFees ?? student.totalFees ?? 0;
                     const paid = finance?.paidAmount ?? student.feesPaid ?? 0;
                     const remaining = total - paid;
                     
                     let statusText = "No Fees Set";
                     let statusColor = "rgba(255,255,255,0.3)";
                     let statusBg = "rgba(255,255,255,0.05)";

                     if (total > 0) {
                       if (remaining <= 0) {
                         statusText = "Fully Paid";
                         statusColor = "#86efac";
                         statusBg = "rgba(34,197,94,0.15)";
                       } else if (paid > 0) {
                         statusText = "Partial Payment";
                         statusColor = "#FFD700";
                         statusBg = "rgba(255,215,0,0.15)";
                       } else {
                         statusText = "Unpaid";
                         statusColor = "#fca5a5";
                         statusBg = "rgba(239,68,68,0.15)";
                       }
                     }

                     return (
                       <tr 
                         key={student.uid} 
                         className="border-b last:border-0 transition-colors hover:bg-white/5" 
                         style={{ borderColor: "rgba(255,255,255,0.04)" }}
                       >
                         <td className="px-6 py-4">
                           <p className="font-bold text-white">{student.name ?? student.username}</p>
                           <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{student.email}</p>
                         </td>
                         <td className="px-6 py-4 font-medium text-white">₹{total.toLocaleString('en-IN')}</td>
                         <td className="px-6 py-4 font-medium" style={{ color: "#86efac" }}>₹{paid.toLocaleString('en-IN')}</td>
                         <td className="px-6 py-4 font-bold" style={{ color: remaining > 0 ? "#FFD700" : "white" }}>
                           ₹{remaining > 0 ? remaining.toLocaleString('en-IN') : 0}
                         </td>
                         <td className="px-6 py-4">
                           <span className="text-[10px] px-2 py-1 rounded uppercase tracking-wider font-bold" style={{ background: statusBg, color: statusColor }}>
                             {statusText}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <Link 
                             href={`/admin/students/${student.uid}`}
                             className="text-xs font-semibold hover:underline"
                             style={{ color: "#FFD700" }}
                           >
                             Manage Fees →
                           </Link>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </main>
    </div>
  );
}
