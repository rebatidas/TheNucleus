import { useState } from "react";
import { api, setAuthToken } from "../api/client";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      const res = await api.post("/api/auth/login", { email, password });
      const token = res.data?.data?.token;

      if (!token) throw new Error("Token missing from response");

      localStorage.setItem("token", token);
      setAuthToken(token);

      nav("/dashboard");
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? "Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "system-ui" }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%", padding: 10, margin: "6px 0 14px" }} />

        <label>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: "100%", padding: 10, margin: "6px 0 14px" }} />

        <button type="submit" style={{ width: "100%", padding: 10 }}>Login</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 16 }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}