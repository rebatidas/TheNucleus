import React from "react";
import { Form, Input, Button, Alert } from "antd";
import { api, setAuthToken } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

export default function Login() {
  const nav = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = React.useState<string | null>(null);

  async function onFinish(values: any) {
    setError(null);
    try {
      const res = await api.post("/api/auth/login", values);
      const token = res.data?.data?.token;
      if (!token) throw new Error("Token missing from response");
      localStorage.setItem("token", token);
      setAuthToken(token);
      nav("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Login failed");
    }
  }

  return (
    <AppLayout title="" showSidebar={false}>
      <div style={{ maxWidth: 420, margin: "60px auto" }}>
        <h2 style={{ color: "#032d60" }}>Login</h2>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
              Login
            </Button>
          </Form.Item>
        </Form>

        {error && <Alert type="error" message={error} />}

        <p style={{ marginTop: 16 }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AppLayout>
  );
}