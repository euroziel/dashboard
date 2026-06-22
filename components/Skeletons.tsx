"use client";

import React from "react";

export function SkeletonRow() {
  return (
    <tr className="border-b animate-pulse" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <td className="px-6 py-4">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-white/5 rounded w-1/2"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-2 bg-white/10 rounded-full w-full"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-white/10 rounded-full w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-white/10 rounded w-16"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-white/10 rounded w-20"></div>
      </td>
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="euro-card rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-white/20 rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="euro-card rounded-xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="h-6 bg-white/10 rounded w-1/4"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonStudentDashboard() {
  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full animate-pulse">
      <div>
        <div className="h-8 bg-white/20 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-1/4"></div>
      </div>
      
      <div className="euro-card rounded-xl p-6 h-48"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="euro-card rounded-xl p-6 h-48"></div>
            <div className="euro-card rounded-xl p-6 h-48"></div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="euro-card rounded-xl p-6 h-96"></div>
        </div>
      </div>
    </div>
  );
}
