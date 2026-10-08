// =====================================================================
// RENTBOOK KENYA — APP ROOT & LAYOUT ORCHESTRATOR
// Engineered for Acer Chromebook Spin 311 (1366x768) and Mobile Devices
// =====================================================================

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

  // Keyboard shortcuts tuned for Chromebook Spin 311
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
      {/* "View As" Mode Warning Banner on Chromebook */}
      {isViewingAs && (
        <div className="bg-purple-950 text-purple-200 border-b border-purple-800 px-3 py-1.5 text-xs flex items-center justify-between font-semibold">
          <span>
            👁️ Viewing app as: <strong className="uppercase text-white">{viewAsRole}</strong>{' '}
            (Admin Preview Mode)
          </span>
          <span className="text-[11px] opacity-80">Permissions strictly simulated</span>
        </div>
      )}

      {/* Client Presentation Pitch Banner */}
      {isPresentationMode && (
        <div className="bg-emerald-950/90 text-emerald-100 border-b border-emerald-700 px-3 py-1.5 text-xs flex items-center justify-between font-semibold shadow-inner">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center bg-emerald-500/30 text-emerald-300 font-black text-xs">
              🎯
            </span>
            <span>
              <strong>CLIENT MOCKUP PRESENTATION</strong> · Estate: <span className="underline decoration-emerald-400 font-bold">{currentProperty?.name}</span> · Real SQLite Database Online
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openClientMockupModal()}
              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] shadow transition active:scale-95"
            >
              Tailor Mockup
            </button>
            <button
              onClick={togglePresentationMode}
              className="text-emerald-300 hover:text-white hover:underline text-[11px]"
            >
              Exit Pitch Mode
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
