import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/*
  Login page with TWO buttons:
  - Vulnerable Login (calls /vuln/login-operator-injection)
    Allows operator payloads (JSON/object) in username/password.
  - Secure Login (calls /secure/login-secure)
    Sends username/password as strings.
*/

const DEFAULT_BASE = "http://localhost:8080";

function parsePossibleJSON(str) {
  // try parse JSON; if fails return original string
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

export default function Login() {
  const navigate = useNavigate();
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Vulnerable login: allow JSON/object username/password
  async function handleVulnLogin(e) {
    e.preventDefault();
    setMsg(null);
    if (!username) return setMsg({ type: "error", text: "username required" });
    if (!password) return setMsg({ type: "error", text: "password required" });

    setLoading(true);
    try {
      // parse username/password as JSON if provided so object operators pass through
      const uPayload = parsePossibleJSON(username);
      const pPayload = parsePossibleJSON(password);

      const out = await postJson(
        baseUrl.replace(/\/$/, "") + "/vuln/login-operator-injection",
        { username: uPayload, password: pPayload }
      );
      if (out.ok) {
        // treat as successful demo login
        const savedUser = { username: typeof uPayload === "string" ? uPayload : out.data?.examples?.[0]?.username, baseUrl };
        localStorage.setItem("demoUser", JSON.stringify(savedUser));
        setMsg({ type: "success", text: "Vulnerable login succeeded — demo access granted." });
        navigate("/dashboard");
      } else {
        setMsg({ type: "error", text: "Vulnerable login failed: " + (out.data?.error || out.data || out.status) });
      }
    } catch (err) {
      setMsg({ type: "error", text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  // Secure login: send strings only
  async function handleSecureLogin(e) {
    e.preventDefault();
    setMsg(null);
    if (!username) return setMsg({ type: "error", text: "username required" });
    if (!password) return setMsg({ type: "error", text: "password required" });

    setLoading(true);
    try {
      const out = await postJson(
        baseUrl.replace(/\/$/, "") + "/secure/login-secure",
        { username: String(username), password: String(password) }
      );

      if (out.ok && out.data && out.data.ok) {
        const savedUser = { username: out.data.user?.username || username, baseUrl };
        localStorage.setItem("demoUser", JSON.stringify(savedUser));
        setMsg({ type: "success", text: "Secure login succeeded." });
        navigate("/dashboard");
      } else {
        setMsg({ type: "error", text: "Secure login failed: " + (out.data?.err || out.data?.error || out.data || out.status) });
      }
    } catch (err) {
      setMsg({ type: "error", text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setUsername('alice');
    setPassword('password123');
  }
  function fillOperator() {
    setUsername('{"$ne":""}');
    setPassword('anything');
  }

  return (
    <div className="page">
      <div className="card login-card">
        <div className="brand">
          <div className="logo">MDB</div>
          <div>
            <h1>MongoDB Injection Demo</h1>
            <p className="muted">Login to demonstrate vulnerable vs secure auth.</p>
          </div>
        </div>

        <form className="form">
         
          <input className="input" style={{display:"none"}} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />

          <label className="label">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder='alice or {"$ne":""}' />

          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder='password123' />

          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={handleVulnLogin} className="btn" disabled={loading}>{loading ? 'Running...' : 'Vulnerable Login'}</button>
            <button onClick={handleSecureLogin} className="btn secondary" disabled={loading}>{loading ? 'Running...' : 'Secure Login'}</button>
            <button type="button" onClick={fillDemo} className="btn smallBtn">Fill demo creds</button>
            <button type="button" onClick={fillOperator} className="btn smallBtn">Fill operator</button>
          </div>

          {msg && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: msg.type === "error" ? "#fee2e2" : "#ecfccb", color: msg.type === "error" ? "#991b1b" : "#365314" }}>
              {msg.text}
            </div>
          )}

          
        </form>
      </div>
    </div>
  );
}
