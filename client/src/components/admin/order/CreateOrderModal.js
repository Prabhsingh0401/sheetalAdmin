"use client";

import { useState, useEffect } from "react";
import { X, Search, Plus, Trash2, MapPin, CreditCard, ShoppingBag, Loader2, Tag, Mail, User, Phone } from "lucide-react";
import { getProducts } from "@/services/productService";
import { createOrder } from "@/services/orderService";
import { toast } from "react-hot-toast";

export default function CreateOrderModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedItems, setSelectedItems] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [orderDiscount, setOrderDiscount] = useState(0);

    const [customerDetails, setCustomerDetails] = useState({
        email: "", fullName: "", phoneNumber: "", addressLine1: "", city: "", state: "", postalCode: ""
    });

    const [paymentMethod, setPaymentMethod] = useState("COD");

    useEffect(() => { if (isOpen) fetchProducts(); }, [isOpen]);

    const fetchProducts = async () => {
        try {
            const res = await getProducts(1, 1000);
            if (res.success) setProducts(res.products || res.data?.products || []);
        } catch (err) { toast.error("Products load fail"); }
    };

    const addItem = (product) => {
        const exist = selectedItems.find(x => x.product === product._id);
        if (exist && exist.quantity >= product.stock) return toast.error("Stock limit reached!");

        if (exist) {
            setSelectedItems(selectedItems.map(x => x.product === product._id ? { ...x, quantity: x.quantity + 1 } : x));
        } else {
            setSelectedItems([...selectedItems, {
                product: product._id,
                name: product.name,
                image: product.images[0]?.url || "",
                price: product.discountPrice || product.price,
                quantity: 1,
                maxStock: product.stock
            }]);
        }
    };

    const removeItem = (id) => setSelectedItems(selectedItems.filter(x => x.product !== id));

    const subTotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const finalTotal = Math.max(0, subTotal - orderDiscount);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) return toast.error("Cart खाली है!");

        setLoading(true);
        try {
            const orderData = {
                orderItems: selectedItems,
                shippingAddress: {
                    fullName: customerDetails.fullName,
                    phoneNumber: customerDetails.phoneNumber,
                    addressLine1: customerDetails.addressLine1,
                    city: customerDetails.city,
                    state: customerDetails.state, // State field added here
                    postalCode: customerDetails.postalCode,
                    country: "India"
                },
                userEmail: customerDetails.email,
                paymentInfo: { method: paymentMethod, status: "Pending" },
                itemsPrice: subTotal,
                totalPrice: finalTotal,
                discountPrice: orderDiscount,
                couponCode: couponCode,
                isCreatedByAdmin: true
            };

            const res = await createOrder(orderData);
            if (res.success) {
                toast.success("Order सफलतापूर्वक बन गया!");
                onSuccess(); onClose(); resetForm();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Order failed");
        } finally { setLoading(false); }
    };

    const resetForm = () => {
        setSelectedItems([]);
        setCustomerDetails({ email: "", fullName: "", phoneNumber: "", addressLine1: "", city: "", state: "", postalCode: "" });
        setOrderDiscount(0); setCouponCode("");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">

                {/* Header */}
                <div className="px-8 py-5 border-b flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-slate-900 rounded-full" />
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">New Manual Order</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inventory & Customer Management</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                    {/* Left: Product Selection */}
                    <div className="flex-[1.2] overflow-y-auto p-8 border-r border-slate-50 space-y-6 bg-white">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-100 outline-none transition-all" placeholder="Search by name or SKU..." onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                <div key={p._id} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-slate-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
                                            <img src={p.images[0]?.url} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{p.name}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">Stock: <span className="text-slate-600 font-bold">{p.stock}</span> | SKU: {p.sku || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-black text-slate-900">₹{p.discountPrice || p.price}</span>
                                        <button type="button" onClick={() => addItem(p)} className="p-2 bg-white border border-slate-200 text-slate-800 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Checkout & Customer Details */}
                    <div className="flex-1 bg-slate-50/40 p-8 overflow-y-auto border-l border-slate-100">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Customer Section */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-2"><User size={14} /> Customer Profile</h3>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 text-slate-300" size={16} />
                                        <input required type="email" className="order-input" placeholder="Email Address" value={customerDetails.email} onChange={e => setCustomerDetails({ ...customerDetails, email: e.target.value })} />
                                    </div>
                                    <input required className="order-input-no-icon" placeholder="Full Name" value={customerDetails.fullName} onChange={e => setCustomerDetails({ ...customerDetails, fullName: e.target.value })} />
                                    <input required className="order-input-no-icon" placeholder="Phone Number" value={customerDetails.phoneNumber} onChange={e => setCustomerDetails({ ...customerDetails, phoneNumber: e.target.value })} />
                                    <input required className="order-input-no-icon" placeholder="Shipping Address" value={customerDetails.addressLine1} onChange={e => setCustomerDetails({ ...customerDetails, addressLine1: e.target.value })} />

                                    {/* Yahan State add kiya hai 3 columns mein */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <input required className="order-input-no-icon" placeholder="City" value={customerDetails.city} onChange={e => setCustomerDetails({ ...customerDetails, city: e.target.value })} />
                                        <input required className="order-input-no-icon" placeholder="State" value={customerDetails.state} onChange={e => setCustomerDetails({ ...customerDetails, state: e.target.value })} />
                                        <input required className="order-input-no-icon" placeholder="Pin" value={customerDetails.postalCode} onChange={e => setCustomerDetails({ ...customerDetails, postalCode: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary & Coupon */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Order Summary</h3>

                                <div className="max-h-[150px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                    {selectedItems.map(item => (
                                        <div key={item.product} className="flex justify-between items-center text-xs">
                                            <span className="text-slate-600 font-medium">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold">₹{item.price * item.quantity}</span>
                                                <button type="button" onClick={() => removeItem(item.product)} className="text-slate-300 hover:text-rose-500"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Global Coupon Input */}
                                <div className="pt-4 border-t border-slate-50 space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apply Coupon / Discount</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag className="absolute left-3 top-2.5 text-slate-300" size={14} />
                                            <input className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-200" placeholder="Code" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                                        </div>
                                        <div className="relative w-24">
                                            <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">₹</span>
                                            <input type="number" className="w-full pl-6 pr-2 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-slate-200" placeholder="0" value={orderDiscount} onChange={e => setOrderDiscount(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Final Math */}
                                <div className="pt-4 space-y-2">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Subtotal</span>
                                        <span>₹{subTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                                        <span>Discount {couponCode && `(${couponCode})`}</span>
                                        <span>- ₹{orderDiscount}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2">
                                        <span>Total</span>
                                        <span>₹{finalTotal}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || selectedItems.length === 0}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl disabled:bg-slate-200 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Finalize & Place Order</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .order-input { width: 100%; padding: 0.85rem 1rem 0.85rem 2.5rem; background: white; border: 1px solid #f1f5f9; border-radius: 0.75rem; font-size: 0.85rem; outline: none; }
                .order-input-no-icon { width: 100%; padding: 0.85rem 1rem; background: white; border: 1px solid #f1f5f9; border-radius: 0.75rem; font-size: 0.85rem; outline: none; }
                .order-input:focus, .order-input-no-icon:focus { border-color: #cbd5e1; box-shadow: 0 0 0 4px rgba(0,0,0,0.02); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}