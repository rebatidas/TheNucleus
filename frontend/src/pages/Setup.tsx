import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Menu,
  Card,
  Typography,
  Dropdown,
  Button,
  Table,
  Spin,
  Alert,
  Modal,
  Form,
  message,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  SearchOutlined,
  UserOutlined,
  ApartmentOutlined,
  BankOutlined,
  SettingOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";

const { Title, Text } = Typography;

type SetupSection = "users" | "roles" | "company" | null;

type UserRecord = {
  ID: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  name?: string;
  email: string;
  created_at?: string;
};

type CompanyInformation = {
  ID?: number;
  organization_name: string;
  website?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

type UserFormValues = {
  first_name?: string;
  last_name?: string;
  username?: string;
  email: string;
};

export default function Setup() {
  const [selectedKey, setSelectedKey] = useState<SetupSection>(null);
  const [searchText, setSearchText] = useState("");

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserSaving, setIsUserSaving] = useState(false);

  const [companyInfo, setCompanyInfo] = useState<CompanyInformation | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companySaving, setCompanySaving] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  const [userForm] = Form.useForm<UserFormValues>();
  const [companyForm] = Form.useForm<CompanyInformation>();
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const gearItems: MenuProps["items"] = [
    { key: "profile", label: "Profile" },
    { key: "setup", label: "Setup" },
    { key: "logout", label: "Logout" },
  ];

  const handleGearMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "profile") {
      navigate("/profile");
      return;
    }

    if (key === "setup") {
      window.open("/setup", "_blank");
      return;
    }

    if (key === "logout") {
      handleLogout();
    }
  };

  const items: MenuProps["items"] = useMemo(
    () => [
      { key: "users", icon: <UserOutlined />, label: "Users" },
      { key: "roles", icon: <ApartmentOutlined />, label: "Roles" },
      { key: "company", icon: <BankOutlined />, label: "Company Information" },
    ],
    []
  );

  const filteredItems =
    items?.filter((item) =>
      String(item?.label ?? "").toLowerCase().includes(searchText.toLowerCase())
    ) ?? [];

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const response = await api.get("/api/users");
      setUsers(response.data?.data ?? []);
    } catch (err: any) {
      setUsersError(err?.response?.data?.error ?? "Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCompanyInformation = async () => {
    try {
      setCompanyLoading(true);
      setCompanyError(null);

      const response = await api.get("/api/company-information");
      const data = response?.data?.data ?? null;

      if (data) {
        setCompanyInfo(data);
        companyForm.setFieldsValue(data);
        setIsEditingCompany(false);
      } else {
        setCompanyInfo(null);
        companyForm.resetFields();
        setIsEditingCompany(true);
      }
    } catch (err: any) {
      setCompanyError(
        err?.response?.data?.error ??
          err?.message ??
          "Failed to fetch Company Information"
      );
    } finally {
      setCompanyLoading(false);
    }
  };

  useEffect(() => {
    if (selectedKey === "users") {
      fetchUsers();
    }
    if (selectedKey === "company") {
      fetchCompanyInformation();
    }
  }, [selectedKey]);

  const openUserModal = (record: UserRecord) => {
    setSelectedUser(record);
    userForm.setFieldsValue({
      first_name: record.first_name || "",
      last_name: record.last_name || "",
      username: record.username || "",
      email: record.email || "",
    });
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
    userForm.resetFields();
  };

  const handleUserSave = async (values: UserFormValues) => {
    if (!selectedUser) return;

    try {
      setIsUserSaving(true);

      await api.put(`/api/users/${selectedUser.ID}`, values);
      messageApi.success("User updated successfully");
      closeUserModal();
      fetchUsers();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error ?? "Failed to update user");
    } finally {
      setIsUserSaving(false);
    }
  };

  const handleCompanySave = async (values: CompanyInformation) => {
    try {
      setCompanySaving(true);

      const response = companyInfo
        ? await api.put("/api/company-information", values)
        : await api.post("/api/company-information", values);

      setCompanyInfo(response.data?.data ?? null);
      companyForm.setFieldsValue(response.data?.data ?? {});
      setIsEditingCompany(false);
      messageApi.success(
        companyInfo
          ? "Company Information updated successfully"
          : "Company Information created successfully"
      );
    } catch (err: any) {
      messageApi.error(
        err?.response?.data?.error ?? "Failed to save Company Information"
      );
    } finally {
      setCompanySaving(false);
    }
  };

  const userColumns: ColumnsType<UserRecord> = [
    {
      title: "Name",
      key: "name",
      render: (_, record) =>
        [record.first_name, record.last_name].filter(Boolean).join(" ") ||
        record.name ||
        "-",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (value) => value || "-",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => openUserModal(record)}>
          Edit
        </Button>
      ),
    },
  ];

  const renderWelcome = () => (
    <div style={styles.welcomeWrap}>
      <div style={styles.welcomeInner}>
        <h1 style={styles.helloText}>Hello! {userName}</h1>
        <p style={styles.subText}>Welcome to Setup</p>

        <div style={styles.solarSystem}>
          <div style={styles.sun} />
          <div style={styles.orbitLarge}>
            <div style={styles.planetBlue} />
          </div>
          <div style={styles.orbitMedium}>
            <div style={styles.planetOrange} />
          </div>
          <div style={styles.orbitSmall}>
            <div style={styles.planetPurple} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersSection = () => {
    if (usersLoading) {
      return (
        <div style={styles.sectionCenter}>
          <Spin tip="Loading users..." />
        </div>
      );
    }

    if (usersError) {
      return <Alert type="error" message={usersError} />;
    }

    return (
      <>
        <Card style={styles.contentCard}>
          <Title level={3} style={{ marginTop: 0 }}>
            Users
          </Title>
          <Table
            rowKey="ID"
            columns={userColumns}
            dataSource={users}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Modal
          title="Edit User"
          open={isUserModalOpen}
          onCancel={closeUserModal}
          footer={null}
          destroyOnClose
        >
          <Form form={userForm} layout="vertical" onFinish={handleUserSave}>
            <Form.Item name="first_name" label="First Name">
              <Input />
            </Form.Item>

            <Form.Item name="last_name" label="Last Name">
              <Input />
            </Form.Item>

            <Form.Item name="username" label="Username">
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

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={closeUserModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={isUserSaving}>
                  Save
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  };

  const renderCompanySection = () => {
    if (companyLoading) {
      return (
        <div style={styles.sectionCenter}>
          <Spin tip="Loading Company Information..." />
        </div>
      );
    }

    if (companyError) {
      return <Alert type="error" message={companyError} />;
    }

    return (
      <Card style={styles.contentCard}>
        <Title level={3} style={{ marginTop: 0 }}>
          {companyInfo ? "Company Information" : "New Company Information"}
        </Title>

        <Form form={companyForm} layout="vertical" onFinish={handleCompanySave}>
          <Form.Item
            name="organization_name"
            label="Organization Name"
            rules={[{ required: true, message: "Please enter Organization Name" }]}
          >
            <Input disabled={!!companyInfo && !isEditingCompany} />
          </Form.Item>

          <Form.Item name="website" label="Website">
            <Input disabled={!!companyInfo && !isEditingCompany} />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input disabled={!!companyInfo && !isEditingCompany} />
          </Form.Item>

          <Form.Item name="street" label="Street">
            <Input disabled={!!companyInfo && !isEditingCompany} />
          </Form.Item>

          <Form.Item name="city" label="City">
            <Input disabled={!!companyInfo && !isEditingCompany} />
          </Form.Item>

          <Form.Item name="state" label="State">
            <Input disabled={!!companyInfo && !isEditingCompany} />
          </Form.Item>

          <Form.Item name="postal_code" label="Postal Code">
            <Input disabled={!!companyInfo && !isEditingCompany} />
          </Form.Item>

          <Form.Item name="country" label="Country">
            <Input disabled={!!companyInfo && !isEditingCompany} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              {companyInfo && !isEditingCompany ? (
                <Button type="primary" onClick={() => setIsEditingCompany(true)}>
                  Edit
                </Button>
              ) : (
                <>
                  {companyInfo ? (
                    <Button onClick={() => setIsEditingCompany(false)}>Cancel</Button>
                  ) : null}
                  <Button type="primary" htmlType="submit" loading={companySaving}>
                    Save
                  </Button>
                </>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  const renderContent = () => {
    if (!selectedKey) {
      return renderWelcome();
    }

    switch (selectedKey) {
      case "users":
        return renderUsersSection();
      case "roles":
        return (
          <Card style={styles.contentCard}>
            <Title level={3} style={{ marginTop: 0 }}>
              Roles
            </Title>
            <Text>Role hierarchy and role management will be displayed here.</Text>
          </Card>
        );
      case "company":
        return renderCompanySection();
      default:
        return renderWelcome();
    }
  };

  return (
    <div style={styles.page}>
      {contextHolder}

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo} onClick={() => navigate("/dashboard")}>
            TheNucleus
          </div>
        </div>

        <Dropdown
          menu={{ items: gearItems, onClick: handleGearMenuClick }}
          trigger={["click"]}
        >
          <Button
            type="primary"
            shape="circle"
            icon={<SettingOutlined />}
            style={styles.gearBtn}
          />
        </Dropdown>
      </header>

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <SettingOutlined style={{ fontSize: 18 }} />
            <span style={styles.sidebarTitle}>Setup</span>
          </div>

          <Input
            placeholder="Quick Find"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <Menu
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={filteredItems}
            onClick={(e) => setSelectedKey(e.key as SetupSection)}
            style={{ borderRight: 0 }}
          />
        </aside>

        <main style={styles.content}>{renderContent()}</main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100vw",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    background: "#f3f6f9",
    overflow: "hidden",
  },

  header: {
    height: "60px",
    backgroundColor: "#032d60",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 30px",
    fontWeight: 600,
    fontSize: "18px",
    flexShrink: 0,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    fontSize: "20px",
    letterSpacing: "0.5px",
    cursor: "pointer",
  },

  gearBtn: {
    backgroundColor: "#0176d3",
    border: "none",
  },

  body: {
    flex: 1,
    display: "flex",
    minHeight: "calc(100vh - 60px)",
  },

  sidebar: {
    width: 280,
    minWidth: 280,
    background: "#ffffff",
    borderRight: "1px solid #e0e5ee",
    padding: 16,
    boxSizing: "border-box" as const,
    overflowY: "auto" as const,
  },

  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    color: "#032d60",
    fontWeight: 700,
  },

  sidebarTitle: {
    fontSize: "18px",
  },

  content: {
    flex: 1,
    minWidth: 0,
    padding: 24,
    boxSizing: "border-box" as const,
    overflow: "auto",
    display: "block",
  },

  contentCard: {
    width: "100%",
  },

  sectionCenter: {
    width: "100%",
    minHeight: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  welcomeWrap: {
    width: "100%",
    minHeight: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box" as const,
  },

  welcomeInner: {
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  helloText: {
    margin: 0,
    fontSize: "48px",
    fontWeight: 800,
    color: "#032d60",
    lineHeight: 1.1,
  },

  subText: {
    margin: 0,
    fontSize: "18px",
    color: "#5f6c80",
  },

  solarSystem: {
    position: "relative" as const,
    width: 220,
    height: 220,
    marginTop: 20,
    opacity: 0.9,
  },

  sun: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "radial-gradient(circle, #ffd76a 0%, #ffb703 70%, #fb8500 100%)",
    transform: "translate(-50%, -50%)",
    boxShadow: "0 0 24px rgba(255,183,3,0.35)",
  },

  orbitLarge: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    width: 180,
    height: 180,
    borderRadius: "50%",
    border: "1px solid rgba(3,45,96,0.12)",
    transform: "translate(-50%, -50%)",
  },

  orbitMedium: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    width: 130,
    height: 130,
    borderRadius: "50%",
    border: "1px solid rgba(3,45,96,0.10)",
    transform: "translate(-50%, -50%)",
  },

  orbitSmall: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    width: 84,
    height: 84,
    borderRadius: "50%",
    border: "1px solid rgba(3,45,96,0.08)",
    transform: "translate(-50%, -50%)",
  },

  planetBlue: {
    position: "absolute" as const,
    top: 18,
    right: 22,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#4dabf7",
    boxShadow: "0 0 10px rgba(77,171,247,0.25)",
  },

  planetOrange: {
    position: "absolute" as const,
    bottom: 18,
    left: 18,
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#ff922b",
    boxShadow: "0 0 8px rgba(255,146,43,0.2)",
  },

  planetPurple: {
    position: "absolute" as const,
    top: 10,
    left: 28,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#9775fa",
    boxShadow: "0 0 8px rgba(151,117,250,0.2)",
  },
} as const;