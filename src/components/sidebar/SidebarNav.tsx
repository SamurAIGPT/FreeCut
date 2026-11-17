import React from 'react';
import { Film, Music, Type, Sparkles, Wand2, Smile, Palette } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { SidebarTab } from '@/types/editor';
import { Tooltip } from '@/components/ui/Tooltip';

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
  { id: 'transitions', label: 'Transitions', icon: Wand2 },
  { id: 'filters', label: 'Filters', icon: Palette },
];

export const SidebarNav: React.FC = () => {
  const activeTab = useEditorStore((s) => s.activeSidebarTab);
  const setActiveTab = useEditorStore((s) => s.setActiveSidebarTab);

  return (
    <nav className="flex h-full w-16 shrink-0 flex-col items-center border-r border-app-border bg-app-surface py-2 select-none overflow-y-auto overflow-x-hidden transition-colors duration-200">
      <div className="flex flex-col items-center gap-1.5 w-full px-1.5 pb-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Tooltip
              key={item.id}
              content={item.label}
              side="right"
              delay={60}
              className="w-full flex justify-center"
            >
              <button
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                className={`relative flex w-full flex-col items-center justify-center rounded-xl py-2 px-1 transition duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-200 text-neutral-900 font-semibold shadow-xs dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-white'
                }`}
              >
                {/* Active Indicator Bar on the left */}
                {isActive && (
                  <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-neutral-900 dark:bg-white" />
                )}
                <Icon className="h-5 w-5 stroke-[1.8]" />
                <span className="mt-1 text-[10px] font-medium leading-none tracking-tight">
                  {item.label}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
};

export default SidebarNav;
