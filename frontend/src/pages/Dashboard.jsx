// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";

// function getUser() {
//   try { return JSON.parse(localStorage.getItem("demoUser")); } catch { return null; }
// }

// async function callApi(base, method, path, body) {
//   try {
//     const res = await fetch(base.replace(/\/$/, "") + path, Object.assign({
//       method,
//       headers: { "Content-Type": "application/json" }
//     }, body ? { body: JSON.stringify(body) } : {}));
//     const text = await res.text();
//     try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; } catch { return { ok: res.ok, status: res.status, data: text }; }
//   } catch (err) {
//     return { ok: false, err: err.message };
//   }
// }

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const user = getUser() || { username: "demo", baseUrl: "http://localhost:8080" };
//   const [resp, setResp] = useState(null);
//   const [loading, setLoading] = useState(false);

//   function logout() {
//     localStorage.removeItem("demoUser");
//     navigate("/login");
//   }

//   async function runVuln(path, method = "GET", body) {
//     setLoading(true);
//     const out = await callApi(user.baseUrl, method, path, body);
//     setResp(out);
//     setLoading(false);
//   }
//   async function runSecure(path, method = "GET", body) {
//     setLoading(true);
//     const out = await callApi(user.baseUrl, method, path, body);
//     setResp(out);
//     setLoading(false);
//   }

//   return (
//     <div className="page">
//       <div className="header">
//         <h2>Dashboard — Demo</h2>
//         <div>
//           <span className="muted">Signed in as </span><strong>{user.username}</strong>
//           <button className="btn smallBtn" onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
//         </div>
//       </div>

//       <div className="grid">
//         <div className="card vcard">
//           <h3>Operator Injection (Auth Bypass)</h3>
//           <p className="muted">Vulnerable: accept operator objects. Secure: strict validation.</p>
//           <div className="row">
//             <button className="btn" onClick={() => runVuln("/vuln/login-operator-injection", "POST", { username: { "$ne": "" }, password: "anything" })}>Run vulnerable</button>
//             <button className="btn secondary" onClick={() => runSecure("/secure/login-secure", "POST", { username: "alice", password: "password123" })}>Run secure</button>
//           </div>
//         </div>

//         <div className="card vcard">
//           <h3>Projection Injection (Data Exfil)</h3>
//           <p className="muted">Vulnerable: trusts client-supplied fields. Secure: whitelist projections.</p>
//           <div className="row">
//             <button className="btn" onClick={() => runVuln("/vuln/users-vuln?fields=username,password")}>Run vulnerable</button>
//             <button className="btn secondary" onClick={() => runSecure("/secure/users-secure?fields=username,password")}>Run secure</button>
//           </div>
//         </div>

//         <div className="card vcard">
//           <h3>Unsafe Regex / ReDoS</h3>
//           <p className="muted">Vulnerable: builds RegExp from user input. Secure: escape/anchor and maxTimeMS.</p>
//           <div className="row">
//             <button className="btn" onClick={() => runVuln("/vuln/search-vuln?q=a")}>Run vulnerable</button>
//             <button className="btn secondary" onClick={() => runSecure("/secure/search-secure?q=a")}>Run secure</button>
//           </div>
//         </div>

//         <div className="card vcard">
//           <h3>$where / Eval</h3>
//           <p className="muted">Vulnerable: executes JS on DB side. Extremely dangerous.</p>
//           <div className="row">
//             <button className="btn" onClick={() => runVuln("/vuln/eval-vuln", "POST", { where: "this.username && (function(){return true})()" })}>Run vulnerable (if enabled)</button>
//             <button className="btn secondary" onClick={() => setResp({ ok:false, msg: "Avoid using $where; use explicit queries." })}>Learn mitigation</button>
//           </div>
//         </div>
//       </div>

//       <div className="card" style={{ marginTop: 18 }}>
//         <h3>Response</h3>
//         <pre className="response">{loading ? "Loading..." : (resp ? JSON.stringify(resp, null, 2) : "// no response yet")}</pre>
//       </div>
//     </div>
//   );
// }



import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem("demoUser") || "{}");

  function logout() {
    localStorage.removeItem("demoUser");
    navigate("/login");
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Dashboard</h2>
        <p style={styles.text}>Welcome, <strong>{user.username}</strong> 👋</p>
        <button style={styles.button} onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0d1117",
    color: "#e6edf3",
    fontFamily: "Segoe UI, sans-serif",
  },
  card: {
    background: "#161b22",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 0 10px #000",
    textAlign: "center",
    width: "320px",
  },
  heading: {
    marginBottom: "12px",
  },
  text: {
    marginBottom: "20px",
  },
  button: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },
};
