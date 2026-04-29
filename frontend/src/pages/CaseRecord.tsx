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
import { usePermissions } from "../hooks/usePermissions";

type Customer = {
  ID: number;
  salutation?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
};

type CaseRecordType = {
  id: number;
  case_number: string;
  status: string;
  subject: string;
  description?: string;
  customer_id: number;
  resolution?: string;
  created_by?: number;
  last_modified_by?: number;
  created_date: string;
  last_modified_date: string;
  customer?: Customer;
};

type CaseResponse = {
  data: CaseRecordType;
};

type CustomerListResponse = {
  data: Customer[];
};

type CaseFormValues = {
  status?: string;
  subject?: string;
  description?: string;
  customer_id?: number;
  resolution?: string;
};

export default function CaseRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseRecord, setCaseRecord] = useState<CaseRecordType | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form] = Form.useForm<CaseFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const {
    canViewObject,
    canEditObject,
    canDeleteObject,
    isFieldVisible,
    isFieldReadOnly,
  } = usePermissions();

  const canViewCases = canViewObject("Cases");
  const canEditCases = canEditObject("Cases");
  const canDeleteCases = canDeleteObject("Cases");

  const fetchCase = async () => {
    try {
      setLoading(true);
      const response = await api.get<CaseResponse>(`/api/cases/${id}`);
      setCaseRecord(response.data.data);
      // Log this case as recently viewed (fire and forget)
      api.post(`/api/recently-viewed/cases/${id}`).catch(() => {});
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error fetching case");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get<CustomerListResponse>("/api/customers");
      setCustomers(response.data.data || []);
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error fetching customers");
    }
  };

  useEffect(() => {
    if (!id || !canViewCases) return;
    fetchCase();
    fetchCustomers();
  }, [id, canViewCases]);

  const openEditModal = () => {
    if (!caseRecord) return;

    form.setFieldsValue({
      status: caseRecord.status,
      subject: caseRecord.subject,
      description: caseRecord.description,
      customer_id: caseRecord.customer_id,
      resolution: caseRecord.resolution,
    });

    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    form.resetFields();
  };

  const handleUpdate = async (values: CaseFormValues) => {
    try {
      setIsSaving(true);
      const response = await api.put(`/api/cases/${id}`, values);
      setCaseRecord(response.data.data);
      closeEditModal();
      messageApi.success("Case updated successfully");
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error updating case");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/api/cases/${id}`);
      messageApi.success("Case deleted successfully");
      navigate("/cases");
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Error deleting case");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCustomerName = () => {
    if (!caseRecord?.customer) return "-";

    return [
      caseRecord.customer.salutation,
      caseRecord.customer.first_name,
      caseRecord.customer.middle_name,
      caseRecord.customer.last_name,
    ]
      .filter(Boolean)
      .join(" ");
  };

  if (!canViewCases) {
    return (
      <AppLayout title="Cases">
        {contextHolder}
        <div style={{ padding: 24 }}>You do not have access to this record.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Cases">
      {contextHolder}

      <Card
        loading={loading}
        title={caseRecord?.case_number || "Case Record"}
        extra={
          <Space>
            {canEditCases ? (
              <Button onClick={openEditModal}>Edit</Button>
            ) : null}

            {canDeleteCases ? (
              <Popconfirm
                title="Delete case"
                description="Are you sure you want to delete this case?"
                onConfirm={handleDelete}
                okText="Yes"
                cancelText="No"
              >
                <Button danger loading={isDeleting}>
                  Delete
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        }
      >
        {caseRecord && (
          <Descriptions column={1} bordered>
            {isFieldVisible("Cases", "case_number") ? (
              <Descriptions.Item label="Case Number">
                {caseRecord.case_number || "-"}
              </Descriptions.Item>
            ) : null}

            {isFieldVisible("Cases", "status") ? (
              <Descriptions.Item label="Status">
                {caseRecord.status || "-"}
              </Descriptions.Item>
            ) : null}

            {isFieldVisible("Cases", "subject") ? (
              <Descriptions.Item label="Subject">
                {caseRecord.subject || "-"}
              </Descriptions.Item>
            ) : null}

            {isFieldVisible("Cases", "description") ? (
              <Descriptions.Item label="Description">
                {caseRecord.description || "-"}
              </Descriptions.Item>
            ) : null}

            {isFieldVisible("Cases", "customer_id") ? (
              <Descriptions.Item label="Customer Name">
                {caseRecord.customer ? (
                  <Link to={`/customers/${caseRecord.customer.ID}`}>
                    {getCustomerName()}
                  </Link>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
            ) : null}

            {isFieldVisible("Cases", "resolution") ? (
              <Descriptions.Item label="Resolution">
                {caseRecord.resolution || "-"}
              </Descriptions.Item>
            ) : null}

            <Descriptions.Item label="Created Date">
              {caseRecord.created_date
                ? new Date(caseRecord.created_date).toLocaleString()
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Last Modified Date">
              {caseRecord.last_modified_date
                ? new Date(caseRecord.last_modified_date).toLocaleString()
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Modal
        title="Edit Case"
        open={isEditOpen}
        onCancel={closeEditModal}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          {isFieldVisible("Cases", "customer_id") ? (
            <Form.Item name="customer_id" label="Customer Name">
              <Select
                disabled={isFieldReadOnly("Cases", "customer_id")}
                options={customers.map((customer) => ({
                  label: [
                    customer.salutation,
                    customer.first_name,
                    customer.middle_name,
                    customer.last_name,
                  ]
                    .filter(Boolean)
                    .join(" "),
                  value: customer.ID,
                }))}
              />
            </Form.Item>
          ) : null}

          {isFieldVisible("Cases", "status") ? (
            <Form.Item name="status" label="Status">
              <Select
                disabled={isFieldReadOnly("Cases", "status")}
                options={[
                  { label: "New", value: "New" },
                  { label: "In Progress", value: "In Progress" },
                  { label: "Closed", value: "Closed" },
                ]}
              />
            </Form.Item>
          ) : null}

          {isFieldVisible("Cases", "subject") ? (
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: "Please enter subject" }]}
            >
              <Input disabled={isFieldReadOnly("Cases", "subject")} />
            </Form.Item>
          ) : null}

          {isFieldVisible("Cases", "description") ? (
            <Form.Item name="description" label="Description">
              <Input.TextArea
                rows={4}
                disabled={isFieldReadOnly("Cases", "description")}
              />
            </Form.Item>
          ) : null}

          {isFieldVisible("Cases", "resolution") ? (
            <Form.Item name="resolution" label="Resolution">
              <Input.TextArea
                rows={3}
                disabled={isFieldReadOnly("Cases", "resolution")}
              />
            </Form.Item>
          ) : null}

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={closeEditModal}>Cancel</Button>
              {canEditCases ? (
                <Button type="primary" htmlType="submit" loading={isSaving}>
                  Save
                </Button>
              ) : null}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}