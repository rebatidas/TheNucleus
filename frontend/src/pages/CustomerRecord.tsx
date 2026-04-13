import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
} from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  shipping_address?: string;
  billing_address?: string;
};

type CustomerResponse = {
  data: Customer;
};

type CustomerCase = {
  id: number;
  case_number: string;
  status: string;
  subject: string;
  description?: string;
  resolution?: string;
  customer_id: number;
};

type CustomerCasesResponse = {
  data: CustomerCase[];
};

type CustomerFormValues = {
  salutation?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  shipping_address?: string;
  billing_address?: string;
};

type CaseFormValues = {
  subject: string;
  description?: string;
  status?: string;
  resolution?: string;
};

export default function CustomerRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerCases, setCustomerCases] = useState<CustomerCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isCaseSaving, setIsCaseSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [customerForm] = Form.useForm<CustomerFormValues>();
  const [caseForm] = Form.useForm<CaseFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await api.get<CustomerResponse>(`/api/customers/${id}`);
      setCustomer(response.data.data);
      // Log this customer as recently viewed (fire and forget)
      api.post(`/api/recently-viewed/customers/${id}`).catch(() => {});
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error fetching customer");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerCases = async () => {
    try {
      setCasesLoading(true);
      const response = await api.get<CustomerCasesResponse>(
        `/api/customer-cases/${id}`
      );
      setCustomerCases(response.data.data || []);
    } catch (err: any) {
      messageApi.error(
        err?.response?.data?.error ?? "Error fetching related cases"
      );
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchCustomer();
    fetchCustomerCases();
  }, [id]);

  const openEditModal = () => {
    if (!customer) return;

    customerForm.setFieldsValue({
      salutation: customer.salutation,
      first_name: customer.first_name,
      middle_name: customer.middle_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      shipping_address: customer.shipping_address,
      billing_address: customer.billing_address,
    });

    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    customerForm.resetFields();
  };

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

  const handleUpdate = async (values: CustomerFormValues) => {
    try {
      setIsSaving(true);
      const response = await api.put(`/api/customers/${id}`, values);
      setCustomer(response.data.data);
      closeEditModal();
      messageApi.success("Customer updated successfully");
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error updating customer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/api/customers/${id}`);
      messageApi.success("Customer deleted successfully");
      navigate("/customers");
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error deleting customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCase = async (values: CaseFormValues) => {
    try {
      setIsCaseSaving(true);

      const response = await api.post("/api/cases", {
        ...values,
        customer_id: Number(id),
      });

      if (response.data?.data) {
        setCustomerCases((prev) => [response.data.data, ...prev]);
      }

      closeCaseModal();
      messageApi.success("Case created successfully");
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error creating case");
    } finally {
      setIsCaseSaving(false);
    }
  };

  const fullName = customer
    ? [
        customer.salutation,
        customer.first_name,
        customer.middle_name,
        customer.last_name,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <AppLayout title="Customers">
      {contextHolder}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2.2fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <Card
          loading={loading}
          title={fullName || "Customer Record"}
          extra={
            <Space>
              <Button onClick={openEditModal}>Edit</Button>
              <Popconfirm
                title="Delete customer"
                description="Are you sure you want to delete this customer?"
                onConfirm={handleDelete}
                okText="Yes"
                cancelText="No"
              >
                <Button danger loading={isDeleting}>
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          }
        >
          {customer && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Salutation">
                {customer.salutation || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="First Name">
                {customer.first_name}
              </Descriptions.Item>
              <Descriptions.Item label="Middle Name">
                {customer.middle_name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Last Name">
                {customer.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {customer.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {customer.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Shipping Address">
                {customer.shipping_address || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Billing Address">
                {customer.billing_address || "-"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        <Card
          title="Cases"
          extra={
            <Button type="primary" size="small" onClick={openCaseModal}>
              New
            </Button>
          }
          style={{ position: "sticky", top: 24 }}
          loading={casesLoading}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 2fr 1fr",
              padding: "8px 12px",
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderBottom: "none",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <div>Case Number</div>
            <div>Subject</div>
            <div>Status</div>
          </div>

          <div
            style={{
              border: "1px solid #f0f0f0",
              borderTop: "none",
            }}
          >
            {customerCases.length === 0 ? (
              <div style={{ padding: 12, color: "#666" }}>
                No related cases found
              </div>
            ) : (
              customerCases.map((caseItem, index) => (
                <div
                  key={caseItem.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 2fr 1fr",
                    padding: "10px 12px",
                    borderBottom:
                      index !== customerCases.length - 1
                        ? "1px solid #f5f5f5"
                        : "none",
                    alignItems: "center",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <Link
                      to={`/cases/${caseItem.id}`}
                      style={{
                        color: "#1677ff",
                        fontWeight: 500,
                      }}
                    >
                      {caseItem.case_number}
                    </Link>
                  </div>

                  <div
                    style={{
                      color: "#333",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={caseItem.subject || "-"}
                  >
                    {caseItem.subject || "-"}
                  </div>

                  <div>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        background:
                          caseItem.status === "Closed"
                            ? "#f6ffed"
                            : caseItem.status === "In Progress"
                            ? "#e6f4ff"
                            : "#fff7e6",
                        color:
                          caseItem.status === "Closed"
                            ? "#389e0d"
                            : caseItem.status === "In Progress"
                            ? "#1677ff"
                            : "#d48806",
                      }}
                    >
                      {caseItem.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal
        title="Edit Customer"
        open={isEditOpen}
        onCancel={closeEditModal}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={customerForm}
          layout="vertical"
          onFinish={handleUpdate}
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
              <Button onClick={closeEditModal}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isSaving}>
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
    </AppLayout>
  );
}