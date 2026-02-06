'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchAllCategories } from '../../../services/categoryService';
import { getSettings, saveNavbarLayout } from '../../../services/settingsService';
import toast from 'react-hot-toast';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';

// --- Types & Helpers ---
const createId = () => Math.random().toString(36).substr(2, 9);

// --- Sortable Item Component ---
const SortableItem = ({ id, data, level, onToggle, isOpen, childrenItems, children, onToggleHidden }) => {
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

  const hasChildren = childrenItems && childrenItems.length > 0;
  const isHidden = data.hidden;

  // Visual style matching the actual navbar
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`relative group ${level === 0 ? 'h-full flex items-center' : 'block border-b border-white/20 last:border-none'}`}
    >
      <div
        className={`
          flex items-center gap-2 cursor-move group/item
          ${level === 0
            ? 'px-[19px] py-[10px] text-[#b3a660] border-r border-[#f2bf42] text-[16px] tracking-[1px] hover:text-white transition-colors bg-[#082722]/90'
            : 'w-full py-2 text-[#b3a660] hover:text-[#aa8c6a] transition-colors justify-between'
          }
          ${isHidden ? 'opacity-50 grayscale' : ''}
        `}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          // If it has children, toggle visibility on click for editing
          if (hasChildren && !e.defaultPrevented) {
            e.preventDefault();
            onToggle(id);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span>{data.label}</span>
          {isHidden && <span className="text-[10px] bg-red-900/50 text-red-200 px-1 rounded ml-1">(Hidden)</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Visibility Toggle Button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()} // Prevent DnD start
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault(); // Prevent dropdown toggle
              onToggleHidden(id);
            }}
            className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover/item:opacity-100 focus:opacity-100"
            title={isHidden ? "Unhide" : "Hide"}
          >
            {isHidden ? <EyeOff size={14} className="text-red-400" /> : <Eye size={14} className="text-emerald-400" />}
          </button>

          {hasChildren && (
            <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              {level === 0 ? '▼' : '▼'}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isOpen && (
        <div
          className={`
             min-w-[200px] z-[100]
             ${level === 0
              ? 'absolute left-0 top-full pt-4'
              : 'pl-4 py-2 bg-[#102a20]'} 
           `}
        >
          {/* If level 0, we need the dropdown styling wrapper */}
          {level === 0 ? (
            <ul className="bg-[#153427]/95 backdrop-blur-md p-5 border border-[#f5de7e] list-none m-0 text-left">
              {children}
            </ul>
          ) : (
            <ul className="list-none m-0 text-left border-l border-white/20 pl-2">
              {children}
            </ul>
          )}
        </div>
      )}
    </li>
  );
};

// --- Recursive List Component ---
const SortableList = ({ items, level = 0, onItemsChange }) => {
  // We need to manage "open" state for dropdowns locally
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onItemsChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleToggleHidden = (id) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, hidden: !item.hidden };
      }
      return item;
    });
    onItemsChange(newItems);
  };

  // Updating children of a specific item
  const handleChildItemsChange = (parentId, newChildren) => {
    const newItems = items.map(item => {
      if (item.id === parentId) {
        return { ...item, children: newChildren };
      }
      return item;
    });
    onItemsChange(newItems);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Drag after movement to allow clicks
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(i => i.id)}
        strategy={level === 0 ? horizontalListSortingStrategy : verticalListSortingStrategy}
      >
        <ul className={level === 0 ? "m-0 p-0 list-none inline-flex items-center gap-0" : ""}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              data={item}
              level={level}
              isOpen={!!openItems[item.id]}
              onToggle={toggleItem}
              onToggleHidden={handleToggleHidden}
              childrenItems={item.children}
            >
              {item.children && item.children.length > 0 && (
                // Recursive Call
                <SortableList
                  items={item.children}
                  level={level + 1}
                  onItemsChange={(newChildren) => handleChildItemsChange(item.id, newChildren)}
                />
              )}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

// --- Main Editor Component ---
const NavbarLayoutEditor = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Get Saved Settings
        const settingsRes = await getSettings();
        let savedLayout = settingsRes.data?.navbarLayout;

        // 2. If no valid layout, build default from categories
        if (!savedLayout || savedLayout.length === 0) {
          const catRes = await fetchAllCategories();
          const categories = catRes.data || catRes.categories || (Array.isArray(catRes) ? catRes : []);

          const shopChildren = categories.map((cat) => ({
            id: createId(),
            label: cat.name,
            href: `/product-list?category=${cat.slug}`,
            children: (cat.subCategories || []).map(sub => ({
              id: createId(),
              label: sub,
              href: `/product-list?category=${cat.slug}&subCategory=${sub}`,
              children: []
            }))
          }));

          savedLayout = [
            { id: createId(), label: "Home", href: "/", children: [] },
            { id: createId(), label: "Shop", href: "#", children: shopChildren },
            { id: createId(), label: "Our Story", href: "/about-us", children: [] },
          ];
        }

        setItems(savedLayout);
      } catch (error) {
        console.error("Init Error", error);
        toast.error("Failed to load layout");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveNavbarLayout(items);
      toast.success("Navbar Layout Saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save navbar layout");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-white"><Loader2 className="animate-spin inline mr-2" />Loading Editor...</div>;

  return (
    <div className="w-full pb-10">
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="text-xl text-black font-semibold">Navbar Layout Editor</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Navbar
        </button>
      </div>

      <p className="px-4 text-sm text-gray-500 mb-6">
        Drag items to reorder. Click items with arrows (▼) to open/close their dropdowns and reorder sub-items.
        Hover over items to see the eye icon to hide/unhide them.
      </p>

      {/* Editor Surface */}
      <div className="bg-[#082722]/90 backdrop-blur-sm py-[25px] font-[family-name:var(--font-montserrat)] shadow-lg relative z-[1003]">
        <div className="container mx-auto px-4">
          <div className="flex justify-end items-center w-full">
            <div className="flex-1 flex justify-end items-center">
              <SortableList
                items={items}
                level={0}
                onItemsChange={setItems}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarLayoutEditor;