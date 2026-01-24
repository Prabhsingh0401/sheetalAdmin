// app/(panel)/admin/size-chart/page.js
"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import SizeChartModal from "@/components/admin/size-chart/SizeChartModal";
import HowToMeasureModal from "@/components/admin/size-chart/HowToMeasureModal";
import { getSizeChart, addSize, updateSize, deleteSize } from "@/services/sizeChartService";
import { Edit, Trash2, Save, X, Plus, Image as ImageIcon } from "lucide-react";
import { IMAGE_BASE_URL } from "@/services/api";
import toast from "react-hot-toast";

export default function SizeChartPage() {
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isHowToMeasureModalOpen, setIsHowToMeasureModalOpen] = useState(false);
  const [sizeChart, setSizeChart] = useState({ table: [] , howToMeasureImage: null });
  const [editableRow, setEditableRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSizeChart = async () => {
    setLoading(true);
    try {
      const data = await getSizeChart();
      setSizeChart(data.data);
      toast.success("Size chart loaded successfully!");
    } catch (error) {
      console.error("Failed to fetch size chart", error);
      toast.error("Failed to load size chart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizeChart();
  }, []);

  const handleAddSize = (newSizeChart) => {
    setSizeChart(newSizeChart);
    setIsSizeModalOpen(false);
    toast.success("Size added successfully!");
  };

  const handleEdit = (id) => {
    setEditableRow(id);
    setEditedData(sizeChart.table.find((row) => row._id === id));
  };

  const handleCancel = () => {
    setEditableRow(null);
    setEditedData({});
  };

  const handleSave = async () => {
    try {
      const data = await updateSize(editedData._id, editedData);
      setSizeChart(data.data);
      setEditableRow(null);
      setEditedData({});
      toast.success("Size updated successfully!");
    } catch (error) {
      console.error("Failed to save size", error);
      toast.error("Failed to update size.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const data = await deleteSize(id);
      setSizeChart(data.data);
      toast.success("Size deleted successfully!");
    } catch (error) {
      console.error("Failed to delete size", error);
      toast.error("Failed to delete size.");
    }
  };

  const handleChange = (e, field) => {
    setEditedData((prevData) => ({ ...prevData, [field]: e.target.value }));
  };

  const handleHowToMeasureSuccess = (newSizeChart) => {
    setSizeChart(newSizeChart);
    setIsHowToMeasureModalOpen(false);
    toast.success("How to measure image updated successfully!");
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Size Chart"
        subtitle="Manage the size chart for your products"
      />
      <div className="flex justify-end gap-4 mb-8">
        <button
          onClick={() => setIsSizeModalOpen(true)}
          className="whitespace-nowrap w-fit px-4 py-2 md:px-5 md:py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-[13px] md:text-sm shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="inline-block">Add New Size</span>
        </button>
        <button
          onClick={() => setIsHowToMeasureModalOpen(true)}
          className="whitespace-nowrap w-fit px-4 py-2 md:px-5 md:py-2.5 bg-gray-600 text-white rounded-lg font-semibold text-[13px] md:text-sm shadow-md shadow-gray-100 hover:bg-gray-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
        >
          <ImageIcon size={16} strokeWidth={2.5} />
          <span className="inline-block">How to Measure</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Size</th>
                <th scope="col" className="px-6 py-3">Bust (in)</th>
                <th scope="col" className="px-6 py-3">Waist (in)</th>
                <th scope="col" className="px-6 py-3">Hip (in)</th>
                <th scope="col" className="px-6 py-3">Shoulder (in)</th>
                <th scope="col" className="px-6 py-3">Length (in)</th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.table.map((row) => (
                <tr key={row._id} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {editableRow === row._id ? (
                      <input type="text" value={editedData.label} onChange={(e) => handleChange(e, 'label')} className="w-20 px-2 py-1 border rounded-md" />
                    ) : (
                      row.label
                    )}
                  </th>
                  <td className="px-6 py-4">
                    {editableRow === row._id ? (
                      <input type="text" value={editedData.bust} onChange={(e) => handleChange(e, 'bust')} className="w-20 px-2 py-1 border rounded-md" />
                    ) : (
                      row.bust
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editableRow === row._id ? (
                      <input type="text" value={editedData.waist} onChange={(e) => handleChange(e, 'waist')} className="w-20 px-2 py-1 border rounded-md" />
                    ) : (
                      row.waist
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editableRow === row._id ? (
                      <input type="text" value={editedData.hip} onChange={(e) => handleChange(e, 'hip')} className="w-20 px-2 py-1 border rounded-md" />
                    ) : (
                      row.hip
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editableRow === row._id ? (
                      <input type="text" value={editedData.shoulder} onChange={(e) => handleChange(e, 'shoulder')} className="w-20 px-2 py-1 border rounded-md" />
                    ) : (
                      row.shoulder
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editableRow === row._id ? (
                      <input type="text" value={editedData.length} onChange={(e) => handleChange(e, 'length')} className="w-20 px-2 py-1 border rounded-md" />
                    ) : (
                      row.length
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      {editableRow === row._id ? (
                        <>
                          <button onClick={handleSave} className="font-medium text-green-600 hover:text-green-800">
                            <Save size={18} />
                          </button>
                          <button onClick={handleCancel} className="font-medium text-red-600 hover:text-red-800">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(row._id)} className="font-medium text-indigo-600 hover:text-indigo-800">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(row._id)} className="font-medium text-red-600 hover:text-red-800">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SizeChartModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        onSuccess={handleAddSize}
      />
      <HowToMeasureModal
        isOpen={isHowToMeasureModalOpen}
        onClose={() => setIsHowToMeasureModalOpen(false)}
        onSuccess={handleHowToMeasureSuccess}
        currentImage={sizeChart.howToMeasureImage ? `${IMAGE_BASE_URL}/${sizeChart.howToMeasureImage.startsWith('/') ? sizeChart.howToMeasureImage.substring(1) : sizeChart.howToMeasureImage}` : null}
      />
    </div>
  );
}
