// =====================================================================
// RENTBOOK KENYA — COLLAPSIBLE SIDEBAR (Optimized for Chromebook 1366x768)
// Icon-only default to maximize screen width; expands smoothly on hover/toggle
// =====================================================================

import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenType } from '../../types';

export const Sidebar: React.FC = () => {
  const { currentScreen, setCurrentScreen, pendingApprovalsCount } = useApp();
  const { activeRole } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  interface NavItem {
    id: ScreenType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    adminOnly?: boolean;
    landlordAdminOnly?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'cashbook',
      label: 'Cash Book',
      icon: BookOpen,
      landlordAdminOnly: true,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'units', label: 'Houses', icon: Building },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'debts', label: 'Arrears', icon: AlertCircle },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet, landlordAdminOnly: true },
    { id: 'team', label: 'Staff / Team', icon: UserCheck, landlordAdminOnly: true },
    { id: 'audit', label: 'Audit Log', icon: ShieldAlert, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && activeRole !== 'admin') return false;
    if (item.landlordAdminOnly && activeRole === 'caretaker') return false;
    return true;
  });

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-200 z-30 select-none shrink-0 ${
        isExpanded ? 'w-52' : 'w-14'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex-1 py-3 flex flex-col gap-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentScreen(item.id)}
              className={`group flex items-center gap-3 px-3.5 py-2.5 mx-1.5 text-xs font-medium transition min-h-[44px] ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
              }`}
              title={!isExpanded ? item.label : undefined}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-emerald-400 stroke-[2.5]' : 'group-hover:text-slate-200'
                  }`}
                />
                {item.badge && !isExpanded && (
                  <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-amber-400 ring-2 ring-slate-900" />
                )}
              </div>

              {isExpanded && (
                <div className="flex-1 flex items-center justify-between truncate animate-in fade-in duration-150">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Expand/Collapse Toggle Button at Bottom */}
      <div className="p-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs transition min-h-[36px]"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px]">Collapse</span>
            </div>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
