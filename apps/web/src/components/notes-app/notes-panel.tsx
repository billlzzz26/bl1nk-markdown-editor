"use client";

import { useEffect, useState } from "react";
import { NoteEditorDialog, NotesList, type Note } from "@/components/ui/note-editor";
import { X } from "lucide-react";

interface NotesPanelProps {
  notes: Note[];
  onSave: (note: Partial<Note>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose?: () => void;
  isMobileOverlay?: boolean;
}

export function NotesPanel({ notes, onSave, onDelete, onClose, isMobileOverlay }: NotesPanelProps) {
  const [localNotes, setLocalNotes] = useState<Note[]>(notes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleNewNote = () => {
    setEditingNote(undefined);
    setDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setDialogOpen(true);
  };

  const handleSave = async (data: Partial<Note>) => {
    await onSave(data);
    setDialogOpen(false);
    setEditingNote(undefined);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setDialogOpen(false);
    setEditingNote(undefined);
  };

  return (
    <div className="w-full md:w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Notes</h2>
          <p className="text-xs text-neutral-400">{localNotes.length} notes</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewNote}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            + New
          </button>
          {isMobileOverlay && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <NotesList
          notes={localNotes}
          onEdit={handleEditNote}
          onDelete={handleDelete}
        />
      </div>
      <NoteEditorDialog
        note={editingNote}
        onSave={handleSave}
        onDelete={handleDelete}
        isOpen={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingNote(undefined);
        }}
      />
    </div>
  );
}
