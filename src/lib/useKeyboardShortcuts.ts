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
  // Keep the latest callbacks in refs so the effect below doesn't need to
  // depend on their identity. Callers frequently pass inline arrow
  // functions or non-memoized callbacks, which would otherwise be recreated
  // on every render and cause the keydown listener to be torn down and
  // re-registered unnecessarily (and could momentarily miss events).
  const onNewWillRef = useRef(onNewWill);
  const onSearchRef = useRef(onSearch);
  const onHelpRef = useRef(onHelp);

  useEffect(() => {
    onNewWillRef.current = onNewWill;
    onSearchRef.current = onSearch;
    onHelpRef.current = onHelp;
  }, [onNewWill, onSearch, onHelp]);

  const shortcutNewWill = shortcuts.newWill;
  const shortcutSearch = shortcuts.search;
  const shortcutHelp = shortcuts.help;

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

      // Define default keys and overrides
      const keyNewWill = shortcutNewWill || 'n';
      const keySearch = shortcutSearch || '/';
      const keyHelp = shortcutHelp || '?';

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
  }, [shortcutNewWill, shortcutSearch, shortcutHelp]);
}
