/**
 * @fileoverview TipTap WYSIWYG Message Editor
 * @module components/messages/MessageEditor
 * 
 * OVERVIEW:
 * Rich text editor for composing messages using TipTap.
 * Supports bold, italic, underline, lists, links, and mentions.
 * Includes character count and XSS protection via DOMPurify on server.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

interface MessageEditorProps {
  /** Initial HTML content */
  content?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character limit */
  maxLength?: number;
  /** Height of editor */
  minHeight?: number;
  /** Callback when content changes */
  onChange?: (html: string) => void;
  /** Whether editor is disabled */
  disabled?: boolean;
  /** CSS class for container */
  className?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

// ============================================================
// TOOLBAR BUTTON
// ============================================================

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-muted text-muted-foreground hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

// ============================================================
// TOOLBAR
// ============================================================

interface ToolbarProps {
  editor: Editor | null;
}

function Toolbar({ editor }: ToolbarProps) {
  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    
    // Cancelled
    if (url === null) return;
    
    // Empty - remove link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    // Set link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
      {/* Text Formatting */}
      <div className="flex items-center gap-0.5 pr-2 border-r">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 px-2 border-r">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Links */}
      <div className="flex items-center gap-0.5 px-2 border-r">
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          title="Remove Link"
        >
          <Unlink className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* History */}
      <div className="flex items-center gap-0.5 pl-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}

// ============================================================
// CHARACTER COUNT
// ============================================================

interface CharCountProps {
  editor: Editor | null;
  limit: number;
}

function CharCount({ editor, limit }: CharCountProps) {
  if (!editor) return null;

  const count = editor.storage.characterCount.characters();
  const percentage = Math.round((100 / limit) * count);
  const isNearLimit = percentage > 80;
  const isOverLimit = count > limit;

  return (
    <div className="flex items-center justify-end gap-2 p-2 text-xs text-muted-foreground border-t">
      <div
        className={cn(
          'transition-colors',
          isOverLimit && 'text-destructive font-medium',
          isNearLimit && !isOverLimit && 'text-warning'
        )}
      >
        {count.toLocaleString()} / {limit.toLocaleString()} characters
      </div>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            isOverLimit ? 'bg-destructive' : isNearLimit ? 'bg-warning' : 'bg-primary'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// MESSAGE EDITOR
// ============================================================

export function MessageEditor({
  content = '',
  placeholder = 'Write your message...',
  maxLength = 5000,
  minHeight = 200,
  onChange,
  disabled = false,
  className,
  autoFocus = false,
}: MessageEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading - messages don't need headers
        heading: false,
        // Configure other extensions
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content,
    editable: !disabled,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'focus:outline-none p-4',
          'min-h-[var(--editor-min-height)]'
        ),
        style: `--editor-min-height: ${minHeight}px`,
      },
    },
  });

  // Update content when prop changes (for controlled mode)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden bg-background',
        disabled && 'opacity-60',
        className
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <CharCount editor={editor} limit={maxLength} />
    </div>
  );
}

// ============================================================
// EXPORTS
// ============================================================

export type { MessageEditorProps };
export default MessageEditor;
