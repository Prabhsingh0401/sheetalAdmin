'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getSettings, updateSettings } from '../../../services/settingsService';
import toast from 'react-hot-toast';
import { Loader2, Save, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

const createId = () => Math.random().toString(36).substr(2, 9);

// --- Sortable Link Item ---
const SortableLinkItem = ({ id, link, onUpdate, hidden }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-2 mb-2 p-2 bg-[#102a20] rounded border border-white/10 ${hidden ? 'opacity-50 grayscale' : ''}`}
        >
            <div {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-white px-2">
                ⋮⋮
            </div>
            <input
                type="text"
                value={link.label}
                onChange={(e) => onUpdate(id, 'label', e.target.value)}
                className="flex-1 bg-transparent text-[#b3a660] text-sm focus:outline-none"
                placeholder="Label"
            />

            <button
                type="button"
                onClick={() => onUpdate(id, 'hidden', !hidden)}
                className="p-1 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title={hidden ? "Unhide" : "Hide"}
            >
                {hidden ? <EyeOff size={14} className="text-red-400" /> : <Eye size={14} className="text-emerald-400" />}
            </button>
        </div>
    );
};


// --- Footer Section (Column) Component ---
const FooterSectionEditor = ({ section, onUpdateSection, onRemoveSection }) => {

    // Links Handling
    const handleUpdateLink = (linkId, field, value) => {
        const newLinks = section.links.map(l => l.id === linkId ? { ...l, [field]: value } : l);
        onUpdateSection(section.id, { ...section, links: newLinks });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = section.links.findIndex((l) => l.id === active.id);
            const newIndex = section.links.findIndex((l) => l.id === over.id);
            onUpdateSection(section.id, { ...section, links: arrayMove(section.links, oldIndex, newIndex) });
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    return (
        <div className="bg-[#082722]/90 border border-[#f2bf42]/30 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <input
                    type="text"
                    value={section.title}
                    onChange={(e) => onUpdateSection(section.id, { ...section, title: e.target.value })}
                    className="bg-transparent text-lg font-semibold text-[#f2bf42] focus:outline-none w-full"
                    placeholder="Section Title"
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => onUpdateSection(section.id, { ...section, hidden: !section.hidden })}
                        title={section.hidden ? "Unhide Section" : "Hide Section"}
                    >
                        {section.hidden ? <EyeOff size={18} className="text-red-400" /> : <Eye size={18} className="text-emerald-400" />}
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={(section.links || []).map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {(section.links || []).map(link => (
                        <SortableLinkItem
                            key={link.id}
                            id={link.id}
                            link={link}
                            onUpdate={handleUpdateLink}
                            hidden={link.hidden}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};

// --- Main Footer Editor ---
const FooterLayoutEditor = () => {
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const initData = async () => {
            try {
                const settingsRes = await getSettings();

                let savedFooter = settingsRes.data?.footerLayout;

                const hasNavbarStructure = savedFooter &&
                    savedFooter.length > 0 &&
                    (savedFooter[0].hasOwnProperty('isDroppable') ||
                        savedFooter[0].hasOwnProperty('type'));

                if (!savedFooter || savedFooter.length === 0 || hasNavbarStructure) {
                    // Default Structure
                    savedFooter = [
                        {
                            id: createId(),
                            title: "Information",
                            hidden: false,
                            links: [
                                { id: createId(), label: "Our Story", href: "/about-us", hidden: false },
                                { id: createId(), label: "Blog", href: "/blog", hidden: false },
                                { id: createId(), label: "FAQ's", href: "/faq", hidden: false },
                                { id: createId(), label: "Contact us", href: "/contact-us", hidden: false },
                            ]
                        },
                        {
                            id: createId(),
                            title: "My Account / Orders",
                            hidden: false,
                            links: [
                                { id: createId(), label: "My Account", href: "/my-account", hidden: false },
                                { id: createId(), label: "Track Order", href: "/track-order", hidden: false },
                                { id: createId(), label: "Return Order", href: "/return-order", hidden: false },
                                { id: createId(), label: "Sitemap", href: "/sitemap", hidden: false },
                            ]
                        },
                        {
                            id: createId(),
                            title: "Quick Links",
                            hidden: false,
                            links: [
                                { id: createId(), label: "Privacy Policy", href: "/privacy-policy", hidden: false },
                                { id: createId(), label: "Return & Exchange Policy", href: "/returne-policy", hidden: false },
                                { id: createId(), label: "Shipping Policy", href: "/shipping-policy", hidden: false },
                                { id: createId(), label: "Terms of Use", href: "/terms-conditions", hidden: false },
                            ]
                        }
                    ];
                }
                setSections(savedFooter);
            } catch (error) {
                toast.error("Failed to load footer layout");
            } finally {
                setIsLoading(false);
            }
        };
        initData();
    }, []);

    const handleUpdateSection = (id, updatedSection) => {
        setSections(sections.map(s => s.id === id ? updatedSection : s));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({ footerLayout: sections });
            toast.success("Footer Layout Saved!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save footer layout");
        } finally {
            setIsSaving(false);
        }
    };



    if (isLoading) return <div className="p-8 text-center text-white"><Loader2 className="animate-spin inline mr-2" />Loading Footer Editor...</div>;

    return (
        <div className="w-full pb-10">
            <div className="flex justify-between items-center mb-6 px-4">
                <h2 className="text-xl text-black font-semibold">Footer Layout Editor</h2>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Footer
                </button>
            </div>

            <p className="px-4 text-sm text-gray-500 mb-6">
                Manage the links in your footer columns. Hide sections or individual links as needed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                {(sections || []).map(section => (
                    <FooterSectionEditor
                        key={section.id}
                        section={section}
                        onUpdateSection={handleUpdateSection}
                    />
                ))}
            </div>
        </div>
    );
};

export default FooterLayoutEditor;
