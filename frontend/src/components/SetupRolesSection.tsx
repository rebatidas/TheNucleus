import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tree,
  Typography,
  message,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { api } from "../api/client";

const { Title, Text } = Typography;

type RoleRecord = {
  ID: number;
  label: string;
  role_name: string;
  reports_to_id?: number | null;
};

type CompanyInformation = {
  ID?: number;
  organization_name: string;
};

type RoleFormValues = {
  label: string;
  role_name: string;
  reports_to_id?: number | null;
};

type Props = {
  companyInfo: CompanyInformation | null;
};

type TreeNode = {
  title: React.ReactNode;
  key: string;
  children?: TreeNode[];
};

export default function SetupRolesSection({ companyInfo }: Props) {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  const [form] = Form.useForm<RoleFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/roles");
      setRoles(response.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = (parentId?: number | null) => {
    setEditingRole(null);
    setSelectedParentId(parentId ?? null);
    form.resetFields();
    form.setFieldsValue({
      reports_to_id: parentId ?? undefined,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleRecord) => {
    setEditingRole(role);
    setSelectedParentId(role.reports_to_id ?? null);
    form.setFieldsValue({
      label: role.label,
      role_name: role.role_name,
      reports_to_id: role.reports_to_id ?? undefined,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setSelectedParentId(null);
    form.resetFields();
  };

  const handleSave = async (values: RoleFormValues) => {
    try {
      setIsSaving(true);

      const payload = {
        label: values.label,
        role_name: values.role_name,
        reports_to_id: values.reports_to_id || null,
      };

      if (editingRole) {
        await api.put(`/api/roles/${editingRole.ID}`, payload);
        messageApi.success("Role updated successfully");
      } else {
        await api.post("/api/roles", payload);
        messageApi.success("Role created successfully");
      }

      closeModal();
      fetchRoles();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to save role");
    } finally {
      setIsSaving(false);
    }
  };

  const roleOptions = roles.map((role) => ({
    label: role.label,
    value: role.ID,
  }));

  const buildTree = (parentId: number | null): TreeNode[] => {
    return roles
      .filter((role) => (role.reports_to_id ?? null) === parentId)
      .map((role) => ({
        key: String(role.ID),
        title: (
          <div style={styles.roleRow}>
            <span>{role.label}</span>
            <Space size="small">
              <Button
                type="link"
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openCreateModal(role.ID);
                }}
              >
                Add Role
              </Button>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openEditModal(role);
                }}
              >
                Edit
              </Button>
            </Space>
          </div>
        ),
        children: buildTree(role.ID),
      }));
  };

  const treeData = useMemo(() => {
    if (!companyInfo?.organization_name) return [];

    return [
      {
        key: "company-root",
        title: (
          <div style={styles.roleRow}>
            <strong>{companyInfo.organization_name}</strong>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openCreateModal(null);
              }}
            >
              Add Role
            </Button>
          </div>
        ),
        children: buildTree(null),
      },
    ];
  }, [roles, companyInfo]);

  if (!companyInfo?.organization_name) {
    return (
      <Alert
        type="warning"
        message="Please create Company Information first. The company name is required as the root of the role hierarchy."
      />
    );
  }

  return (
    <>
      {contextHolder}

      <Card style={{ width: "100%" }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Roles
        </Title>

        {loading ? (
          <div style={styles.center}>
            <Spin tip="Loading roles..." />
          </div>
        ) : error ? (
          <Alert type="error" message={error} />
        ) : roles.length === 0 ? (
          <>
            <Tree
              defaultExpandAll
              showLine
              treeData={treeData}
              selectable={false}
            />
            <div style={{ marginTop: 16 }}>
              <Empty description="No roles created yet" />
            </div>
          </>
        ) : (
          <Tree
            defaultExpandAll
            showLine
            treeData={treeData}
            selectable={false}
          />
        )}
      </Card>

      <Modal
        title={editingRole ? "Edit Role" : "New Role"}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="label"
            label="Role Label"
            rules={[{ required: true, message: "Please enter Role Label" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role_name"
            label="Role Name"
            rules={[{ required: true, message: "Please enter Role Name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="reports_to_id" label="Reports To">
            <Select
              allowClear
              placeholder="Select parent role"
              options={roleOptions.filter((option) => option.value !== editingRole?.ID)}
            />
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
    </>
  );
}

const styles = {
  center: {
    minHeight: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  roleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
  },
} as const;