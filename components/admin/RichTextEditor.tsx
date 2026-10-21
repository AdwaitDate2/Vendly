// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { safeHref } from '@/lib/rich-text';

function ToolbarButton({ label, active, disabled, onClick, children }) {
  return (
    <button type="button" className={`admin-rte__button${active ? ' is-active' : ''}`} aria-label={label} aria-pressed={active ?? undefined} title={label} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>
      {children}
    </button>
  );
}

function Toolbar({ editor, inlineOnly = false, disabled = false }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      block: current.isActive('heading', { level: 2 }) ? 'h2' : current.isActive('heading', { level: 3 }) ? 'h3' : 'p',
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      bullet: current.isActive('bulletList'),
      ordered: current.isActive('orderedList'),
      quote: current.isActive('blockquote'),
      link: current.isActive('link'),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  const setBlock = (value) => {
    const chain = editor.chain().focus();
    if (value === 'p') chain.setParagraph().run();
    else chain.setHeading({ level: value === 'h2' ? 2 : 3 }).run();
  };

  const editLink = () => {
    const current = editor.getAttributes('link').href || '';
    const value = window.prompt('Link address (https://…, mailto:…, or a page on this site such as /book-appointment). Leave empty to remove the link.', current);
    if (value === null) return;
    if (!value.trim()) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    const href = safeHref(/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(value.trim()) ? `mailto:${value.trim()}` : value.trim());
    if (!href) { window.alert('That link isn’t allowed. Use a full web address (https://…), an email, or a page path starting with /.'); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="admin-rte__toolbar" role="toolbar" aria-label="Text formatting">
      {!inlineOnly ? <>
        <select value={state.block} onChange={(event) => setBlock(event.target.value)} aria-label="Text style" disabled={disabled}>
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
        </select>
        <span className="admin-rte__divider" aria-hidden="true" />
      </> : null}
      <ToolbarButton label="Bold" active={state.bold} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></ToolbarButton>
      <ToolbarButton label="Italic" active={state.italic} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarButton>
      <ToolbarButton label="Underline" active={state.underline} disabled={disabled} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolbarButton>
      <ToolbarButton label={state.link ? 'Edit link' : 'Add link'} active={state.link} disabled={disabled} onClick={editLink}>
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" strokeLinecap="round" /></svg>
      </ToolbarButton>
      {!inlineOnly ? <>
        <span className="admin-rte__divider" aria-hidden="true" />
        <ToolbarButton label="Bulleted list" active={state.bullet} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 5h9M8 10h9M8 15h9" strokeLinecap="round" /><circle cx="4" cy="5" r="1" fill="currentColor" /><circle cx="4" cy="10" r="1" fill="currentColor" /><circle cx="4" cy="15" r="1" fill="currentColor" /></svg>
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={state.ordered} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 5h9M8 10h9M8 15h9" strokeLinecap="round" /><path d="M3 4l1.2-.8V7M3 9.5c.4-.6 2-.6 2 .3 0 .8-2 1.3-2 2.2h2M3 14h1.8l-1 1.2c.9 0 1.2.4 1.2.9s-.5.9-1.2.9H3" strokeWidth="1" /></svg>
        </ToolbarButton>
        <ToolbarButton label="Quote" active={state.quote} disabled={disabled} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4 11.5C4 8 6 5.8 8.5 5l.5 1.2C7.4 7 6.6 8.2 6.5 9.5H9V15H4zm7 0C11 8 13 5.8 15.5 5l.5 1.2c-1.6.8-2.4 2-2.5 3.3H16V15h-5z" /></svg>
        </ToolbarButton>
        <ToolbarButton label="Divider line" disabled={disabled} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 10h14" strokeLinecap="round" /></svg>
        </ToolbarButton>
        <span className="admin-rte__divider" aria-hidden="true" />
      </> : null}
      <ToolbarButton label="Undo" disabled={disabled || !state.canUndo} onClick={() => editor.chain().focus().undo().run()}>↺</ToolbarButton>
      <ToolbarButton label="Redo" disabled={disabled || !state.canRedo} onClick={() => editor.chain().focus().redo().run()}>↻</ToolbarButton>
    </div>
  );
}

/** Rich-text editor for policies. Calls onChange with the document JSON on every edit. */
export default function RichTextEditor({ value, onChange, label = 'Page content', compact = false, inlineOnly = false, editable = true, maxCharacters = 0 }) {
  const textLength = (document) => document.textBetween(0, document.content.size, '\n').length;
  const canInsertText = (view, from, to, text) => {
    if (!maxCharacters) return false;
    const currentLength = textLength(view.state.doc);
    const selectedLength = view.state.doc.textBetween(from, to, '\n').length;
    return currentLength - selectedLength + text.length > maxCharacters;
  };
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: inlineOnly ? false : { levels: [2, 3] },
        blockquote: inlineOnly ? false : {},
        bulletList: inlineOnly ? false : {},
        orderedList: inlineOnly ? false : {},
        listItem: inlineOnly ? false : {},
        horizontalRule: inlineOnly ? false : {},
        code: false,
        codeBlock: false,
        strike: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', HTMLAttributes: { rel: 'noreferrer', target: null } },
      }),
    ],
    content: value,
    editable,
    editorProps: {
      attributes: { class: `admin-rte__content rich-text${compact ? ' admin-rte__content--compact' : ''}`, 'aria-label': label, 'aria-multiline': 'true' },
      handleTextInput: (view, from, to, text) => canInsertText(view, from, to, text),
      handlePaste: (view, event) => {
        if (!maxCharacters) return false;
        const pastedText = event.clipboardData?.getData('text/plain');
        if (!pastedText || !canInsertText(view, view.state.selection.from, view.state.selection.to, pastedText)) return false;
        event.preventDefault();
        const currentLength = textLength(view.state.doc);
        const selectedLength = view.state.doc.textBetween(view.state.selection.from, view.state.selection.to, '\n').length;
        const availableLength = Math.max(0, maxCharacters - currentLength + selectedLength);
        if (availableLength) view.dispatch(view.state.tr.insertText(pastedText.slice(0, availableLength)));
        return true;
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON()),
  });

  // Sync content when external value changes (e.g. loading a preset template)
  useEffect(() => {
    if (!editor || !value) return;
    try {
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(value);
      if (current !== incoming) {
        editor.commands.setContent(value, false);
      }
    } catch {
      // ignore
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  return (
    <div className={`admin-rte${compact ? ' admin-rte--compact' : ''}${editable ? '' : ' is-readonly'}`}>
      {editor ? <Toolbar editor={editor} inlineOnly={inlineOnly} disabled={!editable} /> : <div className="admin-rte__toolbar" aria-hidden="true" />}
      {editor ? <EditorContent editor={editor} /> : <div className="admin-rte__content admin-rte__loading">Loading editor…</div>}
    </div>
  );
}
