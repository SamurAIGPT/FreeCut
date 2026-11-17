import React from 'react';
import { Film, Music, Type, Sparkles, Wand2, Smile, Palette } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { SidebarTab } from '@/types/editor';

interface NavItem {
  id: SidebarTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'media', label: 'Media', icon: Film },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'stickers', label: 'Stickers', icon: Smile },
  { id: 'effects', label: 'Effects', icon: Sparkles },
  { id: 'transitions', label: 'Transition', icon: Wand2 },
  { id: 'filters', label: 'Filters', icon: Palette },
];

export const SidebarNav: React.FC = () => {
  const activeTab = useEditorStore((s) => s.activeSidebarTab);
  const setActiveTab = useEditorStore((s) => s.setActiveSidebarTab);

  return (
    <nav className="flex w-16 shrink-0 flex-col items-center border-r border-[#1f242e] bg-[#090b0e] py-3">
      <div className="flex flex-1 flex-col gap-1 w-full px-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 transition ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 font-semibold shadow-inner'
                  : 'text-slate-400 hover:bg-[#15181f] hover:text-slate-200'
              }`}
            >
              <div
                className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition ${
                  isActive ? 'text-blue-400 scale-110' : 'group-hover:scale-105'
                }`}
              >
                <Icon className="h-5 w-5 stroke-[1.8]" />
                {isActive && (
                  <span className="absolute -left-1.5 h-4 w-1 rounded-r-full bg-blue-500 shadow-sm shadow-blue-500" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
