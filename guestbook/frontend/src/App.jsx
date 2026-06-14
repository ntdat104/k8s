import { useEffect, useState } from "react";

// ============================================================
// Frontend goi backend qua duong dan TUONG DOI "/api/..."
//
// QUAN TRONG (bai hoc production):
//   React chay trong TRINH DUYET cua user. DNS noi bo K8s
//   "backend-service" CHI phan giai duoc BEN TRONG cluster,
//   trinh duyet KHONG goi thang vao do duoc.
//
//   Vi vay frontend goi "/api/messages" -> nginx trong pod
//   frontend (chay BEN TRONG cluster) se proxy sang
//   http://backend-service:8080/messages
//   Day moi la cach dung DNS noi bo dung chuan.
// ============================================================
const API = "/api";

export default function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);

  async function loadMessages() {
    try {
      const res = await fetch(`${API}/messages`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setInfo({ version: data.version, pod: data.pod });
      setError("");
    } catch (e) {
      setError(`Khong tai duoc loi nhan: ${e.message}`);
    }
  }

  useEffect(() => {
    loadMessages();
    // Tu dong refresh moi 3s de quan sat HA / pod khac nhau tra loi
    const t = setInterval(loadMessages, 3000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError("Vui long nhap ten va loi nhan");
      return;
    }
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setName("");
      setMessage("");
      setError("");
      loadMessages();
    } catch (e) {
      setError(`Gui that bai: ${e.message}`);
    }
  }

  return (
    <div className="container">
      <h1>📖 Guestbook</h1>

      {info && (
        <p className="badge">
          backend version: <b>{info.version}</b> &nbsp;|&nbsp; tra loi boi pod:{" "}
          <code>{info.pod}</code>
        </p>
      )}

      <form onSubmit={handleSubmit} className="form">
        <input
          placeholder="Ten cua ban"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Loi nhan"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Gui</button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Loi nhan ({messages.length})</h2>
      <ul className="list">
        {messages
          .slice()
          .reverse()
          .map((m) => (
            <li key={m.id}>
              <b>{m.name}</b>: {m.message}
              <span className="meta">
                {m.servedBy ? ` · pod ${m.servedBy}` : ""}
                {m.version ? ` · ${m.version}` : ""}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
