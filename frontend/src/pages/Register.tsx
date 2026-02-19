import React from "react";
import { Form, Input, Button, Alert } from "antd";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

export default function Register() {
  const nav = useNavigate();
  const [form] = Form.useForm();
  const [msg, setMsg] = React.useState<string | null>(null);

  async function onFinish(values: any) {
    setMsg(null);
    try {
      const res = await api.post("/api/auth/register", values);
      setMsg(res.data?.message ?? "Registered successfully");
      nav("/login");
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? "Registration failed");
    }
  }

  return (
    <AppLayout title="" showSidebar={false}>
      <div style={{ maxWidth: 420, margin: "60px auto" }}>
        <h2 style={{ color: "#032d60" }}>Create account</h2>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
              Register
            </Button>
          </Form.Item>
        </Form>

        {msg && <Alert message={msg} style={{ marginTop: 12 }} />}

        <p style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </AppLayout>
  );
}