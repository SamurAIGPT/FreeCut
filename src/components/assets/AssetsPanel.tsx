import React from 'react';
import { SidebarNav } from '../sidebar/SidebarNav';
import { SidebarContent } from '../sidebar/SidebarContent';

export const AssetsPanel: React.FC = () => {
  return (
    <div className="flex h-full shrink-0 overflow-hidden">
      <SidebarNav />
      <SidebarContent />
    </div>
  );
};

export default AssetsPanel;
