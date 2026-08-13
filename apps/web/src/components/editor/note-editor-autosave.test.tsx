import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NoteEditorDialog, type Note } from './note-editor';

describe('NoteEditorDialog Autosave', () => {
  const mockOnSave = vi.fn().mockImplementation(() => Promise.resolve());
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers debounced autosave after 3 seconds of typing', async () => {
    render(
      <NoteEditorDialog onSave={mockOnSave} isOpen={true} onOpenChange={mockOnOpenChange} />
    );

    const titleInput = screen.getByPlaceholderText('Untitled note');
    const contentTextarea = screen.getByPlaceholderText('Write in Markdown. Use the toolbar to format quickly.');
    
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Autosave Title' } });
      fireEvent.change(contentTextarea, { target: { value: 'Autosave Content' } });
    });

    // Should show "Unsaved draft" immediately
    expect(screen.getByText('Unsaved draft')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();

    // Fast-forward 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Wait for the async callback of setTimeout to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockOnSave).toHaveBeenCalled();

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Autosave Title',
      content: 'Autosave Content',
    }));

    // Should show "Saved" after successful autosave
    expect(screen.getByText('Saved')).toBeInTheDocument();
  }, 15000);

  it('persists draft to localStorage and recovers it on reopen', async () => {
    const { unmount } = render(
      <NoteEditorDialog onSave={mockOnSave} isOpen={true} onOpenChange={mockOnOpenChange} />
    );

    const titleInput = screen.getByPlaceholderText('Untitled note');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Persistent Draft' } });
    });

    // Check localStorage
    const draft = JSON.parse(localStorage.getItem('note-draft-new') || '{}');
    expect(draft.title).toBe('Persistent Draft');

    // Close and unmount
    unmount();

    // Re-render
    render(
      <NoteEditorDialog onSave={mockOnSave} isOpen={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByDisplayValue('Persistent Draft')).toBeInTheDocument();
  }, 15000);

  it('shows sync error when autosave fails', async () => {
    const failingMockOnSave = vi.fn().mockRejectedValue(new Error('Sync failed'));
    
    render(
      <NoteEditorDialog onSave={failingMockOnSave} isOpen={true} onOpenChange={mockOnOpenChange} />
    );

    const titleInput = screen.getByPlaceholderText('Untitled note');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Failing Note' } });
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Sync error')).toBeInTheDocument();
  }, 15000);
});
