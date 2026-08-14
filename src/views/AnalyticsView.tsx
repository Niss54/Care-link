import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { ChevronDown, FileText, Image as ImageIcon, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const admissionsData = [
  { month: 'May', Cardiology: 120, Neurology: 80, 'General Practice': 95 },
  { month: 'Jun', Cardiology: 135, Neurology: 75, 'General Practice': 110 },
  { month: 'Jul', Cardiology: 148, Neurology: 92, 'General Practice': 105 },
  { month: 'Aug', Cardiology: 142, Neurology: 88, 'General Practice': 118 },
  { month: 'Sep', Cardiology: 158, Neurology: 95, 'General Practice': 125 },
  { month: 'Oct', Cardiology: 165, Neurology: 102, 'General Practice': 130 },
];

const patientFlowData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  patients: Math.floor(Math.random() * (70 - 30 + 1) + 30)
}));

const demographicsData = [
  { name: 'Male 18-45', value: 28, color: '#316bf3' },
  { name: 'Male 45+', value: 22, color: '#0051d5' },
  { name: 'Female 18-45', value: 30, color: '#10b981' },
  { name: 'Female 45+', value: 15, color: '#ff9800' },
  { name: 'Pediatric', value: 5, color: '#74777f' },
];

const labData = [
  { test: 'CBC', hours: 1.2 },
  { test: 'BMP', hours: 2.1 },
  { test: 'Lipid Panel', hours: 3.4 },
  { test: 'TSH', hours: 4.8 },
  { test: 'Urinalysis', hours: 0.8 },
  { test: 'HbA1c', hours: 2.6 },
];

export const AnalyticsView: React.FC = () => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const exportAsPNG = async () => {
    setShowExportMenu(false);
    if (!analyticsRef.current) return;
    try {
      const canvas = await html2canvas(analyticsRef.current, { scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'CareLink_Analytics.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating PNG', err);
    }
  };

  const exportAsCSV = () => {
    setShowExportMenu(false);
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value,Badge,Subtitle\n"
      + "Monthly Admissions,1428,+18%,Average 46 admissions/day\n"
      + "Avg Consultation Time,22 mins,-3 mins,Target: 20-25 mins\n"
      + "Bed Occupancy Rate,84%,Stable,Within optimal range\n"
      + "Patient Satisfaction,4.8/5.0,+0.2,Based on 842 reviews\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'CareLink_KPI_Data.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of hospital performance metrics</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-colors"
          >
            <Download size={18} />
            Export Data
            <ChevronDown size={18} />
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
              <button 
                onClick={exportAsPNG}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <ImageIcon size={16} /> Export as PNG
              </button>
              <button 
                onClick={exportAsCSV}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText size={16} /> Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={analyticsRef} className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-gray-500">Monthly Admissions</p>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp size={14} /> +18%
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-gray-900">1,428</h3>
              <p className="text-sm text-gray-500 mt-1">Average 46 admissions/day</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-gray-500">Avg Consultation Time</p>
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <TrendingDown size={14} /> -3 mins
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-gray-900">22 mins</h3>
              <p className="text-sm text-gray-500 mt-1">Target: 20-25 mins</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-gray-500">Bed Occupancy Rate</p>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <Minus size={14} /> Stable
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-gray-900">84%</h3>
              <p className="text-sm text-gray-500 mt-1">Within optimal range</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-gray-500">Patient Satisfaction</p>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp size={14} /> +0.2
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-gray-900">4.8<span className="text-lg text-gray-500 font-medium">/5.0</span></h3>
              <p className="text-sm text-gray-500 mt-1">Based on 842 reviews</p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Admissions */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Admissions by Department</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={admissionsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Cardiology" fill="#316bf3" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Neurology" fill="#ff9800" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="General Practice" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Daily Flow */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Patient Flow</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patientFlowData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="patients" stroke="#316bf3" strokeWidth={3} dot={{ r: 4, fill: '#316bf3', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Demographics */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Patient Demographics</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographicsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {demographicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Lab Turnaround */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Lab Turnaround Times (Hours)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={labData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="test" type="category" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="hours" fill="#316bf3" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
