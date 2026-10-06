// =====================================================================
// RENTBOOK KENYA — USER INVITE & ROLE SCOPE MODAL
// Admin & Landlord user management: assigns roles & property scopes
// =====================================================================

import React, { useState } from 'react';
import { Mail, Shield, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const UserInviteModal: React.FC = () => {
  const { isInviteModalOpen, closeInviteModal, visibleProperties, broadcastLiveAction } = useApp();
  const { activeRole, allProfiles } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('07');
  const [role, setRole] = useState<UserRole>('caretaker');
  const [targetPropertyId, setTargetPropertyId] = useState<string>(visibleProperties[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      alert('Please enter user name and email.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      broadcastLiveAction(`Sent invitation to ${fullName} (${role.toUpperCase()}) at ${email}`, 'success');
      setIsSubmitting(false);
      closeInviteModal();
    }, 400);
  };

  return (
    <Modal
      isOpen={isInviteModalOpen}
      onClose={closeInviteModal}
      title="Invite Staff / Assign Role"
      subtitle="Send invitation with role permissions and property scope"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
        {/* Full Name */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Full Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jackson Omondi, David Kimani"
            className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            required
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@rentbook.ke"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0711998877"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Assigned Role</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(activeRole === 'admin' ? ['caretaker', 'landlord', 'admin'] : ['caretaker']).map(
              (r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r as UserRole)}
                  className={`py-2 px-1 font-bold uppercase text-xs border transition min-h-[44px] ${
                    role === r
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              )
            )}
          </div>
        </div>

        {/* Property Scope */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Property Scope (Access)</label>
          <select
            value={targetPropertyId}
            onChange={(e) => setTargetPropertyId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          >
            {activeRole === 'admin' && <option value="all">All Properties (Global Master)</option>}
            {visibleProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.location})
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={closeInviteModal}
            className="px-4 py-2.5 text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
