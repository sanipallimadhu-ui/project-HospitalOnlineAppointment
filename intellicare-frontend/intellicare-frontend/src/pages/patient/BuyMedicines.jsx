import PaymentModal from "../../components/PaymentModal";
import { useState } from "react";
import { useApp } from "../../context/AppContext";
import Empty from "../../components/Empty";

const MEDICINES_CATALOG = [
  { id: "m1", name: "Paracetamol 650mg", category: "Pain & Fever", desc: "Fast relief for fever, headache, body aches", price: 35, unit: "Strip of 15 tablets" },
  { id: "m2", name: "Amoxicillin & Clavulanic 625mg", category: "Antibiotics", desc: "Broad-spectrum antibacterial treatment", price: 210, unit: "Strip of 10 tablets" },
  { id: "m3", name: "Cetirizine 10mg", category: "Allergy & Cold", desc: "Non-drowsy relief for running nose, sneezing & allergy", price: 30, unit: "Strip of 10 tablets" },
  { id: "m4", name: "Pantoprazole 40mg", category: "Acidity & Digestion", desc: "Long-lasting acidity and heartburn prevention", price: 85, unit: "Strip of 10 tablets" },
  { id: "m5", name: "Metformin 500mg", category: "Diabetes", desc: "Maintains healthy blood sugar levels", price: 60, unit: "Strip of 20 tablets" },
  { id: "m6", name: "Atorvastatin 20mg", category: "Heart & Cholesterol", desc: "Manages LDL cholesterol and cardiovascular health", price: 140, unit: "Strip of 15 tablets" },
  { id: "m7", name: "Vitamin C + Zinc Chewable", category: "Immunity", desc: "Boosts immune defense & daily vitality", price: 95, unit: "Bottle of 30 chewables" },
  { id: "m8", name: "ORS Hydration Salt Electrolyte", category: "Digestion", desc: "WHO formula oral rehydration salt", price: 45, unit: "Pack of 5 sachets" },
  { id: "m9", name: "Multivitamin Daily Gold", category: "Immunity", desc: "Essential 24 vitamins & minerals daily supplement", price: 180, unit: "Bottle of 30 tablets" },
  { id: "m10", name: "Herbal Cough & Sore Throat Syrup", category: "Allergy & Cold", desc: "Soothes dry cough, throat irritation & congestion", price: 115, unit: "100ml bottle" },
];

const CATEGORIES = ["All", "Pain & Fever", "Antibiotics", "Allergy & Cold", "Acidity & Digestion", "Diabetes", "Heart & Cholesterol", "Immunity"];

