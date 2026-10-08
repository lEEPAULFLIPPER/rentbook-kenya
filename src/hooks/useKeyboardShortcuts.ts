// RentBook Kenya - Global Keyboard Shortcuts


import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  onOpenCommandPalette?: () => void;
  onNewPayment?: () => void;
  onNewExpense?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  onOpenCommandPalette,
  onNewPayment,
  onNewExpense,
  onEscape,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing inside an input, textarea, or select
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Escape always fires
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      // Ctrl+K or Cmd+K: Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }

      // If typing in input, ignore single-letter shortcuts
      if (isInput) return;

      // "/" opens search/command palette
      if (e.key === '/') {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }

      // "N" or "n" opens New Payment
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onNewPayment?.();
        return;
      }

      // "E" or "e" opens New Expense
      if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onNewExpense?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette, onNewPayment, onNewExpense, onEscape]);
}
