import { useState } from "react";

const METHODS = [["upi", "📲 UPI"], ["card", "💳 Debit / Credit Card"], ["netbanking", "🏦 Net Banking"], ["cash", "💵 Pay at counter / on delivery"]];

// Simulated payment step. Replace onPay with your gateway call (Razorpay etc.) when the backend is ready.
export default function PaymentModal({ title, amount, items = [], onPaid, onClose }) {
  const [m, setM] = useState("upi");
  const [f, setF] = useState({ upi: "", card: "", exp: "", cvv: "", bank: "SBI" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pay = (e) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      const ref = "TXN" + Math.floor(100000 + Math.random() * 900000);
      setDone(ref);
      setBusy(false);
    }, 900);
  };
  const finish = () => { onPaid({ method: m, ref: done }); };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Payment">
      <div className="modal-card">
        <div className="modal-header"><div><h3>{done ? "Payment successful" : "Choose payment option"}</h3><p className="sub" style={{ margin: 0 }}>{title}</p></div>
          {!done && <button className="ghost close-btn" onClick={onClose} aria-label="Close">✕</button>}</div>
        {done ? (
          <div style={{ textAlign: "center", padding: "22px 0" }}>
            <div style={{ fontSize: 46 }}>✅</div>
            <h2 style={{ margin: "6px 0" }}>₹{amount} {m === "cash" ? "to pay on arrival" : "paid"}</h2>
            <p className="sub">Reference: {done} · {METHODS.find((x) => x[0] === m)[1]}</p>
            <button className="primary" style={{ width: "100%" }} onClick={finish}>Done</button>
          </div>
        ) : (
          <form onSubmit={pay}>
            <div className="paysum">{items.map((i) => <div key={i[0]}><span>{i[0]}</span><b>₹{i[1]}</b></div>)}<div className="paytot"><span>Total payable</span><b>₹{amount}</b></div></div>
            <div className="paym">{METHODS.map(([k, l]) => <label key={k} className={m === k ? "on" : ""}><input type="radio" name="pm" checked={m === k} onChange={() => setM(k)} />{l}</label>)}</div>
            {m === "upi" && <label>UPI ID<input required placeholder="name@bank" pattern=".+@.+" value={f.upi} onChange={set("upi")} /></label>}
            {m === "card" && (<>
              <label>Card number<input required inputMode="numeric" maxLength={19} placeholder="1234 5678 9012 3456" value={f.card} onChange={set("card")} /></label>
              <div className="grid2"><label>Expiry<input required placeholder="MM/YY" maxLength={5} value={f.exp} onChange={set("exp")} /></label><label>CVV<input required type="password" inputMode="numeric" maxLength={4} value={f.cvv} onChange={set("cvv")} /></label></div></>)}
            {m === "netbanking" && <label>Bank<select value={f.bank} onChange={set("bank")}>{["SBI", "HDFC", "ICICI", "Axis", "Kotak"].map((b) => <option key={b}>{b}</option>)}</select></label>}
            <button className="primary" style={{ width: "100%", marginTop: 18 }} disabled={busy}>{busy ? "Processing..." : m === "cash" ? "Confirm order" : `Pay ₹${amount}`}</button>
          </form>
        )}
      </div>
    </div>
  );
}
