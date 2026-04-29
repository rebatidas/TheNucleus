import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Typography,
  message,
  Tabs,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { api } from "../api/client";

const { Title, Text } = Typography;

type ProfileRecord = {
  ID: number;
  name: string;
  description?: string;
};

type ObjectPermission = {
  object_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

type FieldPermission = {
  object_name: string;
  field_name: string;
  visible: boolean;
  read_only: boolean;
};

type ProfileDetailResponse = {
  profile: ProfileRecord;
  object_permissions: ObjectPermission[];
  field_permissions: FieldPermission[];
};

const SUPPORTED_OBJECTS = [
  "Customers",
  "Cases",
  "Users",
  "Roles",
  "Profiles",
  "Company Information",
];

const SUPPORTED_FIELDS: Record<string, string[]> = {
  Customers: [
    "salutation",
    "first_name",
    "middle_name",
    "last_name",
    "email",
    "phone",
    "shipping_address",
    "billing_address",
  ],
  Cases: [
    "case_number",
    "status",
    "subject",
    "description",
    "customer_id",
    "resolution",
  ],
  Users: [
    "first_name",
    "last_name",
    "username",
    "email",
    "role_id",
    "profile_id",
  ],
  Roles: ["label", "role_name", "reports_to_id"],
  Profiles: ["name", "description"],
  "Company Information": [
    "organization_name",
    "website",
    "phone",
    "street",
    "city",
    "state",
    "postal_code",
    "country",
  ],
};

export default function SetupProfilesSection() {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProfile, setSelectedProfile] = useState<ProfileRecord | null>(null);
  const [objectPermissions, setObjectPermissions] = useState<ObjectPermission[]>([]);
  const [fieldPermissions, setFieldPermissions] = useState<FieldPermission[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/profiles");
      setProfiles(response.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileDetail = async (profileId: number) => {
    try {
      setDetailLoading(true);
      const response = await api.get(`/api/profiles/${profileId}`);
      const data: ProfileDetailResponse = response.data?.data;

      setSelectedProfile(data.profile);

      const existingObjectPermissions = data.object_permissions ?? [];
      const existingFieldPermissions = data.field_permissions ?? [];

      const normalizedObjects = SUPPORTED_OBJECTS.map((objectName) => {
        const existing = existingObjectPermissions.find((p) => p.object_name === objectName);
        return (
          existing || {
            object_name: objectName,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
          }
        );
      });

      const normalizedFields: FieldPermission[] = [];
      Object.entries(SUPPORTED_FIELDS).forEach(([objectName, fields]) => {
        fields.forEach((fieldName) => {
          const existing = existingFieldPermissions.find(
            (p) => p.object_name === objectName && p.field_name === fieldName
          );
          normalizedFields.push(
            existing || {
              object_name: objectName,
              field_name: fieldName,
              visible: true,
              read_only: false,
            }
          );
        });
      });

      setObjectPermissions(normalizedObjects);
      setFieldPermissions(normalizedFields);
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to fetch profile details");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateProfile = async (values: any) => {
    try {
      setCreateSaving(true);
      const response = await api.post("/api/profiles", values);
      messageApi.success("Profile created successfully");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      await fetchProfiles();

      const newProfile = response.data?.data;
      if (newProfile?.ID) {
        fetchProfileDetail(newProfile.ID);
      }
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to create profile");
    } finally {
      setCreateSaving(false);
    }
  };

  const openEditProfile = (profile: ProfileRecord) => {
    setSelectedProfile(profile);
    editForm.setFieldsValue({
      name: profile.name,
      description: profile.description,
    });
    setIsEditModalOpen(true);
  };

  const handleEditProfile = async (values: any) => {
    if (!selectedProfile) return;

    try {
      setEditSaving(true);
      const response = await api.put(`/api/profiles/${selectedProfile.ID}`, values);
      messageApi.success("Profile updated successfully");
      setIsEditModalOpen(false);
      editForm.resetFields();
      await fetchProfiles();

      const updatedProfile = response.data?.data;
      if (updatedProfile?.ID) {
        fetchProfileDetail(updatedProfile.ID);
      }
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to update profile");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    try {
      setDeleteLoadingId(profileId);
      await api.delete(`/api/profiles/${profileId}`);
      messageApi.success("Profile deleted successfully");

      if (selectedProfile?.ID === profileId) {
        setSelectedProfile(null);
        setObjectPermissions([]);
        setFieldPermissions([]);
      }

      await fetchProfiles();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to delete profile");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleSaveObjectPermissions = async () => {
    if (!selectedProfile) return;

    try {
      await api.put(
        `/api/profiles/${selectedProfile.ID}/object-permissions`,
        objectPermissions
      );
      messageApi.success("Object permissions updated successfully");
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to update object permissions");
    }
  };

  const handleSaveFieldPermissions = async () => {
    if (!selectedProfile) return;

    try {
      await api.put(
        `/api/profiles/${selectedProfile.ID}/field-permissions`,
        fieldPermissions
      );
      messageApi.success("Field permissions updated successfully");
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to update field permissions");
    }
  };

  const groupedFieldPermissions = useMemo(() => {
    return Object.keys(SUPPORTED_FIELDS).map((objectName) => ({
      object_name: objectName,
      fields: fieldPermissions.filter((item) => item.object_name === objectName),
    }));
  }, [fieldPermissions]);

  const profileColumns: ColumnsType<ProfileRecord> = [
    {
      title: "Profile Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Button type="link" onClick={() => fetchProfileDetail(record.ID)}>
          {record.name}
        </Button>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => value || "-",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditProfile(record)}>
            Edit
          </Button>

          <Popconfirm
            title="Delete profile"
            description="Are you sure you want to delete this profile?"
            onConfirm={() => handleDeleteProfile(record.ID)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleteLoadingId === record.ID}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const objectPermissionColumns: ColumnsType<ObjectPermission> = [
    {
      title: "Object",
      dataIndex: "object_name",
      key: "object_name",
    },
    {
      title: "View",
      key: "can_view",
      render: (_, record) => (
        <Checkbox
          checked={record.can_view}
          onChange={(e) =>
            setObjectPermissions((prev) =>
              prev.map((item) =>
                item.object_name === record.object_name
                  ? { ...item, can_view: e.target.checked }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: "Create",
      key: "can_create",
      render: (_, record) => (
        <Checkbox
          checked={record.can_create}
          onChange={(e) =>
            setObjectPermissions((prev) =>
              prev.map((item) =>
                item.object_name === record.object_name
                  ? { ...item, can_create: e.target.checked }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: "Edit",
      key: "can_edit",
      render: (_, record) => (
        <Checkbox
          checked={record.can_edit}
          onChange={(e) =>
            setObjectPermissions((prev) =>
              prev.map((item) =>
                item.object_name === record.object_name
                  ? { ...item, can_edit: e.target.checked }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: "Delete",
      key: "can_delete",
      render: (_, record) => (
        <Checkbox
          checked={record.can_delete}
          onChange={(e) =>
            setObjectPermissions((prev) =>
              prev.map((item) =>
                item.object_name === record.object_name
                  ? { ...item, can_delete: e.target.checked }
                  : item
              )
            )
          }
        />
      ),
    },
  ];

  const fieldPermissionColumns: ColumnsType<FieldPermission> = [
    {
      title: "Field",
      dataIndex: "field_name",
      key: "field_name",
    },
    {
      title: "Visible",
      key: "visible",
      render: (_, record) => (
        <Checkbox
          checked={record.visible}
          onChange={(e) =>
            setFieldPermissions((prev) =>
              prev.map((item) =>
                item.object_name === record.object_name &&
                item.field_name === record.field_name
                  ? { ...item, visible: e.target.checked }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: "Read Only",
      key: "read_only",
      render: (_, record) => (
        <Checkbox
          checked={record.read_only}
          onChange={(e) =>
            setFieldPermissions((prev) =>
              prev.map((item) =>
                item.object_name === record.object_name &&
                item.field_name === record.field_name
                  ? { ...item, read_only: e.target.checked }
                  : item
              )
            )
          }
        />
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <Card
        style={{ width: "100%" }}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Profile
          </Button>
        }
      >
        <Title level={3} style={{ marginTop: 0 }}>
          Profiles
        </Title>

        {loading ? (
          <Spin />
        ) : error ? (
          <Alert type="error" message={error} />
        ) : (
          <Table
            rowKey="ID"
            columns={profileColumns}
            dataSource={profiles}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {selectedProfile ? (
        <Card style={{ width: "100%", marginTop: 24 }}>
          <Title level={4} style={{ marginTop: 0 }}>
            {selectedProfile.name}
          </Title>
          <Text>{selectedProfile.description || "No description"}</Text>

          {detailLoading ? (
            <div style={{ marginTop: 20 }}>
              <Spin />
            </div>
          ) : (
            <Tabs
              style={{ marginTop: 20 }}
              items={[
                {
                  key: "object-permissions",
                  label: "Object Permissions",
                  children: (
                    <>
                      <Table
                        rowKey="object_name"
                        columns={objectPermissionColumns}
                        dataSource={objectPermissions}
                        pagination={false}
                      />
                      <div style={{ marginTop: 16, textAlign: "right" }}>
                        <Button type="primary" onClick={handleSaveObjectPermissions}>
                          Save Object Permissions
                        </Button>
                      </div>
                    </>
                  ),
                },
                {
                  key: "field-permissions",
                  label: "Field-Level Security",
                  children: (
                    <>
                      <Collapse
                        items={groupedFieldPermissions.map((group) => ({
                          key: group.object_name,
                          label: group.object_name,
                          children: (
                            <Table
                              rowKey={(record) =>
                                `${record.object_name}-${record.field_name}`
                              }
                              columns={fieldPermissionColumns}
                              dataSource={group.fields}
                              pagination={false}
                            />
                          ),
                        }))}
                      />
                      <div style={{ marginTop: 16, textAlign: "right" }}>
                        <Button type="primary" onClick={handleSaveFieldPermissions}>
                          Save Field Permissions
                        </Button>
                      </div>
                    </>
                  ),
                },
              ]}
            />
          )}
        </Card>
      ) : null}

      <Modal
        title="New Profile"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={null}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateProfile}>
          <Form.Item
            name="name"
            label="Profile Name"
            rules={[{ required: true, message: "Please enter profile name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  createForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={createSaving}>
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Profile"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditProfile}>
          <Form.Item
            name="name"
            label="Profile Name"
            rules={[{ required: true, message: "Please enter profile name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  editForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={editSaving}>
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}