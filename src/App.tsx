// RentBook Kenya - Enterprise Rental Management & Cash Book System


import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Common Components
import { TopNav } from './components/common/TopNav';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { CommandPalette } from './components/common/CommandPalette';
import { LiveNotificationToast } from './components/common/LiveNotificationToast';
import { UndoToast } from './components/common/UndoToast';

// Modals
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { PropertyModal } from './components/modals/PropertyModal';
import { BulkRenameModal } from './components/modals/BulkRenameModal';
import { TenantModal } from './components/modals/TenantModal';
import { UnitModal } from './components/modals/UnitModal';
import { UserInviteModal } from './components/modals/UserInviteModal';
import { ConfirmDangerModal } from './components/modals/ConfirmDangerModal';
import { ClientShareModal } from './components/modals/ClientShareModal';
import { PrintReceiptModal } from './components/modals/PrintReceiptModal';
import { ClientMockupModal } from './components/modals/ClientMockupModal';
import { Sparkles } from 'lucide-react';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { CashBookScreen } from './screens/CashBookScreen';
import { UnitsScreen } from './screens/UnitsScreen';
import { UnitDetailScreen } from './screens/UnitDetailScreen';
import { TenantsScreen } from './screens/TenantsScreen';
import { ArrearsScreen } from './screens/ArrearsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { TeamScreen } from './screens/TeamScreen';
import { AuditLogScreen } from './screens/AuditLogScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const MainLayout: React.FC = () => {
  const {
    currentScreen,
    openPaymentModal,
    openExpenseModal,
    isClientShareModalOpen,
    closeClientShareModal,
    isReceiptModalOpen,
    receiptModalPayment,
    closeReceiptModal,
    isClientMockupModalOpen,
    closeClientMockupModal,
    openClientMockupModal,
    isPresentationMode,
    togglePresentationMode,
    currentProperty,
    units,
    tenants,
  } = useApp();
  const { isViewingAs, viewAsRole } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onNewPayment: () => openPaymentModal(),
    onNewExpense: () => openExpenseModal(),
    onEscape: () => setIsCommandPaletteOpen(false),
  });

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'cashbook':
        return <CashBookScreen />;
      case 'units':
        return <UnitsScreen />;
      case 'unit-detail':
        return <UnitDetailScreen />;
      case 'tenants':
        return <TenantsScreen />;
      case 'debts':
        return <ArrearsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'team':
        return <TeamScreen />;
      case 'audit':
        return <AuditLogScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Role Preview Banner */}
      {isViewingAs && (
        <div className="bg-purple-950 text-purple-200 border-b border-purple-800 px-3 py-1.5 text-xs flex items-center justify-between font-semibold">
          <span>
            👁️ Viewing app as: <strong className="uppercase text-white">{viewAsRole}</strong>{' '}
            (Admin Preview Mode)
          </span>
          <span className="text-[11px] opacity-80">Permissions strictly simulated</span>
        </div>
      )}

      {/* Executive Presentation View Banner */}
      {isPresentationMode && (
        <div className="bg-slate-900 text-emerald-300 border-b border-emerald-600/50 px-3 py-1.5 text-xs flex items-center justify-between font-semibold shadow-inner">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center bg-emerald-500/20 text-emerald-300 font-mono text-xs">
              ⚡
            </span>
            <span>
              <strong className="tracking-wide">EXECUTIVE PRESENTATION VIEW</strong> · Property: <span className="underline decoration-emerald-400 font-bold text-white">{currentProperty?.name}</span> · <span className="text-emerald-400 font-mono text-[11px]">Live Ledger Active</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openClientMockupModal()}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] shadow transition active:scale-95"
            >
              Property Setup
            </button>
            <button
              onClick={togglePresentationMode}
              className="text-slate-400 hover:text-white hover:underline text-[11px]"
            >
              Standard View
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <TopNav onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

      {/* Body with Sidebar & Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Icon-only Desktop Sidebar */}
        <Sidebar />

        {/* Scrollable Main Workspace (Responsive padding for 1366x768 and half-screen) */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-7xl mx-auto w-full">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals */}
      <RecordPaymentModal />
      <AddExpenseModal />
      <PropertyModal />
      <BulkRenameModal />
      <TenantModal />
      <UnitModal />
      <UserInviteModal />
      <ConfirmDangerModal />
      <ClientShareModal
        isOpen={isClientShareModalOpen}
        onClose={closeClientShareModal}
      />
      <PrintReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
        payment={receiptModalPayment}
        unit={units.find((u) => u.id === receiptModalPayment?.unit_id)}
        tenant={tenants.find((t) => t.id === receiptModalPayment?.tenant_id)}
        property={currentProperty}
      />
      <ClientMockupModal
        isOpen={isClientMockupModalOpen}
        onClose={closeClientMockupModal}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Realtime Toasts & Undo Floating Banner */}
      <LiveNotificationToast />
      <UndoToast />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
