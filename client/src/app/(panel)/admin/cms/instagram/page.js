"use client";

import React, { useState, useEffect } from "react";
import {
  PlusSquare,
  Trash2,
  Loader2,
  Link,
  Images,
  Pencil,
  X,
  Check,
  Info,
  Instagram,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";

const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png";
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_CARDS = 5;

const validateImage = (file) =>
  new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return reject(`"${file.name}" must be JPG or PNG.`);
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(`Could not read "${file.name}".`);
    };
    img.src = objectUrl;
  });

export default function InstaCardForm() {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newFile, setNewFile] = useState(null);
  const [newPreview, setNewPreview] = useState(null);
  const [newLink, setNewLink] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editLink, setEditLink] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const atLimit = cards.length >= MAX_CARDS;

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/instacards`, {
        withCredentials: true,
      });
      if (data.success) setCards(data.cards);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cards");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await validateImage(file);
      setNewFile(file);
      setNewPreview(URL.createObjectURL(file));
    } catch (err) {
      toast.error(err, { duration: 4000 });
    }
    e.target.value = "";
  };

  const handleAdd = async () => {
    if (!newFile) return toast.error("Please select an image.");
    if (!newLink.trim()) return toast.error("Please enter a link.");

    setIsAdding(true);
    const formData = new FormData();
    formData.append("image", newFile);
    formData.append("link", newLink.trim());

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/instacards`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      if (data.success) {
        setCards((prev) => [...prev, data.card]);
        setNewFile(null);
        setNewPreview(null);
        setNewLink("");
        toast.success("Card added!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add card");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const { data } = await axios.delete(`${API_BASE_URL}/instacards/${id}`, {
        withCredentials: true,
      });
      if (data.success) {
        setCards((prev) => prev.filter((c) => c._id !== id));
        toast.success("Card deleted");
      }
    } catch (err) {
      toast.error("Failed to delete card");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (card) => {
    setEditingId(card._id);
    setEditLink(card.link);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditLink("");
  };

  const saveEdit = async (id) => {
    if (!editLink.trim()) return toast.error("Link cannot be empty.");
    setIsSavingEdit(true);
    try {
      const { data } = await axios.patch(
        `${API_BASE_URL}/instacards/${id}`,
        { link: editLink.trim() },
        { withCredentials: true },
      );
      if (data.success) {
        setCards((prev) => prev.map((c) => (c._id === id ? data.card : c)));
        setEditingId(null);
        toast.success("Link updated!");
      }
    } catch (err) {
      toast.error("Failed to update link");
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Image Spec Banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-black text-amber-800 uppercase tracking-wide">
            Image Requirements
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Images must be in <span className="font-bold">JPG or PNG</span>{" "}
            format. Recommended: 1080×1080px. Maximum of{" "}
            <span className="font-bold">{MAX_CARDS} cards</span> allowed.
          </p>
        </div>
      </div>

      {/* Add New Card / Limit Reached */}
      {atLimit ? (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
          <Info size={16} className="text-slate-400 shrink-0" />
          <div>
            <p className="text-xs font-black text-slate-600 uppercase tracking-wide">
              Limit Reached
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              You have{" "}
              <span className="font-bold">
                {MAX_CARDS} / {MAX_CARDS}
              </span>{" "}
              cards published. Delete a card to add a new one.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Add New Card
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Upload a square image and paste the Instagram post link.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  🖼 JPG · PNG
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Image picker */}
            <label className="shrink-0 cursor-pointer group">
              <div
                className={`w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden
                                ${newPreview ? "border-slate-400" : "border-slate-200 hover:border-slate-400 bg-slate-50"}`}
              >
                {newPreview ? (
                  <img
                    src={newPreview}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <>
                    <Images
                      size={24}
                      className="text-slate-300 group-hover:text-slate-400 transition-colors"
                      strokeWidth={1.5}
                    />
                    <span className="text-[9px] font-bold text-slate-300 group-hover:text-slate-400 mt-1 uppercase tracking-widest">
                      Pick Image
                    </span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={handleNewFileChange}
              />
            </label>

            {/* Link + Add button */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="relative">
                <Link
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://instagram.com/p/..."
                  className="w-full pl-8 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition placeholder:text-slate-300"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={isAdding || !newFile || !newLink.trim()}
                className="flex items-center justify-center gap-2 bg-slate-900 *: cursor-pointer hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full sm:w-auto"
              >
                {isAdding ? (
                  <Loader2 className="animate-spin" size={15} />
                ) : (
                  <PlusSquare size={15} />
                )}
                <span>{isAdding ? "Adding..." : "Add Card"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Instagram Cards
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {cards.length} / {MAX_CARDS} cards published
            </p>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Images size={40} strokeWidth={1} className="text-slate-300" />
            <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-slate-400">
              No cards yet
            </p>
            <p className="text-[9px] text-slate-300 mt-1">
              1:1 Square · JPG or PNG
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cards.map((card) => (
              <div
                key={card._id}
                className="group relative flex flex-col gap-2"
              >
                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 group-hover:border-slate-400 transition-colors shadow-sm relative">
                  <img
                    src={card.url}
                    alt={card.alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => handleDelete(card._id)}
                    disabled={deletingId === card._id}
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur text-rose-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-500 hover:text-white disabled:opacity-70"
                  >
                    {deletingId === card._id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} className="cursor-pointer" />
                    )}
                  </button>
                </div>

                {/* Inline link edit */}
                {editingId === card._id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="url"
                      value={editLink}
                      onChange={(e) => setEditLink(e.target.value)}
                      autoFocus
                      className="flex-1 min-w-0 text-[10px] bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <button
                      onClick={() => saveEdit(card._id)}
                      disabled={isSavingEdit}
                      className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                    >
                      {isSavingEdit ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Check size={11} />
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 rounded-lg bg-slate-200 text-slate-500 hover:bg-slate-300 transition"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(card)}
                    className="flex items-center gap-1.5 w-full text-left group/link"
                  >
                    <span className="text-[10px] text-slate-400 truncate flex-1 group-hover/link:text-slate-700 transition-colors">
                      {card.link}
                    </span>
                    <Pencil
                      size={10}
                      className="text-slate-300 group-hover/link:text-slate-500 shrink-0 transition-colors"
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
