import { useState } from "react";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      const res = await api.post("/api/auth/register", { name, email, password });
      setMsg(res.data?.message ?? "Registered successfully");
      nav("/login");
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? "Registration failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "system-ui" }}>
      <h2>Create account</h2>
      <form onSubmit={onSubmit}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: 10, margin: "6px 0 14px" }} />

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%", padding: 10, margin: "6px 0 14px" }} />

        <label>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: "100%", padding: 10, margin: "6px 0 14px" }} />

        <button type="submit" style={{ width: "100%", padding: 10 }}>Register</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}