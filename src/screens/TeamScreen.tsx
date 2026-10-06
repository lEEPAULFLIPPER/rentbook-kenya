// =====================================================================
// RENTBOOK KENYA — TEAM & USER MANAGEMENT SCREEN (Admin & Landlord)
// Assign roles (Admin, Landlord, Caretaker), set property scope, last-seen
// =====================================================================

import React from 'react';
import {
  Clock,
  Mail,
  Phone,
  Plus,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDateKE } from '../lib/formatters';

export const TeamScreen: React.FC = () => {
  const { openInviteModal } = useApp();
  const { allProfiles, activeRole, currentUser } = useAuth();

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>Staff & Access Management</span>
            <span className="text-xs font-mono font-normal text-emerald-400 px-2 py-0.5 bg-slate-800 border border-slate-700">
              {allProfiles.length} Members
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage Caretakers, Landlords, and Admin master permissions
          </p>
        </div>

        <button
          type="button"
          onClick={openInviteModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Invite New Staff</span>
        </button>
      </div>

      {/* 2. PROFILES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {allProfiles.map((profile) => {
          const isCurrentUser = profile.id === currentUser.id;
          return (
            <div
              key={profile.id}
              className="bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{profile.full_name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-mono text-emerald-400 font-normal">
                          (You)
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {profile.phone || 'No phone set'}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase font-mono border ${
                      profile.role === 'admin'
                        ? 'bg-purple-950 text-purple-300 border-purple-800'
                        : profile.role === 'landlord'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {profile.role}
                  </span>
                </div>

                <div className="my-3 text-xs bg-slate-950/50 p-2.5 border border-slate-800/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Account Status:</span>
                    <span className="font-bold text-emerald-400 uppercase text-[10px]">
                      {profile.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Last Seen:</span>
                    <span className="text-slate-300 font-mono">
                      {profile.last_seen_at ? formatDateKE(profile.last_seen_at) : 'Active Today'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status / Role Tag */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Created {formatDateKE(profile.created_at)}</span>
                <span className="text-slate-300 font-medium capitalize">
                  {profile.role === 'caretaker' ? 'Field Staff' : 'Management'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
