'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { VariableNode } from './variable-node';

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active ?? false}
      className={cn(
        'px-2 py-1 text-sm rounded transition-colors',
        active ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

function EditorToolbar({
  editor,
  variables,
}: {
  editor: Editor;
  variables: Record<string, string>;
}) {
  const [showVarPicker, setShowVarPicker] = useState(false);

  function insertVariable(key: string) {
    editor.chain().focus().insertVariable(key).run();
    setShowVarPicker(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 bg-gray-50 rounded-t-md">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading"
      >
        H
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered list"
      >
        1.
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />

      {/* Variable insertion */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowVarPicker((v) => !v)}
          active={showVarPicker}
          title="Insert variable"
        >
          <span className="font-mono text-xs text-blue-700">{'{{x}}'}</span>
        </ToolbarButton>
        {showVarPicker && (
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-md shadow-lg min-w-[200px]">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-b">Insert variable</p>
            <div role="menu" aria-label="Available variables">
              {Object.keys(variables).length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">No variables defined</p>
              ) : (
                Object.keys(variables).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 font-mono text-blue-700 block"
                    onClick={() => insertVariable(key)}
                  >
                    {`{{${key}}}`}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Variable autocomplete popup ─────────────────────────────────────────────

interface AutocompleteState {
  visible: boolean;
  query: string;
  top: number;
  left: number;
  activeIndex: number;
}

// ─── Main editor ─────────────────────────────────────────────────────────────

interface ClauseRichEditorProps {
  initialContent: string;
  variables: Record<string, string>;
  onChange: (html: string) => void;
  onSave?: () => void;
  placeholder?: string;
}

export function ClauseRichEditor({
  initialContent,
  variables,
  onChange,
  onSave,
  placeholder = 'Enter clause text…',
}: ClauseRichEditorProps) {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const variablesRef = useRef(variables);
  variablesRef.current = variables;

  const [autocomplete, setAutocomplete] = useState<AutocompleteState>({
    visible: false, query: '', top: 0, left: 0, activeIndex: 0,
  });
  const autocompleteRef = useRef(autocomplete);
  autocompleteRef.current = autocomplete;
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder }),
      VariableNode,
    ],
    content: htmlFromBody(initialContent),
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
      checkAutocomplete(e);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[120px] p-3 focus:outline-none',
        'aria-label': 'Clause body editor',
        'aria-multiline': 'true',
        role: 'textbox',
      },
      handleKeyDown(_view, event) {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
          event.preventDefault();
          onSaveRef.current?.();
          return true;
        }
        // Navigate / accept autocomplete
        const ac = autocompleteRef.current;
        if (ac.visible) {
          if (event.key === 'Escape') {
            setAutocomplete((s) => ({ ...s, visible: false }));
            return true;
          }
          const keys = Object.keys(variablesRef.current).filter((k) =>
            k.toLowerCase().includes(ac.query.toLowerCase()),
          );
          if (event.key === 'ArrowDown') {
            setAutocomplete((s) => ({ ...s, activeIndex: Math.min(s.activeIndex + 1, keys.length - 1) }));
            return true;
          }
          if (event.key === 'ArrowUp') {
            setAutocomplete((s) => ({ ...s, activeIndex: Math.max(s.activeIndex - 1, 0) }));
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            const chosen = keys[ac.activeIndex];
            if (chosen) {
              event.preventDefault();
              acceptAutocomplete(chosen);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  function checkAutocomplete(e: Editor) {
    const { from } = e.state.selection;
    const text = e.state.doc.textBetween(Math.max(0, from - 40), from, '\n', '\0');
    const match = /\{\{([\w.]*)$/.exec(text);
    if (match) {
      const query = match[1] ?? '';
      const coords = e.view.coordsAtPos(from);
      const containerRect = containerRef.current?.getBoundingClientRect();
      const top = containerRect ? coords.bottom - containerRect.top + 4 : coords.bottom + 4;
      const left = containerRect ? coords.left - containerRect.left : coords.left;
      setAutocomplete({ visible: true, query, top, left, activeIndex: 0 });
    } else {
      setAutocomplete((s) => s.visible ? { ...s, visible: false } : s);
    }
  }

  function acceptAutocomplete(key: string) {
    if (!editor) return;
    const { from } = editor.state.selection;
    const text = editor.state.doc.textBetween(Math.max(0, from - 40), from, '\n', '\0');
    const match = /\{\{([\w.]*)$/.exec(text);
    if (!match) return;
    const deleteChars = match[0].length;
    editor
      .chain()
      .focus()
      .deleteRange({ from: from - deleteChars, to: from })
      .insertVariable(key)
      .run();
    setAutocomplete((s) => ({ ...s, visible: false }));
  }

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = htmlFromBody(initialContent);
    if (current !== next) {
      editor.commands.setContent(next);
    }
  }, [initialContent, editor]);

  const filteredKeys = Object.keys(variables).filter((k) =>
    k.toLowerCase().includes(autocomplete.query.toLowerCase()),
  );

  if (!editor) return null;

  return (
    <div ref={containerRef} className="relative border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      <EditorToolbar editor={editor} variables={variables} />
      <EditorContent editor={editor} />

      {/* Autocomplete dropdown */}
      {autocomplete.visible && filteredKeys.length > 0 && (
        <div
          className="absolute z-30 bg-white border border-gray-200 rounded-md shadow-lg min-w-[180px] max-h-48 overflow-y-auto"
          // eslint-disable-next-line react/forbid-dom-props -- dynamic pixel position requires inline style
          style={{ top: autocomplete.top, left: autocomplete.left }}
          role="listbox"
          aria-label="Variable suggestions"
        >
          {filteredKeys.map((key, i) => (
            <button
              key={key}
              type="button"
              role="option"
              aria-selected={Boolean(i === autocomplete.activeIndex)}
              className={cn(
                'w-full text-left px-3 py-1.5 text-xs font-mono text-blue-700 block',
                i === autocomplete.activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50',
              )}
              onMouseDown={(e) => { e.preventDefault(); acceptAutocomplete(key); }}
            >
              {`{{${key}}}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Convert plain text (possibly with existing HTML) to a TipTap-safe string.
 * Converts `{{key}}` tokens (plain text or already-wrapped spans) to VariableNode markup
 * so the editor displays them as non-editable chip atoms.
 */
function htmlFromBody(body: string): string {
  // 1. Unwrap any existing variable spans back to plain {{key}} for idempotency
  const normalized = body.replace(
    /<span[^>]+data-variable="([\w.]+)"[^>]*>.*?<\/span>/g,
    '{{$1}}',
  );
  // 2. Re-wrap all {{key}} tokens as VariableNode markup
  const withNodes = normalized.replace(
    /\{\{([\w.]+)\}\}/g,
    (_, key: string) =>
      `<span data-variable="${key}" contenteditable="false" class="variable-token">{{${key}}}</span>`,
  );
  if (withNodes.trimStart().startsWith('<')) return withNodes;
  return withNodes
    .split('\n')
    .map((line) => `<p>${line || '<br>'}</p>`)
    .join('');
}
