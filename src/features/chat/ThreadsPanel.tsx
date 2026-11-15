import {useRef, useState} from 'react';
import {Button, ConfirmDialog, Menu, TextField} from '../../ui';
import type {ChatThread} from '../../types';
import {Icon} from '../../ui/Icon';

interface ThreadsListProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelect: (threadId: string) => void;
  onNewChat: () => void;
  onRename: (threadId: string, title: string) => void;
  /** Called after the user confirmed the deletion. */
  onDelete: (threadId: string) => void;
}

const dateFormat = new Intl.DateTimeFormat('es-AR', {day: 'numeric', month: 'short'});
const dateYearFormat = new Intl.DateTimeFormat('es-AR', {day: 'numeric', month: 'short', year: 'numeric'});

/**
 * Stored dates are free text ("Hoy", "HH:MM", "YYYY-MM-DD" or "YYYY-MM-DD HH:MM").
 * Shows "Hoy 11:22", "Ayer", "3 oct"; unknown formats are shown as given.
 */
export function formatThreadDate(createdAt: string, today: Date = new Date()): string {
  if (/^\d{1,2}:\d{2}/.test(createdAt)) return `Hoy ${createdAt}`;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}:\d{2}))?/.exec(createdAt);
  if (!m) return createdAt;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((startOfToday.getTime() - date.getTime()) / 86_400_000);
  if (days === 0) return m[4] ? `Hoy ${m[4]}` : 'Hoy';
  if (days === 1) return 'Ayer';
  return (date.getFullYear() === today.getFullYear() ? dateFormat : dateYearFormat).format(date).replace('.', '');
}

/** Thread list + the only "Nuevo chat" control (UX-10). Used in the aside and in the Chats dialog. */
export function ThreadsList({threads, activeThreadId, onSelect, onNewChat, onRename, onDelete}: ThreadsListProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deleting, setDeleting] = useState<ChatThread | null>(null);
  // Escape unmounts the field, which can fire blur; this flag keeps it from saving.
  const cancelledRef = useRef(false);

  const startRename = (thread: ChatThread) => {
    cancelledRef.current = false;
    setDraft(thread.title);
    setRenamingId(thread.id);
  };

  const commitRename = (thread: ChatThread) => {
    if (cancelledRef.current) return;
    const title = draft.trim();
    if (title && title !== thread.title) onRename(thread.id, title);
    setRenamingId(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="ghost"
        className="self-start"
        leadingIcon={<Icon name="add" className="size-5" />}
        onClick={onNewChat}
      >
        Nuevo chat
      </Button>

      <ul className="flex flex-col gap-1" aria-label="Tus chats">
        {threads.map((thread) => {
          const active = thread.id === activeThreadId;
          return (
            <li
              key={thread.id}
              className={`flex min-h-11 items-center gap-1 rounded-control pr-1 ${active ? 'border-l-2 border-ink bg-subtle' : 'border-l-2 border-transparent hover:bg-subtle'}`}
            >
              {renamingId === thread.id ? (
                <div className="min-w-0 flex-1 p-1 [&_label]:sr-only">
                  <TextField
                    label={`Nuevo nombre para ${thread.title}`}
                    value={draft}
                    autoFocus
                    maxLength={60}
                    onChange={(e) => setDraft(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={() => commitRename(thread)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitRename(thread);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        cancelledRef.current = true;
                        setRenamingId(null);
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onSelect(thread.id)}
                    className="flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-control px-3 py-1 text-left"
                  >
                    <span className={`truncate text-label ${active ? 'font-semibold text-strong' : 'text-default'}`}>
                      {thread.title}
                    </span>
                    <span className="truncate text-caption text-muted">{formatThreadDate(thread.createdAt)}</span>
                  </button>
                  <Menu
                    label={`Opciones de ${thread.title}`}
                    items={[
                      {id: 'rename', label: 'Renombrar', icon: <Icon name="edit" />, onSelect: () => startRename(thread)},
                      {id: 'delete', label: 'Eliminar', icon: <Icon name="delete" />, danger: true, onSelect: () => setDeleting(thread)},
                    ]}
                  />
                </>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) onDelete(deleting.id);
          setDeleting(null);
        }}
        title={`¿Eliminar «${deleting?.title ?? ''}»?`}
        description={
          threads.length <= 1
            ? 'Es tu único chat: se creará uno nuevo vacío. Tus fuentes y materiales no cambian.'
            : 'Se borra la conversación. Tus fuentes y materiales no cambian.'
        }
      />
    </div>
  );
}
