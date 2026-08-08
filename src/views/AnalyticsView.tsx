import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { ChevronDown, FileText, Image as ImageIcon } from 'lucide-react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Clock,
  CheckCircle2,
  PieChart,
  Calendar,
  Download
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = async () => {
    setShowExportMenu(false);
    if (!analyticsRef.current) return;
    const canvas = await html2canvas(analyticsRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = 'CareLink_Analytics.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportCSV = () => {
    setShowExportMenu(false);
    const csvContent = [
      ['Metric', 'Value', 'Change'],
      ['Monthly Admissions', '1428', '+18%'],
      ['Avg Consultation Time', '22 mins', '-3 mins'],
      ['Bed Occupancy Rate', '84%', 'Stable'],
      ['Patient Satisfaction', '4.8/5.0', '+0.2']
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CareLink_Analytics.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12" ref={analyticsRef}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e0e3e5] card-shadow">
        <div>
          <h2 className="text-xl font-bold text-[#191c1e]">Clinical Analytics & Performance</h2>
          <p className="text-xs text-[#74777f]">Departmental KPIs, patient demographics, and lab turnaround metrics</p>
        </div>

        
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-2.5 bg-[#022448] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-[#1e3a5f] transition-colors"
          >
            <Download className="w-4 h-4 text-[#adc8f5]" />
            <span>Export Data</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e0e3e5] rounded-xl shadow-xl py-2 z-50">
              <button
                onClick={handleExportPNG}
                className="w-full text-left px-4 py-2.5 text-sm text-[#191c1e] hover:bg-[#f2f4f6] flex items-center gap-2.5 font-medium"
              >
                <ImageIcon className="w-4 h-4 text-[#316bf3]" />
                <span>Export as PNG</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-4 py-2.5 text-sm text-[#191c1e] hover:bg-[#f2f4f6] flex items-center gap-2.5 font-medium"
              >
                <FileText className="w-4 h-4 text-[#10b981]" />
                <span>Export as CSV</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#74777f] uppercase">Monthly Admissions</span>
            <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">+18%</span>
          </div>
          <p className="text-2xl font-extrabold text-[#191c1e] mt-2">1,428</p>
          <p className="text-xs text-[#74777f] mt-1">Average 46 admissions / day</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#74777f] uppercase">Avg Consultation Time</span>
            <span className="text-xs font-bold text-[#316bf3] bg-[#316bf3]/10 px-2 py-0.5 rounded-full">-3 mins</span>
          </div>
          <p className="text-2xl font-extrabold text-[#191c1e] mt-2">22 mins</p>
          <p className="text-xs text-[#74777f] mt-1">Target range: 20-25 mins</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#74777f] uppercase">Lab Report Turnaround</span>
            <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">Optimal</span>
          </div>
          <p className="text-2xl font-extrabold text-[#191c1e] mt-2">2.4 hrs</p>
          <p className="text-xs text-[#74777f] mt-1">Down from 4.1 hrs last quarter</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#74777f] uppercase">Patient Satisfaction</span>
            <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">4.9 / 5</span>
          </div>
          <p className="text-2xl font-extrabold text-[#191c1e] mt-2">96.8%</p>
          <p className="text-xs text-[#74777f] mt-1">Based on 842 patient reviews</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume Chart Bar Representation */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#191c1e]">Department Patient Volume</h3>
            <span className="text-xs text-[#74777f] font-medium">October 2023</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#191c1e]">Cardiology</span>
                <span className="text-[#316bf3]">42% (842 patients)</span>
              </div>
              <div className="w-full bg-[#f2f4f6] h-3 rounded-full overflow-hidden">
                <div className="bg-[#316bf3] h-full rounded-full w-[42%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#191c1e]">General Practice</span>
                <span className="text-[#10b981]">28% (560 patients)</span>
              </div>
              <div className="w-full bg-[#f2f4f6] h-3 rounded-full overflow-hidden">
                <div className="bg-[#10b981] h-full rounded-full w-[28%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#191c1e]">Neurology</span>
                <span className="text-[#ff9800]">18% (360 patients)</span>
              </div>
              <div className="w-full bg-[#f2f4f6] h-3 rounded-full overflow-hidden">
                <div className="bg-[#ff9800] h-full rounded-full w-[18%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#191c1e]">Pediatrics & Others</span>
                <span className="text-[#74777f]">12% (240 patients)</span>
              </div>
              <div className="w-full bg-[#f2f4f6] h-3 rounded-full overflow-hidden">
                <div className="bg-[#74777f] h-full rounded-full w-[12%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Efficiency Metrics */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 card-shadow space-y-4">
          <h3 className="text-base font-bold text-[#191c1e]">Key Operational Highlights</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#316bf3]/10 text-[#316bf3] flex items-center justify-center font-bold">
                  ECG
                </div>
                <div>
                  <p className="font-bold text-[#191c1e]">Telemetry Monitoring Accuracy</p>
                  <p className="text-[#74777f]">99.94% continuous uptime across Ward 4</p>
                </div>
              </div>
              <span className="font-bold text-[#10b981]">Pass</span>
            </div>

            <div className="p-3 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 text-[#10b981] flex items-center justify-center font-bold">
                  EHR
                </div>
                <div>
                  <p className="font-bold text-[#191c1e]">Record Compliance</p>
                  <p className="text-[#74777f]">HIPAA & ISO 27001 audit score</p>
                </div>
              </div>
              <span className="font-bold text-[#10b981]">100%</span>
            </div>

            <div className="p-3 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ff9800]/10 text-[#ff9800] flex items-center justify-center font-bold">
                  WAIT
                </div>
                <div>
                  <p className="font-bold text-[#191c1e]">Waiting Room Threshold</p>
                  <p className="text-[#74777f]">Max wait time peaked at 14 minutes</p>
                </div>
              </div>
              <span className="font-bold text-[#316bf3]">Good</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
