'use client';

import { useEffect, useRef } from 'react';

export interface ShortcutConfig {
  newWill?: string;
  search?: string;
  help?: string;
}

export interface UseKeyboardShortcutsProps {
  onNewWill?: () => void;
  onSearch?: () => void;
  onHelp?: () => void;
  shortcuts?: ShortcutConfig;
}

export function useKeyboardShortcuts({
  onNewWill,
  onSearch,
  onHelp,
  shortcuts = {},
}: UseKeyboardShortcutsProps) {
  // Keep the latest callbacks/config in refs so the effect below doesn't need
  // to depend on their identity (which is unstable across re-renders when
  // callers pass inline functions/objects). This prevents the keydown
  // listener from being torn down and re-attached on every parent render.
  const onNewWillRef = useRef(onNewWill);
  const onSearchRef = useRef(onSearch);
  const onHelpRef = useRef(onHelp);
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    onNewWillRef.current = onNewWill;
    onSearchRef.current = onSearch;
    onHelpRef.current = onHelp;
    shortcutsRef.current = shortcuts;
  }, [onNewWill, onSearch, onHelp, shortcuts]);

  // Only the actual key bindings (primitive strings) should cause the
  // listener to be re-attached; callback identity should not.
  const keyNewWill = shortcuts.newWill || 'n';
  const keySearch = shortcuts.search || '/';
  const keyHelp = shortcuts.help || '?';

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Check if modifier keys are pressed (excluding Shift, which is needed for '?')
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      // Check if focused element is an input, textarea, or contenteditable
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        const contentEditableAttr = activeEl.getAttribute('contenteditable');
        const isContentEditable =
          contentEditableAttr === 'true' ||
          contentEditableAttr === '' ||
          (activeEl as any).contentEditable === 'true' ||
          (activeEl as any).contentEditable === true ||
          (activeEl as any).isContentEditable === true;

        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          isContentEditable
        ) {
          return;
        }
      }

      if (event.key === keyNewWill && onNewWillRef.current) {
        event.preventDefault();
        onNewWillRef.current();
      } else if (event.key === keySearch && onSearchRef.current) {
        event.preventDefault();
        onSearchRef.current();
      } else if (event.key === keyHelp && onHelpRef.current) {
        event.preventDefault();
        onHelpRef.current();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyNewWill, keySearch, keyHelp]);
}
