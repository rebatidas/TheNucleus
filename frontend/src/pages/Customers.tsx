import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";

type Customer = {
  ID: number;
  salutation?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  shipping_address?: string;
  billing_address?: string;
};

type CustomerListResponse = {
  data: Customer[];
};

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedListView, setSelectedListView] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get<CustomerListResponse>("/api/customers");
      setCustomers(response.data.data || []);
    } catch (err: any) {
      message.error(err?.response?.data?.error ?? "Error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values: FormValues) => {
  try {
    setIsSaving(true);

    const response = await api.post("/api/customers", values);
    const createdCustomer = response.data?.data;

    closeModal();
    messageApi.success("Customer created successfully");

    if (createdCustomer?.ID) {
      navigate(`/customers/${createdCustomer.ID}`);
    }
  } catch (err: any) {
    messageApi.error(
      err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Error creating customer"
    );
  } finally {
    setIsSaving(false);
  }
};

  const columns: ColumnsType<Customer> = [
    {
      title: "Name",
      key: "name",
      render: (_, record) => {
        const fullName = [
          record.salutation,
          record.first_name,
          record.middle_name,
          record.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        return <Link to={`/customers/${record.ID}`}>{fullName}</Link>;
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
  ];

  return (
    <AppLayout title="Customers">
      {contextHolder}
      <div style={{ padding: "8px 0" }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
          align="start"
        >
          <div />
          <Button type="primary" onClick={openModal}>
            New
          </Button>
        </Space>

        <div style={{ marginBottom: 16 }}>
          <Select
            value={selectedListView}
            onChange={setSelectedListView}
            style={{ width: 220 }}
            options={[
              { label: "All", value: "All" },
              { label: "My Customers", value: "My Customers" },
              { label: "All Customers", value: "All Customers" },
            ]}
          />
        </div>

        <Table
          rowKey="ID"
          columns={columns}
          dataSource={customers}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title="New Customer"
          open={isModalOpen}
          onCancel={closeModal}
          footer={null}
          width={700}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="salutation" label="Salutation">
              <Input />
            </Form.Item>

            <Form.Item
              name="first_name"
              label="First name"
              rules={[{ required: true, message: "Please enter first name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="middle_name" label="Middle name">
              <Input />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="Last name"
              rules={[{ required: true, message: "Please enter last name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: "Please enter phone" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="shipping_address" label="Shipping address">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="billing_address" label="Billing address">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={closeModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={isSaving}>
                  Save
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}