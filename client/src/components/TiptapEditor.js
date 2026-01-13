"use client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, Heading2, Heading3, Undo, Redo } from "lucide-react";
import { useEffect } from 'react';

const TiptapEditor = ({ value, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
        ],
        content: value,
        immediatelyRender: false, 
        editorProps: {
            attributes: {
                // 'prose' class headings ko style dene ke liye zaroori hai
                class: 'prose prose-sm focus:outline-none min-h-[250px] p-4 bg-white border border-slate-400 rounded-b-lg max-w-none overflow-y-auto custom-editor',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Jab Edit mode mein initialData aaye, toh editor update ho jaye
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "");
        }
    }, [value, editor]);

    if (!editor) {
        return <div className="min-h-[250px] w-full bg-slate-50 border border-slate-400 rounded-lg animate-pulse" />;
    }

    const btnClass = (active) => 
        `p-2 rounded transition ${active ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-700'}`;

    return (
        <div className="w-full text-left border rounded-lg overflow-hidden border-slate-400 shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-slate-100 border-b border-slate-400 items-center">
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
                    <Heading2 size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))}>
                    <Heading3 size={18} />
                </button>
                
                <div className="w-[1px] h-6 bg-slate-300 mx-1" />

                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
                    <Bold size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
                    <Italic size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
                    <List size={18} />
                </button>

                <div className="w-[1px] h-6 bg-slate-300 mx-1 ml-auto" />

                <button type="button" onClick={() => editor.chain().focus().undo().run()} className="p-2 rounded hover:bg-slate-200"><Undo size={18} /></button>
                <button type="button" onClick={() => editor.chain().focus().redo().run()} className="p-2 rounded hover:bg-slate-200"><Redo size={18} /></button>
            </div>

            {/* Editor Area */}
            <EditorContent editor={editor} />

            <style jsx global>{`
                .custom-editor h2 { font-size: 1.5rem !important; font-weight: 700 !important; margin-bottom: 10px !important; display: block !important; }
                .custom-editor h3 { font-size: 1.25rem !important; font-weight: 600 !important; margin-bottom: 8px !important; display: block !important; }
                .custom-editor ul { list-style-type: disc !important; padding-left: 20px !important; margin-bottom: 10px !important; }
                .custom-editor p { margin-bottom: 8px !important; }
                .custom-editor strong { font-weight: bold !important; }
            `}</style>
        </div>
    );
};

export default TiptapEditor;