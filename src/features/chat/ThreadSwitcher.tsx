import {useEffect, useId, useRef, useState} from 'react';
import {Button, IconButton} from '../../ui';
import type {ChatThread} from '../../types';
import {Icon} from '../../ui/Icon';
import {ThreadsList} from './ThreadsPanel';

interface ThreadSwitcherProps {
  threads: ChatThread[];
  activeThread: ChatThread;
  onSelect: (threadId: string) => void;
  onNewChat: () => void;
  onRename: (threadId: string, title: string) => void;
  onDelete: (threadId: string) => void;
  /** Phone: the switcher fills its row and the panel aligns to the left. */
  fill?: boolean;
}

/** Layers opened from inside the panel (row menus, delete confirmation) must not count as outside clicks. */
const NESTED_LAYERS = '[role="menu"], [role="dialog"], [role="alertdialog"]';

/**
 * Inline thread switcher: ghost button with the current thread title opens a
 * popover with the thread list (select, rename, delete); "+" starts a new chat.
 */
export function ThreadSwitcher({threads, activeThread, onSelect, onNewChat, onRename, onDelete, fill}: ThreadSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || rootRef.current?.contains(target) || target.closest(NESTED_LAYERS)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector(NESTED_LAYERS)) return;
      setOpen(false);
      rootRef.current?.querySelector('button')?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative flex items-center gap-1 ${fill ? 'w-full' : ''}`}>
      <Button
        variant="ghost"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Cambiar de chat. Chat actual: ${activeThread.title}`}
        trailingIcon={<Icon name="chevron-down" className="size-4" />}
        onClick={() => setOpen((v) => !v)}
        className={fill ? 'min-w-0 flex-1 justify-between' : 'max-w-[16rem]'}
      >
        <span className="truncate">{activeThread.title}</span>
      </Button>
      <IconButton aria-label="Nuevo chat" icon={<Icon name="add" className="size-5" />} onClick={onNewChat} />
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Tus chats"
          className={`absolute top-full z-40 mt-1 max-h-[60vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-control border border-rule bg-surface p-2 shadow-lg ${fill ? 'left-0' : 'right-0'}`}
        >
          <ThreadsList
            threads={threads}
            activeThreadId={activeThread.id}
            showNewChat={false}
            onSelect={(id) => {
              onSelect(id);
              setOpen(false);
            }}
            onNewChat={onNewChat}
            onRename={onRename}
            onDelete={onDelete}
          />
        </div>
      ) : null}
    </div>
  );
}
