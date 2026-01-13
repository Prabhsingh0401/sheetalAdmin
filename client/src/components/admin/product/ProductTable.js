"use client";

import { useEffect, useState, useMemo } from "react";
import { Eye, Edit3, Trash2, ArrowUpDown, Search, RefreshCw, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

import ProductModal from "./ProductModal";
import ViewProductDrawer from "./ViewProductDrawer";
import DeleteConfirmModal from "../common/DeleteConfirmModal";

import { getProducts, deleteProduct } from "@/services/productService";
import { IMAGE_BASE_URL } from "@/services/api";

export default function ProductTable({ refreshStats }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (isRefresh = false) => {
    setLoading(true);
    try {
      // Products fetch logic - Sending params as per your service
      const res = await getProducts(1, 100, ""); 
      
      if (res.success) {
        // FIX: Product service usually returns res.products or res.data.products
        const dataToSet = res.products || res.data?.products || [];
        setProducts(dataToSet);
        
        if (refreshStats) refreshStats();
        if (isRefresh) toast.success("Inventory synchronized!");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const loadingToast = toast.loading("Deleting product...");
    try {
      const res = await deleteProduct(deleteId);
      if (res.success) {
        fetchProducts();
        toast.success("Product deleted successfully", { id: loadingToast });
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
    return products
      .filter((p) => {
        const searchMatch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toLowerCase());

        const currentStatus = p.stock > 0 ? "Active" : "Inactive";
        const statusMatch = statusFilter === "All" || currentStatus === statusFilter;

        return searchMatch && statusMatch;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [products, search, statusFilter, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, rowsPerPage]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm text-slate-900 overflow-hidden">

      {/* Toolbar - EXACT COPY OF CATEGORY */}
      <div className="p-4 flex justify-between items-center gap-4 border-b border-slate-100">
        <div className="flex gap-3 flex-1 items-center">
          <div className="relative max-w-md w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-200 outline-none"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border border-slate-300 rounded px-3 py-2 text-sm font-bold text-slate-700 bg-white outline-none cursor-pointer hover:border-slate-400 transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Stock</option>
            <option value="Active">In Stock</option>
            <option value="Inactive">Out of Stock</option>
          </select>

          <button
            onClick={() => fetchProducts(true)}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <button
          onClick={() => { setEditData(null); setShowModal(true); }}
          className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded text-sm font-bold transition-all shadow-sm active:scale-95"
        >
          + Add Product
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-4 py-4 w-12 text-center">#</th>
              <th className="px-4 py-4 w-16 text-center">Image</th>
              <th className="px-4 py-4 cursor-pointer group" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-1">Product Details <ArrowUpDown size={14} className="opacity-50 group-hover:opacity-100" /></div>
              </th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Stock</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((p, i) => (
                <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 text-slate-500 font-medium text-center">
                    {(currentPage - 1) * rowsPerPage + i + 1}
                  </td>

                  <td className="px-4 py-4">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() => { setViewProduct(p); setShowDrawer(true); }}>
                      {p.images?.[0]?.url ? (
                        <img
                          src={`${IMAGE_BASE_URL}/${p.images[0].url.replace(/\\/g, '/')}`.replace(/([^:]\/)\/+/g, "$1")}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-slate-300" />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">SKU: {p.sku || 'N/A'}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {p.category?.name || <span className="text-slate-400 text-xs italic">Uncategorized</span>}
                  </td>

                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.stock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                      {p.stock > 0 ? `${p.stock} In Stock` : "Out of Stock"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-4 text-slate-400">
                      <button title="View" className="hover:text-slate-900 transition-colors" onClick={() => { setViewProduct(p); setShowDrawer(true); }}>
                        <Eye size={18} />
                      </button>
                      <button title="Edit" className="hover:text-blue-600 transition-colors" onClick={() => { setEditData(p); setShowModal(true); }}>
                        <Edit3 size={18} />
                      </button>
                      <button title="Delete" className="hover:text-rose-600 transition-colors" onClick={() => { setDeleteId(p._id); setShowDeleteModal(true); }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-20 text-center text-slate-500 font-medium italic">
                  {loading ? "Syncing data..." : "No products found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer - EXACT COPY OF CATEGORY */}
      <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1 px-2 rounded-md outline-none cursor-pointer"
          >
            {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="text-[11px] font-medium text-slate-500">
            {filteredData.length > 0 ? (
              <>Showing <span className="font-bold text-slate-900">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of <span className="font-bold text-slate-900">{filteredData.length}</span> results</>
            ) : "No results found"}
          </div>

          <div className="flex items-center gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50 shadow-sm transition-colors">
              <ChevronLeft size={16} className="text-slate-600" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-slate-900 text-white shadow-md" : "bg-white border border-slate-100 text-slate-500 hover:border-slate-300"}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50 shadow-sm transition-colors">
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      <ProductModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={fetchProducts} initialData={editData} />
      <ViewProductDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} product={viewProduct} />
      <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} />
    </div>
  );
}