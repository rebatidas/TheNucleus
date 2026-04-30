import { useEffect, useState } from "react";
import {
  Button,
  Empty,
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
import { usePermissions } from "../hooks/usePermissions";

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

const LIST_VIEW_OPTIONS = [
  { label: "All Customers", value: "all_customers" },
  { label: "My Customers", value: "my_customers" },
  { label: "Recently Viewed", value: "recently_viewed" },
];

const EMPTY_STATE_TEXT: Record<string, string> = {
  all_customers: "No customers found",
  my_customers: "You haven't created any customers yet",
  recently_viewed: "No recently viewed customers in the last 30 days",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedListView, setSelectedListView] = useState("all_customers");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const {
    canViewObject,
    canCreateObject,
    isFieldVisible,
    isFieldReadOnly,
  } = usePermissions();

  const canViewCustomers = canViewObject("Customers");
  const canCreateCustomers = canCreateObject("Customers");

  const fetchCustomers = async (view: string = selectedListView) => {
    try {
      setLoading(true);
      const response = await api.get<CustomerListResponse>(
        `/api/customers?view=${view}`
      );
      setCustomers(response.data.data || []);
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewCustomers) {
      fetchCustomers("all_customers");
    }
  }, [canViewCustomers]);

  const handleListViewChange = (value: string) => {
    setSelectedListView(value);
    fetchCustomers(value);
  };

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
      } else {
        fetchCustomers(selectedListView);
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

  if (!canViewCustomers) {
    return (
      <AppLayout title="Customers">
        {contextHolder}
        <div style={{ padding: 24 }}>You do not have access to Customers.</div>
      </AppLayout>
    );
  }

  const columns: ColumnsType<Customer> = [
    ...(isFieldVisible("Customers", "first_name") ||
    isFieldVisible("Customers", "last_name") ||
    isFieldVisible("Customers", "middle_name") ||
    isFieldVisible("Customers", "salutation")
      ? [
          {
            title: "Name",
            key: "name",
            render: (_: unknown, record: Customer) => {
              const fullName = [
                isFieldVisible("Customers", "salutation")
                  ? record.salutation
                  : "",
                isFieldVisible("Customers", "first_name")
                  ? record.first_name
                  : "",
                isFieldVisible("Customers", "middle_name")
                  ? record.middle_name
                  : "",
                isFieldVisible("Customers", "last_name")
                  ? record.last_name
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <Link to={`/customers/${record.ID}`}>
                  {fullName || `Customer ${record.ID}`}
                </Link>
              );
            },
          },
        ]
      : []),
    ...(isFieldVisible("Customers", "email")
      ? [
          {
            title: "Email",
            dataIndex: "email",
            key: "email",
          },
        ]
      : []),
    ...(isFieldVisible("Customers", "phone")
      ? [
          {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
          },
        ]
      : []),
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

          {canCreateCustomers ? (
            <Button type="primary" onClick={openModal}>
              New
            </Button>
          ) : (
            <div />
          )}
        </Space>

        <div style={{ marginBottom: 16 }}>
          <Select
            value={selectedListView}
            onChange={handleListViewChange}
            style={{ width: 220 }}
            options={LIST_VIEW_OPTIONS}
          />
        </div>

        <Table
          rowKey="ID"
          columns={columns}
          dataSource={customers}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  EMPTY_STATE_TEXT[selectedListView] ?? "No records found"
                }
              />
            ),
          }}
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
            {isFieldVisible("Customers", "salutation") ? (
              <Form.Item name="salutation" label="Salutation">
                <Input disabled={isFieldReadOnly("Customers", "salutation")} />
              </Form.Item>
            ) : null}

            {isFieldVisible("Customers", "first_name") ? (
              <Form.Item
                name="first_name"
                label="First name"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input disabled={isFieldReadOnly("Customers", "first_name")} />
              </Form.Item>
            ) : null}

            {isFieldVisible("Customers", "middle_name") ? (
              <Form.Item name="middle_name" label="Middle name">
                <Input disabled={isFieldReadOnly("Customers", "middle_name")} />
              </Form.Item>
            ) : null}

            {isFieldVisible("Customers", "last_name") ? (
              <Form.Item
                name="last_name"
                label="Last name"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input disabled={isFieldReadOnly("Customers", "last_name")} />
              </Form.Item>
            ) : null}

            {isFieldVisible("Customers", "email") ? (
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input disabled={isFieldReadOnly("Customers", "email")} />
              </Form.Item>
            ) : null}

            {isFieldVisible("Customers", "phone") ? (
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: "Please enter phone" }]}
              >
                <Input disabled={isFieldReadOnly("Customers", "phone")} />
              </Form.Item>
            ) : null}

            {isFieldVisible("Customers", "shipping_address") ? (
              <Form.Item name="shipping_address" label="Shipping address">
                <Input.TextArea
                  rows={3}
                  disabled={isFieldReadOnly("Customers", "shipping_address")}
                />
              </Form.Item>
            ) : null}

            {isFieldVisible("Customers", "billing_address") ? (
              <Form.Item name="billing_address" label="Billing address">
                <Input.TextArea
                  rows={3}
                  disabled={isFieldReadOnly("Customers", "billing_address")}
                />
              </Form.Item>
            ) : null}

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