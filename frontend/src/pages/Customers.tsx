import { Form, Input, Button, message } from "antd";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

type FormValues = {
  salutation?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  shipping_address?: string;
  billing_address?: string;
};

export default function Customers() {
  const [form] = Form.useForm<FormValues>();

  const handleSubmit = async (values: FormValues) => {
    try {
      await api.post("/api/customers", values);
      message.success("Customer created successfully");
      form.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error creating customer");
    }
  };

  return (
    <AppLayout title="Customers">
      <div style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="salutation" label="Salutation">
            <Input />
          </Form.Item>

          <Form.Item name="first_name" label="First name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="middle_name" label="Middle name">
            <Input />
          </Form.Item>

          <Form.Item name="last_name" label="Last name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="shipping_address" label="Shipping address">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="billing_address" label="Billing address">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AppLayout>
  );
}