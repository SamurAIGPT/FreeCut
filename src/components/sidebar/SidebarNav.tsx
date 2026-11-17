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
    <nav className="flex h-full w-12 shrink-0 flex-col items-center border-r border-app-border bg-app-surface py-2 select-none overflow-y-auto overflow-x-hidden transition-colors duration-200">
      <div className="flex flex-col items-center gap-1.5 w-full px-1.5 pb-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Tooltip
              key={item.id}
              content={item.label}
              side="right"
              delay={40}
              className="w-full flex justify-center"
            >
              <button
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isActive
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-app-text font-bold shadow-xs'
                    : 'text-app-text-muted hover:bg-app-elevated hover:text-app-text'
                }`}
              >
                {/* Active Indicator Bar on the left */}
                {isActive && (
                  <span className="absolute -left-1.5 h-4 w-1 rounded-r-full bg-neutral-900 dark:bg-neutral-100" />
                )}
                <Icon className="h-4 w-4 stroke-[1.9]" />
              </button>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
};

export default SidebarNav;
