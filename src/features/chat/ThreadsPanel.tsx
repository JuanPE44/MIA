import {useRef, useState} from 'react';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {Button, ConfirmDialog, Menu, TextField} from '../../ui';
import type {ChatThread} from '../../types';

interface ThreadsListProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelect: (threadId: string) => void;
  onNewChat: () => void;
  onRename: (threadId: string, title: string) => void;
  /** Called after the user confirmed the deletion. */
  onDelete: (threadId: string) => void;
}

/** Stored dates are free text ("Hoy" or an HH:MM time); show them as given. */
function formatThreadDate(createdAt: string): string {
  return /^\d{1,2}:\d{2}/.test(createdAt) ? `Hoy · ${createdAt}` : createdAt;
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
        variant="primary"
        fullWidth
        leadingIcon={<Plus aria-hidden className="size-5" />}
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
              className={`flex min-h-11 items-center gap-1 rounded-control pr-1 ${active ? 'bg-primary-tint' : 'hover:bg-subtle'}`}
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
                    <span className={`truncate text-label ${active ? 'text-primary-on-tint' : 'text-strong'}`}>
                      {thread.title}
                    </span>
                    <span className="truncate text-caption text-muted">{formatThreadDate(thread.createdAt)}</span>
                  </button>
                  <Menu
                    label={`Opciones de ${thread.title}`}
                    items={[
                      {id: 'rename', label: 'Renombrar', icon: <Pencil />, onSelect: () => startRename(thread)},
                      {id: 'delete', label: 'Eliminar', icon: <Trash2 />, danger: true, onSelect: () => setDeleting(thread)},
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
