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
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

type Customer = {
  ID: number;
  salutation?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
};

type CustomerResponse = {
  data: Customer[];
};

type CaseRecord = {
  id: number;
  case_number: string;
  status: string;
  subject: string;
  description?: string;
  resolution?: string;
  customer_id: number;
  customer?: Customer;
  created_date: string;
  last_modified_date: string;
};

type CaseResponse = {
  data: CaseRecord[];
};

type CaseFormValues = {
  customer_id: number | "new_customer";
  subject: string;
  description?: string;
  status?: string;
  resolution?: string;
};

type CustomerFormValues = {
  salutation?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  shipping_address?: string;
  billing_address?: string;
};

export default function Cases() {
  const navigate = useNavigate();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedListView, setSelectedListView] = useState("All");
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCaseSaving, setIsCaseSaving] = useState(false);
  const [isCustomerSaving, setIsCustomerSaving] = useState(false);

  const [caseForm] = Form.useForm<CaseFormValues>();
  const [customerForm] = Form.useForm<CustomerFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await api.get<CaseResponse>("/api/cases");
      setCases(response.data.data || []);
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error fetching cases");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get<CustomerResponse>("/api/customers");
      setCustomers(response.data.data || []);
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error fetching customers");
    }
  };

  useEffect(() => {
    fetchCases();
    fetchCustomers();
  }, []);

  const openCaseModal = () => {
    caseForm.resetFields();
    caseForm.setFieldsValue({
      status: "New",
    });
    setIsCaseModalOpen(true);
  };

  const closeCaseModal = () => {
    setIsCaseModalOpen(false);
    caseForm.resetFields();
  };

  const openCustomerModal = () => {
    customerForm.resetFields();
    setIsCustomerModalOpen(true);
  };

  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false);
    customerForm.resetFields();
  };

  const handleCustomerDropdownChange = (value: number | "new_customer") => {
    if (value === "new_customer") {
      openCustomerModal();
    }
  };

  const handleCreateCustomer = async (values: CustomerFormValues) => {
    try {
      setIsCustomerSaving(true);
      const response = await api.post("/api/customers", values);
      const createdCustomer = response.data?.data;

      if (createdCustomer) {
        setCustomers((prev) => [...prev, createdCustomer]);
        caseForm.setFieldsValue({
          customer_id: createdCustomer.ID,
        });
      }

      closeCustomerModal();
      messageApi.success("Customer created successfully");
    } catch (err: any) {
      messageApi.error(
        err?.response?.data?.message ??
          err?.response?.data?.error ??
          "Error creating customer"
      );
    } finally {
      setIsCustomerSaving(false);
    }
  };

  const handleCreateCase = async (values: CaseFormValues) => {
    try {
      setIsCaseSaving(true);

      const response = await api.post("/api/cases", {
        customer_id: values.customer_id,
        subject: values.subject,
        description: values.description,
        status: values.status,
        resolution: values.resolution,
      });

      const createdCase = response.data?.data;

      closeCaseModal();
      messageApi.success("Case created successfully");

      if (createdCase?.id) {
        navigate(`/cases/${createdCase.id}`);
      }
    } catch (err: any) {
      messageApi.error(
        err?.response?.data?.error ?? "Error creating case"
      );
    } finally {
      setIsCaseSaving(false);
    }
  };

  const getCustomerName = (record: CaseRecord) => {
    if (!record.customer) return "-";

    return [
      record.customer.salutation,
      record.customer.first_name,
      record.customer.middle_name,
      record.customer.last_name,
    ]
      .filter(Boolean)
      .join(" ");
  };

  const columns: ColumnsType<CaseRecord> = [
    {
      title: "Case Number",
      dataIndex: "case_number",
      key: "case_number",
      render: (_, record) => (
        <Link to={`/cases/${record.id}`}>{record.case_number}</Link>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => getCustomerName(record),
    },
  ];

  return (
    <AppLayout title="Cases">
      {contextHolder}

      <div style={{ padding: "8px 0" }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div />
          <Button type="primary" onClick={openCaseModal}>
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
              { label: "My Cases", value: "My Cases" },
              { label: "All Cases", value: "All Cases" },
            ]}
          />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={cases}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="New Case"
        open={isCaseModalOpen}
        onCancel={closeCaseModal}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={caseForm} layout="vertical" onFinish={handleCreateCase}>
          <Form.Item
            name="customer_id"
            label="Customer Name"
            rules={[{ required: true, message: "Please select customer" }]}
          >
            <Select
              placeholder="Select customer"
              onChange={handleCustomerDropdownChange}
              options={[
                ...customers.map((customer) => ({
                  label: [
                    customer.salutation,
                    customer.first_name,
                    customer.middle_name,
                    customer.last_name,
                  ]
                    .filter(Boolean)
                    .join(" "),
                  value: customer.ID,
                })),
                { label: "+ New Customer", value: "new_customer" as const },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: "Please enter subject" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select
              options={[
                { label: "New", value: "New" },
                { label: "In Progress", value: "In Progress" },
                { label: "Closed", value: "Closed" },
              ]}
            />
          </Form.Item>

          <Form.Item name="resolution" label="Resolution">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={closeCaseModal}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isCaseSaving}>
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="New Customer"
        open={isCustomerModalOpen}
        onCancel={closeCustomerModal}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={customerForm}
          layout="vertical"
          onFinish={handleCreateCustomer}
        >
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
              <Button onClick={closeCustomerModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCustomerSaving}
              >
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}