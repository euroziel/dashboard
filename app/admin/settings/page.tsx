"use client";

import { useEffect, useState } from "react";
import AdminTopbar from "@/components/admin/Topbar";
import { MILESTONES, MilestoneConfig, DocumentRequirement } from "@/types";
import { getSystemSettings, updateSystemSettings } from "@/lib/collections";

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<MilestoneConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize configs
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSystemSettings();
        
        // If no settings exist yet, default everything to 'optional'
        if (!settings || !settings.milestoneConfigs || settings.milestoneConfigs.length === 0) {
          const defaultConfigs = MILESTONES.map((_, i) => ({
            milestoneIndex: i + 1,
            requirement: "optional" as DocumentRequirement,
          }));
          setConfigs(defaultConfigs);
        } else {
          // Merge existing settings with potentially new milestones
          const mergedConfigs = MILESTONES.map((_, i) => {
            const existing = settings.milestoneConfigs?.find(c => c.milestoneIndex === i + 1);
            return existing || { milestoneIndex: i + 1, requirement: "optional" };
          });
          setConfigs(mergedConfigs);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleRequirementChange = (index: number, newReq: DocumentRequirement) => {
    setConfigs((prev) =>
      prev.map((c) => (c.milestoneIndex === index ? { ...c, requirement: newReq } : c))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSystemSettings({ milestoneConfigs: configs });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminTopbar title="System Settings" subtitle="Configure platform rules" />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E5A800" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminTopbar title="System Settings" subtitle="Configure platform rules" />

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white">Document Requirements</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Configure whether students are required to upload documents for specific journey milestones.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
            style={{ background: "#1B73BA", color: "white" }}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="euro-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Step
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Milestone Name
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Document Requirement
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
                {configs.map((config) => {
                  const milestoneName = MILESTONES[config.milestoneIndex - 1];
                  
                  return (
                    <tr key={config.milestoneIndex} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: "#E5A800" }}>
                        {config.milestoneIndex}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {milestoneName}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={config.requirement}
                          onChange={(e) => handleRequirementChange(config.milestoneIndex, e.target.value as DocumentRequirement)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer"
                          style={{
                            background: config.requirement === "mandatory" 
                              ? "rgba(239,68,68,0.15)" 
                              : config.requirement === "optional" 
                                ? "rgba(255,255,255,0.1)" 
                                : "rgba(255,255,255,0.02)",
                            color: config.requirement === "mandatory" 
                              ? "#fca5a5" 
                              : config.requirement === "optional" 
                                ? "white" 
                                : "rgba(255,255,255,0.3)",
                            border: config.requirement === "mandatory"
                              ? "1px solid rgba(239,68,68,0.3)"
                              : "1px solid rgba(255,255,255,0.1)"
                          }}
                        >
                          <option value="optional" style={{ background: "#1A1F2E", color: "white" }}>Optional</option>
                          <option value="mandatory" style={{ background: "#1A1F2E", color: "white" }}>Mandatory</option>
                          <option value="not_required" style={{ background: "#1A1F2E", color: "white" }}>Not Required</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
