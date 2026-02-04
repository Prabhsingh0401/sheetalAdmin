"use client";

import React, { useState, useEffect, useRef } from "react";
import { getLowStockProducts } from "@/services/productService";
import { AlertTriangle, X } from "lucide-react";

interface LowStockSize {
  name: string;
  stock: number;
}

interface LowStockVariant {
  color: string;
  v_sku: string;
  sizes: LowStockSize[];
}

interface LowStockProduct {
  _id: string;
  name: string;
  mainImage: {
    url: string;
    alt: string;
  };
  lowStockVariants: LowStockVariant[];
}

const LowStockNotification: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const res = await getLowStockProducts();
        if (res.success) {
          setLowStockProducts(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLowStockProducts();
  }, []);

  if (loading || lowStockProducts.length === 0) return null;

  return (
    <div className="fixed top-20 right-10 z-50">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((p) => !p)}
        className="relative bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600"
      >
        <AlertTriangle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 bg-red-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {lowStockProducts.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[420px] bg-white rounded-xl shadow-2xl border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-semibold text-slate-800">Low Stock</p>
            <button className="cursor-pointer" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {lowStockProducts.map((product) => (
              <div key={product._id} className="p-4 border-b last:border-b-0">
                <div className="flex gap-4">
                  {product.mainImage?.url ? (
                    <img
                      src={product.mainImage.url}
                      alt={product.mainImage.alt || product.name}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400 border">
                      No image
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-2">
                      {product.name}
                    </p>

                    <div className="space-y-2">
                      {product.lowStockVariants.flatMap((variant) =>
                        variant.sizes.map((size) => (
                          <div
                            key={`${variant.v_sku}-${size.name}`}
                            className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm"
                          >
                            <div className="text-slate-600">
                              <span className="font-medium text-slate-800">
                                {size.name}
                              </span>
                              {" • "}
                              {variant.color}
                              {" • "}
                              {variant.v_sku}
                            </div>

                            <span
                              className={`font-semibold ${size.stock < 3
                                  ? "text-red-600"
                                  : "text-amber-700"
                                }`}
                            >
                              {size.stock}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockNotification;
