"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
import { useToast } from "@/app/context/toast-context";

interface MenuItem {
  id: number;
  name: string;
  price: string;
}

interface OrderResponse {
  id: number;
  order_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items: Array<{
    id: number;
    menu_id: number;
    name: string;
    quantity: number;
    price: number;
    total?: number;
  }>;
}

export default function AdminCreateOrderEntryPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuNameMap, setMenuNameMap] = useState<Map<number, string>>(new Map());
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null);
  const [showPrintButton, setShowPrintButton] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // Manual print function
  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) {
      showToast("No receipt to print", "error");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt_${lastOrder?.order_number || "order"}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                margin: 0; 
                padding: 20px;
                background: white;
              }
              .receipt { 
                max-width: 300px; 
                margin: 0 auto;
                background: white;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchMenus();
  }, []);

  async function fetchMenus() {
    try {
      const res = await api.get("/menus");
      setMenus(res.data);
      
      const map = new Map<number, string>();
      res.data.forEach((menu: MenuItem) => {
        map.set(menu.id, menu.name);
      });
      setMenuNameMap(map);
    } catch (err: any) {
      showToast("Failed to load menus", "error");
      setMessage("Failed to load menus");
    }
  }

  function addToCart(menu: MenuItem) {
    const price = Number(menu.price);

    setCart((prev) => {
      const existing = prev.find((c) => c.menu_id === menu.id);

      if (existing) {
        return prev.map((c) =>
          c.menu_id === menu.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }

      return [
        ...prev,
        {
          menu_id: menu.id,
          name: menu.name,
          price: price,
          quantity: 1,
        },
      ];
    });
    showToast(`Added ${menu.name} to cart`, "success");
  }

  function updateQuantity(menu_id: number, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((c) => c.menu_id !== menu_id);
      }
      return prev.map((c) => (c.menu_id === menu_id ? { ...c, quantity } : c));
    });
  }

  async function clearCart() {
    if (cart.length === 0) {
      showToast("Cart is already empty", "info");
      return;
    }

    const confirmed = await showModal(
      "Clear Cart",
      "Are you sure you want to clear all items from your cart?",
      "warning"
    );

    if (confirmed) {
      setCart([]);
      showToast("Cart cleared successfully", "success");
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function submitOrder() {
    if (loading) return;
    if (cart.length === 0) {
      showModal("Empty Cart", "Your cart is empty. Please add items before submitting.", "warning");
      return;
    }

    const confirmed = await showModal(
      "Confirm Order",
      `Are you sure you want to submit this order?\n\nTotal: KES ${total.toLocaleString()}`,
      "warning"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    setErrorMessage(null);
    setShowPrintButton(false);

    try {
      const idempotencyKey = `${Date.now()}-${Math.random()}`;

      const res = await api.post("/orders", {
        idempotency_key: idempotencyKey,
        items: cart.map((c) => ({
          menu_id: c.menu_id,
          quantity: c.quantity,
          price: c.price,
        })),
      });

      setMessage(res.data.message);
      showToast(res.data.message, "success");
      
      // Store the created order for receipt printing with calculated totals
      if (res.data.order) {
        const orderWithTotals = {
          ...res.data.order,
          items: res.data.order.items.map((item: any) => ({
            ...item,
            total: item.total || (item.price * item.quantity)
          }))
        };
        setLastOrder(orderWithTotals);
        setShowPrintButton(true);
      }
      
      setCart([]);

      // Ask if user wants to print immediately
      const printReceipt = await showModal(
        "Order Successful!",
        `Order #${res.data.order?.order_number || "N/A"} created successfully!\n\nWould you like to print the receipt now?`,
        "info"
      );

      if (printReceipt) {
        setTimeout(() => {
          handlePrint();
        }, 100);
      }

    } catch (err: any) {
      const res = err.response?.data;
      let errorLines: string[] = [];

      // Check for ingredient-level stock errors (new format from updated backend)
      if (res?.stock_errors?.length && res?.error_type === 'ingredient_shortage') {
        // Group errors by menu
        const errorsByMenu: { [key: string]: any[] } = {};
        res.stock_errors.forEach((err: any) => {
          if (!errorsByMenu[err.menu_name]) {
            errorsByMenu[err.menu_name] = [];
          }
          errorsByMenu[err.menu_name].push(err);
        });
        
        errorLines.push(`❌ Cannot prepare order - Insufficient ingredients:\n`);
        
        Object.keys(errorsByMenu).forEach(menuName => {
          errorLines.push(`\n📋 ${menuName}:`);
          errorsByMenu[menuName].forEach(err => {
            errorLines.push(`   • ${err.ingredient_name}: Need ${err.required_quantity} ${err.unit}, Only ${err.available_quantity} ${err.unit} available`);
          });
        });
        
        errorLines.push(`\n💡 Please restock ingredients before ordering these items.`);
      } 
      // Check for detailed stock errors (array of objects)
      else if (res?.stock_errors?.length && typeof res.stock_errors[0] === 'object') {
        // Group by menu name
        const errorsByMenu: { [key: string]: any[] } = {};
        res.stock_errors.forEach((err: any) => {
          const menuName = err.menu_name || 'Unknown Item';
          if (!errorsByMenu[menuName]) {
            errorsByMenu[menuName] = [];
          }
          errorsByMenu[menuName].push(err);
        });
        
        errorLines.push(`❌ Insufficient stock for ingredients:\n`);
        
        Object.keys(errorsByMenu).forEach(menuName => {
          errorLines.push(`\n📋 ${menuName}:`);
          errorsByMenu[menuName].forEach(err => {
            const ingredientName = err.ingredient_name || 'Ingredient';
            const required = err.required_quantity || err.required;
            const available = err.available_quantity || err.available;
            const unit = err.unit || 'units';
            errorLines.push(`   • ${ingredientName}: Need ${required} ${unit}, Only ${available} ${unit} available`);
          });
        });
      } 
      // Old format (array of IDs) - backward compatibility
      else if (res?.stock_errors?.length && Array.isArray(res.stock_errors) && typeof res.stock_errors[0] !== 'object') {
        const stockErrorsWithNames = res.stock_errors.map((errorId: string | number) => {
          const numericId = Number(errorId);
          const cartItem = cart.find(item => item.menu_id === numericId);
          if (cartItem) {
            return cartItem.name;
          }
          return menuNameMap.get(numericId) || `Item ID: ${errorId}`;
        });
        
        const uniqueItems = [...new Set(stockErrorsWithNames)];
        
        if (uniqueItems.length === 1) {
          errorLines.push(`❌ Insufficient stock for: ${uniqueItems[0]}`);
        } else {
          errorLines.push(`❌ Insufficient stock for the following items:\n${uniqueItems.map(name => `   • ${name}`).join("\n")}`);
        }
      } 
      else if (res?.message) {
        errorLines.push(res.message);
      } 
      else {
        errorLines.push("Order creation failed");
      }

      const errorMsg = errorLines.join("\n");
      setErrorMessage(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1
            className={`text-3xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Create Order
          </h1>
          <p
            className={`text-sm mt-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Select menu items to create a new order
          </p>
        </div>

        <div className="flex gap-3">
          {/* Print Button - Only shows after order is created */}
          {showPrintButton && lastOrder && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
          )}
          
          <button
            onClick={() => router.push("/admin/orders")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-md"
          >
            View Orders
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-400 dark:border-green-700 rounded-lg">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-400 dark:border-red-700 rounded-lg whitespace-pre-line">
          {errorMessage}
        </div>
      )}

      {/* MENU CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => addToCart(menu)}
            disabled={loading}
            className={`rounded-xl p-4 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                : "bg-white hover:bg-gray-50 text-gray-900 shadow"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="font-bold text-lg">{menu.name}</div>
            <div className={`text-sm mt-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              KES {Number(menu.price).toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      {/* CART SECTION */}
      <div
        className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Cart
          </h2>
          {cart.length > 0 && (
            <span
              className={`text-sm px-2 py-1 rounded-full ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {cart.length} {cart.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {cart.length === 0 ? (
          <div
            className={`text-center py-12 ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 15v6"
              />
            </svg>
            <p>No items added to cart</p>
            <p className="text-sm mt-1">Click on menu items above to add</p>
          </div>
        ) : (
          <>
            {/* Cart Header */}
            <div
              className={`grid grid-cols-3 gap-4 pb-2 mb-2 text-sm font-semibold border-b ${
                theme === "dark"
                  ? "border-gray-700 text-gray-400"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <div>Item</div>
              <div className="text-center">Quantity</div>
              <div className="text-right">Subtotal</div>
            </div>

            {/* Cart Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.menu_id}
                  className={`grid grid-cols-3 gap-4 items-center p-2 rounded-lg transition-colors ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <div
                      className={`font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {item.name}
                    </div>
                    <div
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      KES {item.price.toLocaleString()} each
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.menu_id, item.quantity - 1)
                        }
                        disabled={loading}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                          theme === "dark"
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        } disabled:opacity-50`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.menu_id, Number(e.target.value))
                        }
                        className={`w-16 text-center rounded border px-2 py-1 ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        disabled={loading}
                        min="1"
                      />
                      <button
                        onClick={() =>
                          updateQuantity(item.menu_id, item.quantity + 1)
                        }
                        disabled={loading}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                          theme === "dark"
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        } disabled:opacity-50`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div
                    className={`text-right font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    KES {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div
              className={`mt-4 pt-4 border-t ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">Total</span>
                <span
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  KES {total.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={submitOrder}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Submit Order"
                  )}
                </button>

                <button
                  onClick={clearCart}
                  disabled={loading || cart.length === 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden Receipt Component for Printing */}
      <div className="hidden">
        <div ref={receiptRef} className="p-6 bg-white w-96 font-mono">
          {lastOrder && lastOrder.items ? (
            <>
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="font-bold text-xl">🍽️ i-MENU</h2>
                <p className="text-xs">Restaurant Management System</p>
                <div className="border-t border-dashed my-2"></div>
              </div>

              {/* Order Info */}
              <div className="text-xs mb-3">
                <p><strong>Receipt #:</strong> {lastOrder.order_number}</p>
                <p><strong>Date:</strong> {new Date(lastOrder.created_at).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(lastOrder.created_at).toLocaleTimeString()}</p>
              </div>

              <div className="border-t border-dashed my-2"></div>

              {/* Items Header */}
              <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                <div className="col-span-2">Item</div>
                <div className="text-center">Qty</div>
                <div className="text-right">Total</div>
              </div>

              <div className="border-t border-dashed my-1"></div>

              {/* Items List */}
              {lastOrder.items.map((item) => {
                const itemTotal = item.total || (item.price * item.quantity);
                return (
                  <div key={item.id} className="grid grid-cols-4 gap-1 text-xs mb-1">
                    <div className="col-span-2">{item.name}</div>
                    <div className="text-center">{item.quantity}</div>
                    <div className="text-right">KES {itemTotal.toLocaleString()}</div>
                  </div>
                );
              })}

              <div className="border-t border-dashed my-2"></div>

              {/* Total */}
              <div className="flex justify-between text-sm font-bold">
                <span>TOTAL</span>
                <span>KES {(lastOrder.total_amount || 0).toLocaleString()}</span>
              </div>

              <div className="border-t border-dashed my-2"></div>

              {/* Footer */}
              <div className="text-center text-xs mt-4">
                <p>Thank you for dining with us!</p>
                <p className="text-[10px] mt-1">Valid for exchange within 7 days</p>
              </div>
            </>
          ) : (
            <div className="text-center p-4">Loading receipt...</div>
          )}
        </div>
      </div>
    </div>
  );
}