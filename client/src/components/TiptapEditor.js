"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import HardBreak from "@tiptap/extension-hard-break";
import {
  Bold,
  Italic,
  List,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect } from "react";

const TiptapEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-6 my-2",
          },
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-6 my-2",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "ml-2",
          },
        },
      }),
      Underline,
      HardBreak.configure({
        keepMarks: true,
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[250px] p-4 bg-white rounded-b-lg max-w-none overflow-y-auto",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === null || value === undefined) return;

    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[250px] w-full bg-slate-50 border border-slate-400 rounded-lg animate-pulse" />
    );
  }

  const btnClass = (active) =>
    `p-2 rounded transition ${
      active ? "bg-slate-900 text-white" : "hover:bg-slate-200 text-slate-700"
    }`;

  return (
    <div className="w-full text-left border rounded-lg overflow-hidden border-slate-400 shadow-sm">
      <div className="flex flex-wrap gap-1 p-2 bg-slate-100 border-b border-slate-400 items-center">
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 2 }))}
          aria-label="Heading 2"
        >
          <Heading2 size={18} />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 3 }))}
          aria-label="Heading 3"
        >
          <Heading3 size={18} />
        </button>

        <div className="w-[1px] h-6 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          aria-label="Bold"
        >
          <Bold size={18} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          aria-label="Italic"
        >
          <Italic size={18} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          aria-label="Underline"
        >
          <UnderlineIcon size={18} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          aria-label="Bullet List"
        >
          <List size={18} />
        </button>

        <div className="w-[1px] h-6 bg-slate-300 mx-1 ml-auto" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!editor.can().undo()}
          aria-label="Undo"
        >
          <Undo size={18} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!editor.can().redo()}
          aria-label="Redo"
        >
          <Redo size={18} />
        </button>
      </div>

      <EditorContent editor={editor} />

      {/* Add custom CSS for bullet lists */}
      <style jsx global>{`
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror li {
          margin-left: 0.5rem;
        }

        .ProseMirror li p {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
