import { useEffect, useState } from "react";
import { Alert, Button, Card, Select, Space, Spin, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { api } from "../api/client";

const { Title, Paragraph } = Typography;

type OrgWideDefault = {
  ID?: number;
  object_name: "Customers" | "Cases";
  access_level: "Private" | "PublicReadOnly" | "PublicReadWrite";
};

const ACCESS_OPTIONS = [
  { label: "Private", value: "Private" },
  { label: "Public Read Only", value: "PublicReadOnly" },
  { label: "Public Read/Write", value: "PublicReadWrite" },
];

export default function SetupSharingSettingsSection() {
  const [records, setRecords] = useState<OrgWideDefault[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const fetchDefaults = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/org-wide-defaults");
      setRecords(response.data?.data ?? []);
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to load sharing settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaults();
  }, []);

  const updateRecord = (
    objectName: OrgWideDefault["object_name"],
    accessLevel: OrgWideDefault["access_level"]
  ) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.object_name === objectName
          ? { ...record, access_level: accessLevel }
          : record
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = records.map((record) => ({
        object_name: record.object_name,
        access_level: record.access_level,
      }));

      const response = await api.put("/api/org-wide-defaults", payload);
      setRecords(response.data?.data ?? []);
      messageApi.success("Sharing settings saved successfully");
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to save sharing settings");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<OrgWideDefault> = [
    {
      title: "Object",
      dataIndex: "object_name",
      key: "object_name",
    },
    {
      title: "Default Internal Access",
      dataIndex: "access_level",
      key: "access_level",
      render: (_, record) => (
        <Select
          value={record.access_level}
          style={{ width: 240 }}
          options={ACCESS_OPTIONS}
          onChange={(value) => updateRecord(record.object_name, value)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        {contextHolder}
        <Spin tip="Loading sharing settings..." />
      </Card>
    );
  }

  return (
    <Card>
      {contextHolder}

      <Title level={3} style={{ marginTop: 0 }}>
        Sharing Settings
      </Title>

      <Paragraph>
        Configure org-wide defaults for record-level access. Private restricts records to owners
        and parent roles. Public Read Only allows viewing but blocks editing. Public Read/Write
        allows viewing and editing.
      </Paragraph>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Role hierarchy access is handled automatically by the backend."
      />

      <Table
        rowKey="object_name"
        columns={columns}
        dataSource={records}
        pagination={false}
      />

      <Space style={{ marginTop: 16 }}>
        <Button type="primary" loading={saving} onClick={handleSave}>
          Save
        </Button>
        <Button onClick={fetchDefaults}>Cancel</Button>
      </Space>
    </Card>
  );
}