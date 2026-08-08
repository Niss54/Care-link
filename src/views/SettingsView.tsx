import React, { useEffect, useState } from 'react';
import { Palette, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem('carelink-theme') || 'theme-blue'
  );

  const themes = [
    { id: 'theme-blue', name: 'Clinical Blue', desc: 'Standard default high-contrast theme.', color: '#316bf3' },
    { id: 'theme-slate', name: 'Neutral Slate', desc: 'Calming monochromatic palette.', color: '#475569' },
    { id: 'theme-contrast', name: 'High Contrast', desc: 'Enhanced visibility for low-vision environments.', color: '#000000' },
  ];

  useEffect(() => {
    // Remove old themes
    document.documentElement.classList.remove('theme-blue', 'theme-slate', 'theme-contrast');
    // Add new
    document.documentElement.classList.add(currentTheme);
    localStorage.setItem('carelink-theme', currentTheme);
  }, [currentTheme]);

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-[#022448] text-white p-8 rounded-2xl shadow-xl space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Portal Settings & Themes</h1>
        <p className="text-xs text-[#adc8f5] max-w-2xl leading-relaxed">
          Customize your clinical workspace experience.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2 border-b border-[#e0e3e5] pb-3">
          <Palette className="w-5 h-5 text-[#316bf3] theme-override-icon" />
          <h2 className="text-lg font-bold text-[#191c1e]">Color Theme Preferences</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => setCurrentTheme(theme.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                currentTheme === theme.id ? 'border-[#316bf3] bg-[#f7f9fb]' : 'border-[#e0e3e5] hover:border-[#c4c6cf]'
              } theme-override-border`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: theme.color }} />
                {currentTheme === theme.id && <CheckCircle2 className="w-5 h-5 text-[#316bf3] theme-override-text" />}
              </div>
              <h3 className="font-bold text-[#191c1e] text-sm">{theme.name}</h3>
              <p className="text-xs text-[#74777f] mt-1">{theme.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
