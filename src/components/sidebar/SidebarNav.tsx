import React from 'react';
import { 
  Film, Music, Type, Smile, Sparkles, Wand2, 
  Subtitles, SlidersHorizontal, Settings 
} from 'lucide-react';
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
  { id: 'audio', label: 'Sounds', icon: Music },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'stickers', label: 'Stickers', icon: Smile },
  { id: 'effects', label: 'Effects', icon: Sparkles },
  { id: 'transitions', label: 'Transitions', icon: Wand2 },
  { id: 'captions', label: 'Captions', icon: Subtitles },
  { id: 'adjustment', label: 'Adjustment', icon: SlidersHorizontal },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const SidebarNav: React.FC = () => {
  const activeTab = useEditorStore((s) => s.activeSidebarTab);
  const setActiveTab = useEditorStore((s) => s.setActiveSidebarTab);

  return (
    <nav className="flex h-full w-12 shrink-0 flex-col items-center border-r border-app-border bg-app-surface py-2.5 select-none overflow-y-auto overflow-x-hidden scrollbar-hidden transition-colors duration-200">
      <div className="flex flex-col items-center gap-2 w-full px-1.5 pb-3">
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
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-950 text-white font-bold shadow-sm dark:bg-white dark:text-neutral-950'
                    : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800/70 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 stroke-[1.9]" />
              </button>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
};

export default SidebarNav;