export default function BuyMedicines() {
  const { user, medicineOrders, buyMedicines } = useApp();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState({}); // { [medId]: qty }
  const [address, setAddress] = useState(user?.address || "142 Hospital Road, Bangalore");
  const [activeTab, setActiveTab] = useState("store"); // 'store' | 'orders'

  const myOrders = medicineOrders.filter((o) => o.patientId === user?.id);

  const filtered = MEDICINES_CATALOG.filter((m) => {
    const matchesCat = cat === "All" || m.category === cat;
    const matchesQ = m.name.toLowerCase().includes(q.toLowerCase()) || m.desc.toLowerCase().includes(q.toLowerCase());
    return matchesCat && matchesQ;
  });

  const cartItems = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const med = MEDICINES_CATALOG.find((m) => m.id === id);
      return { ...med, qty };
    });

  const cartTotal = cartItems.reduce((acc, it) => acc + it.price * it.qty, 0);

  const updateQty = (id, delta) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const [paying, setPaying] = useState(false);
  const handleCheckout = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setPaying(true);
  };
  const placeOrder = () => {
    setPaying(false);
    buyMedicines({
      items: cartItems.map((it) => ({ id: it.id, name: it.name, price: it.price, qty: it.qty })),
      address,
      total: cartTotal,
    });
    setCart({});
    setActiveTab("orders");
  };

  return (
    <>
      {paying && <PaymentModal title={`Pharmacy order · ${cartItems.length} item(s)`} amount={cartTotal} items={cartItems.map((i) => [`${i.name} × ${i.qty}`, i.price * i.qty])} onClose={() => setPaying(false)} onPaid={placeOrder} />}
      <section className="hero" style={{ background: "linear-gradient(110deg,#0a4450,#0f7468 65%,#12a594)" }}>
        <h1>Hospital Pharmacy & Medicine Store</h1>
        <p>Order genuine prescribed medicines and wellness essentials with express hospital delivery.</p>
        <div className="search">
          <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            aria-label="Search medicines"
            placeholder="Search medicine by brand, salt, or symptoms..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </section>

      <div className="seg" style={{ marginBottom: 18 }}>
        <button className={activeTab === "store" ? "on" : ""} onClick={() => setActiveTab("store")}>
          💊 Browse Pharmacy Store
        </button>
        <button className={activeTab === "orders" ? "on" : ""} onClick={() => setActiveTab("orders")}>
          📦 My Medicine Orders ({myOrders.length})
        </button>
      </div>

      {activeTab === "store" && (
        <div className="store-layout">
          <div className="meds-list">
            <h2 className="listh" style={{ margin: "0 0 12px" }}>Available Medicines ({filtered.length})</h2>
            <div className="dgrid">
              {filtered.map((m) => {
                const qty = cart[m.id] || 0;
                return (
                  <div className="dcard med-card" key={m.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <span className="badge" style={{ fontSize: 11, marginBottom: 4, display: "inline-block" }}>{m.category}</span>
                        <h3 style={{ margin: "2px 0 4px", fontSize: 17 }}>{m.name}</h3>
                        <p className="sub" style={{ margin: 0, fontSize: 13 }}>{m.desc}</p>
                        <small style={{ color: "var(--muted)", display: "block", marginTop: 4 }}>{m.unit}</small>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--deep)" }}>₹{m.price}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                      {qty === 0 ? (
                        <button className="primary" style={{ padding: "7px 16px", fontSize: 13 }} onClick={() => updateQty(m.id, 1)}>
                          + Add to Cart
                        </button>
                      ) : (
                        <div className="qty-control">
                          <button className="ghost" onClick={() => updateQty(m.id, -1)} aria-label="Decrease quantity">−</button>
                          <span className="qty-num">{qty}</span>
                          <button className="ghost" onClick={() => updateQty(m.id, 1)} aria-label="Increase quantity">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="panel cart-panel">
            <h2>🛒 Your Medicine Cart</h2>
            {cartItems.length === 0 ? (
              <p className="sub" style={{ margin: "14px 0" }}>Your cart is empty. Add medicines from the catalog.</p>
            ) : (
              <form onSubmit={handleCheckout}>
                <div className="cart-items">
                  {cartItems.map((it) => (
                    <div className="row" key={it.id} style={{ padding: "8px 0" }}>
                      <div>
                        <strong>{it.name}</strong>
                        <div className="sub">₹{it.price} × {it.qty}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>₹{it.price * it.qty}</div>
                    </div>
                  ))}
                </div>

                <div className="row" style={{ borderTop: "2px dashed var(--line)", marginTop: 12, paddingTop: 12 }}>
                  <div><strong>Total Payable</strong><div className="sub">Free Hospital Express Delivery</div></div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--deep)" }}>₹{cartTotal}</div>
                </div>

                <label style={{ marginTop: 14 }}>
                  Delivery Address
                  <input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter delivery address" />
                </label>

                <button type="submit" className="primary" style={{ width: "100%", marginTop: 14 }}>
                  Place Order • ₹{cartTotal}
                </button>
                <p className="hint" style={{ textAlign: "center" }}>⚡ Estimated delivery to your doorstep in 2 hours.</p>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <section className="panel">
          <h2>My Past Medicine Orders</h2>
          {myOrders.length === 0 ? (
            <Empty title="No medicine orders yet">
              Browse the pharmacy catalog to place your first medicine order.
            </Empty>
          ) : (
            myOrders.map((o) => (
              <div className="row" key={o.id}>
                <div>
                  <span className="tk">{o.id}</span>
                  <strong>₹{o.total}</strong> on {o.date} at {o.time}
                  <div className="sub">
                    Items: {o.items?.map((it) => `${it.name} (${it.qty}x)`).join(", ")}
                  </div>
                  <div className="sub">📍 Deliver to: {o.address}</div>
                </div>
                <div className="acts">
                  <span className="badge in-consult">{o.status}</span>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </>
  );
}
