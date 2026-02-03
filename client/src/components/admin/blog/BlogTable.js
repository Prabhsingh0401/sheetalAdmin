"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Eye,
  Edit3,
  Trash2,
  ArrowUpDown,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Newspaper,
} from "lucide-react";
import toast from "react-hot-toast";

import BlogModal from "./BlogModal";
import ViewBlogDrawer from "./ViewBlogDrawer";
import DeleteConfirmModal from "../common/DeleteConfirmModal";

import { getBlogs, deleteBlog } from "@/services/blogService";
import { IMAGE_BASE_URL } from "@/services/api";

export default function BlogTable({ refreshStats }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewBlog, setViewBlog] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async (isRefresh = false) => {
    setLoading(true);
    try {
      const res = await getBlogs(1, 100, "", "");
      if (res.success) {
        setBlogs(res.blogs);
        if (refreshStats) refreshStats();
        if (isRefresh) toast.success("Data synchronized!");
      }
    } catch (err) {
      toast.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const loadingToast = toast.loading("Deleting blog post...");
    try {
      const res = await deleteBlog(deleteId);
      if (res.success) {
        fetchBlogs();
        toast.success("Blog deleted successfully", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Failed to delete", { id: loadingToast });
    } finally {
      setDeleteId(null);
      setShowDeleteModal(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredData = useMemo(() => {
    return blogs
      .filter((b) => {
        const searchMatch =
          b.title?.toLowerCase().includes(search.toLowerCase()) ||
          b.category?.toLowerCase().includes(search.toLowerCase());
        const statusMatch = statusFilter === "All" || b.status === statusFilter;
        return searchMatch && statusMatch;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [blogs, search, statusFilter, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, rowsPerPage]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm text-slate-900 overflow-hidden">
      <div className="p-4 flex justify-between items-center gap-4 border-b border-slate-100">
        <div className="flex gap-3 flex-1 items-center">
          <div className="relative max-w-md w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-200 outline-none"
              placeholder="Search by title or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border border-slate-300 rounded px-3 py-2 text-sm font-bold text-slate-700 bg-white outline-none cursor-pointer hover:border-slate-400 transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            onClick={() => fetchBlogs(true)}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <button
          onClick={() => {
            setEditData(null);
            setShowModal(true);
          }}
          className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
        >
          <Newspaper size={16} /> + New Post
        </button>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-4 py-4 w-12 text-center">#</th>
              <th className="px-4 py-4 w-16">Banner</th>
              <th className="px-4 py-4 w-16">Content Img</th>
              <th
                className="px-4 py-4 cursor-pointer group"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1">
                  Title{" "}
                  <ArrowUpDown
                    size={14}
                    className="opacity-50 group-hover:opacity-100"
                  />
                </div>
              </th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Author</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((b, i) => (
                <tr
                  key={b._id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-4 text-slate-500 font-medium text-center">
                    {(currentPage - 1) * rowsPerPage + i + 1}
                  </td>

                  <td className="px-4 py-4">
                    <div className="w-12 h-8 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                      {b.bannerImage ? (
                        <img
                          src={`${IMAGE_BASE_URL}/${b.bannerImage.replace(/\\/g, "/")}`.replace(
                            /([^:]\/)\/+/g,
                            "$1",
                          )}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={14} className="text-slate-300" />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="w-12 h-8 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                      {b.contentImage ? (
                        <img
                          src={`${IMAGE_BASE_URL}/${b.contentImage.replace(/\\/g, "/")}`.replace(
                            /([^:]\/)\/+/g,
                            "$1",
                          )}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={14} className="text-slate-300" />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 max-w-[250px]">
                    <div
                      className="font-bold text-slate-900 truncate"
                      title={b.title}
                    >
                      {b.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter truncate">
                      {b.slug}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200 uppercase">
                      {b.category}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {b.author?.name || "Admin"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${b.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-4 text-slate-400">
                      <button
                        title="Preview"
                        className="hover:text-slate-900 transition-colors"
                        onClick={() => {
                          setViewBlog(b);
                          setShowDrawer(true);
                        }}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        title="Edit"
                        className="hover:text-blue-600 transition-colors"
                        onClick={() => {
                          setEditData(b);
                          setShowModal(true);
                        }}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        title="Delete"
                        className="hover:text-rose-600 transition-colors"
                        onClick={() => {
                          setDeleteId(b._id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="px-4 py-20 text-center text-slate-500 font-medium italic"
                >
                  {loading ? "Syncing blogs..." : "No blog posts found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Rows per page
          </span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1 px-2 rounded-md outline-none"
          >
            {[5, 10, 20, 50].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="text-[11px] font-medium text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-900">
              {(currentPage - 1) * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-900">
              {Math.min(currentPage * rowsPerPage, filteredData.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-900">
              {filteredData.length}
            </span>{" "}
            results
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-slate-900 text-white shadow-md" : "bg-white border border-slate-100 text-slate-500 hover:border-slate-300"}`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <BlogModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchBlogs}
        initialData={editData}
      />
      <ViewBlogDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        blog={viewBlog}
      />
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
