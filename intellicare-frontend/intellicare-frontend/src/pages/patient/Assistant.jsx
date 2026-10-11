import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { classify } from "../../services/assistant";
import Badge from "../../components/Badge";

export default function Assistant({ onContinue }) {
  const { doctors } = useApp();
  const [text, setText] = useState("");
  const [res, setRes] = useState(null);
  return (
    <section className="panel">
      <h2>Ask the assistant</h2>
      <p className="sub">Describe what you need in your own words. The assistant sorts your request by urgency and suggests a doctor. It does not diagnose.</p>
      <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: my child needs a vaccination next week" />
      <button className="primary" disabled={!text.trim()} onClick={async () => setRes(await classify(text, doctors))}>Check my request</button>
      {res && (
        <div className={`answer ${res.urgency}`}>
          <Badge status={res.urgency} priority={res.urgency} />
          <p>{res.message}</p>
          <p className="sub">{res.doctor ? `Suggested: ${res.doctor.name}, ${res.doctor.dept}` : "No matching department yet. You can choose any doctor."}</p>
          <button className="primary" onClick={() => onContinue({ doctorId: res.doctor?.id, urgency: res.urgency, reason: text.trim() })}>Continue to booking</button>
        </div>
      )}
    </section>
  );
}
