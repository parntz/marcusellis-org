"use client";

import { Extension } from "@tiptap/core";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";
import { stripImgTagsFromHtml } from "../lib/strip-img-tags-from-html.js";

const StripImagesOnPaste = Extension.create({
  name: "stripImagesOnPaste",
  transformPastedHTML(html) {
    return stripImgTagsFromHtml(html);
  },
});

function ToolbarButton({ active = false, disabled, onClick, children, title }) {
  return (
    <button
      type="button"
      className="news-events-body-editor__tool"
      title={title}
      aria-pressed={active ? "true" : "false"}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function BodyEditorToolbar({ editor }) {
  const snap = useEditorState({
    editor,
    selector: (s) => ({
      bold: s.editor.isActive("bold"),
      italic: s.editor.isActive("italic"),
      strike: s.editor.isActive("strike"),
      underline: s.editor.isActive("underline"),
      code: s.editor.isActive("code"),
      h2: s.editor.isActive("heading", { level: 2 }),
      h3: s.editor.isActive("heading", { level: 3 }),
      h4: s.editor.isActive("heading", { level: 4 }),
      bullet: s.editor.isActive("bulletList"),
      ordered: s.editor.isActive("orderedList"),
      quote: s.editor.isActive("blockquote"),
      link: s.editor.isActive("link"),
    }),
  });

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  return (
    <div className="news-events-body-editor__toolbar" role="toolbar" aria-label="Formatting">
      <ToolbarButton
        title="Bold"
        active={snap.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={snap.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={snap.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={snap.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        S
      </ToolbarButton>
      <ToolbarButton
        title="Inline code"
        active={snap.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {"</>"}
      </ToolbarButton>
      <span className="news-events-body-editor__toolbar-sep" aria-hidden />
      <ToolbarButton
        title="Heading 2"
        active={snap.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={snap.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        title="Heading 4"
        active={snap.h4}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      >
        H4
      </ToolbarButton>
      <span className="news-events-body-editor__toolbar-sep" aria-hidden />
      <ToolbarButton
        title="Bullet list"
        active={snap.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={snap.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={snap.quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        “ ”
      </ToolbarButton>
      <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ─
      </ToolbarButton>
      <span className="news-events-body-editor__toolbar-sep" aria-hidden />
      <ToolbarButton title="Link" active={snap.link} onClick={setLink}>
        Link
      </ToolbarButton>
      <span className="news-events-body-editor__toolbar-sep" aria-hidden />
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </ToolbarButton>
    </div>
  );
}

/**
 * Rich HTML body for news/event detail pages (Tiptap / ProseMirror).
 * Unknown HTML tags are dropped on load until matching extensions exist.
 */
export function NewsEventsBodyEditor({ value, onChange, labelledBy }) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      StripImagesOnPaste,
      Placeholder.configure({
        placeholder:
          "Write the article body. Headings, lists, and links are supported; images are not. Other HTML may be simplified when saved.",
      }),
    ],
    []
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: stripImgTagsFromHtml(value || ""),
      editorProps: {
        attributes: {
          class: "news-events-body-editor__prose tiptap",
          "aria-labelledby": labelledBy || undefined,
          spellCheck: "true",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(stripImgTagsFromHtml(ed.getHTML()));
      },
    },
    [extensions]
  );

  if (!editor) {
    return <div className="news-events-body-editor news-events-body-editor--loading" aria-hidden />;
  }

  return (
    <div className="news-events-body-editor">
      <BodyEditorToolbar editor={editor} />
      <EditorContent editor={editor} className="news-events-body-editor__content" />
    </div>
  );
}
