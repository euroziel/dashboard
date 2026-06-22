"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentTopbar from "@/components/student/Topbar";
import { subscribeToFinances, recordPayment } from "@/lib/collections";
import type { Finances, PaymentRecord } from "@/types";
import Script from "next/script";

export default function StudentFeesPage() {
  const { user } = useAuth();
  const [finances, setFinances] = useState<Finances | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToFinances(user.uid, (data) => {
      setFinances(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const totalFees = finances?.totalFees ?? 0;
  const paidAmount = finances?.paidAmount ?? 0;
  const remainingAmount = totalFees - paidAmount;
  const history = finances?.history ?? [];

  // Default the input to remaining balance if they click the input
  useEffect(() => {
    if (remainingAmount > 0 && paymentAmount === "") {
      setPaymentAmount(remainingAmount);
    }
  }, [remainingAmount, paymentAmount]);

  const handlePayment = async () => {
    if (!user?.uid || !paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (Number(paymentAmount) > remainingAmount) {
      alert(`You cannot pay more than the remaining balance (₹${remainingAmount}).`);
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order on server
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.uid,
          requestedAmount: Number(paymentAmount)
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      let paymentHandled = false;
      let lastProcessedPaymentId: string | null = null;

      // 2. Open Razorpay Checkout
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "EuroZiel Consultancy",
        description: "Student Fee Payment",
        image: "https://euroziel.com/wp-content/uploads/2023/10/euroziel-logo.png", // replace with actual logo url later
        order_id: data.orderId,
        handler: async function (response: any) {
          paymentHandled = true;
          // 3. Verify Payment Signature on server
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                studentId: user.uid,
                amountPaid: Number(paymentAmount)
              }),
            });
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok) {
              alert("Payment successful!");
              setPaymentAmount("");
            } else {
              alert("Payment verification failed: " + verifyData.error);
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: async function () {
            if (!paymentHandled) {
              await recordPayment(user.uid, {
                amount: Number(paymentAmount),
                method: "Razorpay",
                note: "User closed the payment window",
                status: "Abandoned"
              });
              setIsProcessing(false);
            }
          }
        },
        prefill: {
          name: user.name || user.username,
          email: user.email,
        },
        theme: {
          color: "#0A0E1A"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", async function (response: any) {
        const paymentId = response.error.metadata?.payment_id;
        
        // Prevent duplicate firing for the exact same payment_id
        if (paymentId && lastProcessedPaymentId === paymentId) return;
        lastProcessedPaymentId = paymentId || "unknown";
        
        paymentHandled = true;
        console.error(response.error);
        alert(response.error.description);
        
        await recordPayment(user.uid, {
          amount: Number(paymentAmount),
          method: "Razorpay",
          razorpayPaymentId: paymentId || `failed-${Date.now()}`,
          note: response.error.description,
          status: "Failed"
        });
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error: any) {
      console.error(error);
      alert(error.message || "An error occurred during checkout.");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#0A0E1A" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FFD700" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <StudentTopbar title="Fees & Payments" subtitle="Manage your journey installments" />

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
        
        {/* Left: Fee Status & Payment Form */}
        <div className="space-y-8">
          
          {/* Summary Card */}
          <div className="rounded-xl p-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
             <h2 className="text-xl font-bold text-white mb-6">Fee Summary</h2>
             
             {totalFees === 0 ? (
               <div className="py-6 text-center rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Your fee structure has not been finalized yet.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 <div className="flex justify-between items-center">
                   <span className="text-sm uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Total Fees</span>
                   <span className="text-lg font-bold text-white">₹{totalFees.toLocaleString('en-IN')}</span>
                 </div>
                 
                 <div className="flex justify-between items-center">
                   <span className="text-sm uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Amount Paid</span>
                   <span className="text-lg font-bold text-white">₹{paidAmount.toLocaleString('en-IN')}</span>
                 </div>
                 
                 <div className="pt-6 flex justify-between items-center border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                   <span className="text-sm uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Remaining Balance</span>
                   <span className="text-2xl font-bold" style={{ color: remainingAmount > 0 ? "#FFD700" : "#86efac" }}>
                     ₹{remainingAmount.toLocaleString('en-IN')}
                   </span>
                 </div>
               </div>
             )}
          </div>

          {/* Payment Form */}
          {remainingAmount > 0 && (
            <div className="rounded-xl p-8" style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-bold text-white mb-6" style={{ borderLeft: "3px solid #FFD700", paddingLeft: "10px" }}>Make a Payment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Enter Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={remainingAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg text-lg text-white font-bold outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    You can pay a custom amount. Maximum is ₹{remainingAmount.toLocaleString('en-IN')}.
                  </p>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing || !paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > remainingAmount}
                  className="w-full py-4 rounded-lg text-sm font-bold transition-all disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
                  style={{ background: "#FFD700", color: "#0A0E1A", boxShadow: "0 4px 14px rgba(255,215,0,0.2)" }}
                >
                  {isProcessing ? "Processing..." : `Pay ₹${Number(paymentAmount || 0).toLocaleString('en-IN')} Now`}
                  {!isProcessing && (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Transaction History */}
        <div className="lg:col-span-1">
          <div className="rounded-xl flex flex-col h-full max-h-[600px]" style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold text-sm uppercase tracking-widest" style={{ color: "#FFD700" }}>Transaction History</h3>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">💳</div>
                  <p className="text-white font-medium">No transactions yet</p>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Your payment history will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((record, idx) => (
                    <div 
                      key={record.razorpayPaymentId || idx} 
                      onClick={() => setSelectedPayment(record)}
                      className="p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" 
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div>
                        <p className="text-white font-bold text-lg mb-1">₹{record.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {new Date(record.paidAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold" style={{ 
                          background: record.status === "Failed" ? "rgba(239,68,68,0.15)" : record.status === "Abandoned" ? "rgba(255,255,255,0.1)" : "rgba(34,197,94,0.15)", 
                          color: record.status === "Failed" ? "#fca5a5" : record.status === "Abandoned" ? "rgba(255,255,255,0.5)" : "#86efac" 
                        }}>
                          {record.status || "Successful"}
                        </span>
                        <p className="text-[10px] mt-2 font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                          ID: {record.razorpayPaymentId?.slice(-6) || "Manual"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: "rgba(10,14,26,0.8)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-xl p-8 shadow-2xl relative" style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button 
              onClick={() => setSelectedPayment(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Payment Receipt</h2>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                {new Date(selectedPayment.paidAt).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg flex justify-between items-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Amount Paid</span>
                <span className="text-xl font-bold text-white">₹{selectedPayment.amount.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="p-4 rounded-lg flex flex-col gap-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Transaction ID</span>
                <span className="text-sm font-mono text-white">{selectedPayment.razorpayPaymentId || "N/A (Manual)"}</span>
              </div>
              
              <div className="p-4 rounded-lg flex justify-between items-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Status</span>
                <span className="text-[11px] px-3 py-1 rounded-full uppercase tracking-wider font-bold" style={{ 
                  background: selectedPayment.status === "Failed" ? "rgba(239,68,68,0.15)" : selectedPayment.status === "Abandoned" ? "rgba(255,255,255,0.1)" : "rgba(34,197,94,0.15)", 
                  color: selectedPayment.status === "Failed" ? "#fca5a5" : selectedPayment.status === "Abandoned" ? "rgba(255,255,255,0.5)" : "#86efac" 
                }}>
                  {selectedPayment.status || "Successful"}
                </span>
              </div>
            </div>
            
            <div className="mt-8">
              <button 
                onClick={() => setSelectedPayment(null)}
                className="w-full py-3 rounded-lg text-sm font-bold transition-colors"
                style={{ background: "#FFD700", color: "#0A0E1A" }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
