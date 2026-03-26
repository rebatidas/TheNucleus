import React from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(true);

  const [user, setUser] = React.useState<any>(null);
  const [editing, setEditing] = React.useState(false);

  const nav = useNavigate();

  React.useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          setLoading(false);
          return nav('/login');
        }

        const res = await api.get('/api/me');
        const data = res.data.data || {};
        setUser(data);
        form.setFieldsValue({ name: data.name || 'username', email: data.email || 'email' });
      } catch (err) {
        console.error(err);
        // redirect to login on unauthorized
        // axios error shape may vary
        // @ts-ignore
        
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onFinish(values: any) {
    try {
      const res = await api.put('/api/me', values);
      const data = res.data.data || {};
      setUser(data);
      form.setFieldsValue({ name: data.name, email: data.email });
      setEditing(false);
      message.success('Profile updated');
    } catch (err) {
      console.error(err);
      message.error('Update failed');
    }
  }

  return (
    <AppLayout title="Profile">
      <div style={{ maxWidth: 720 }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
            {!editing ? (
              <div>
                <div style={{ marginBottom: 8 }}><strong>Name:</strong> {user?.name || 'username'}</div>
                <div style={{ marginBottom: 8 }}><strong>Email:</strong> {user?.email || 'email'}</div>
                <div style={{ marginBottom: 8 }}><strong>Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'time'}</div>
                <div style={{ marginTop: 12 }}>
                  <Button type="primary" onClick={() => setEditing(true)}>Edit</Button>
                </div>
              </div>
            ) : (
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name' }]}>
                  <Input />
                </Form.Item>

                <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                  <Input />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">Save</Button>
                  <Button style={{ marginLeft: 8 }} onClick={() => { setEditing(false); form.setFieldsValue({ name: user?.name, email: user?.email }); }}>Cancel</Button>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
