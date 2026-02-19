import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken, api } from "../api/client";
import "antd/dist/reset.css";
import { Table, Spin, Empty, Alert } from "antd";
import AppLayout from "../components/AppLayout";

interface CaseItem {
  id: number;
  title: string;
  status: string;
  created_at?: string;
}

const mockCases: CaseItem[] = [
  { id: 1, title: "Website outage - client A", status: "open", created_at: new Date().toISOString() },
  { id: 2, title: "Billing discrepancy - client B", status: "in_progress", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, title: "Feature request: export CSV", status: "closed", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 4, title: "Data sync failed - nightly job", status: "open", created_at: new Date(Date.now() - 6 * 3600000).toISOString() },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // no auth token — show mock data in dev/local scenarios
      setCases(mockCases);
      return;
    }
    setAuthToken(token);
    setLoading(true);
    api
      .get("/api/cases")
      .then((res) => {
        const data = res.data?.data?.cases ?? [];
        setCases(data);
      })
      .catch((err) => {
        // fallback to mock data so dashboard remains usable offline
        setCases(mockCases);
        setError(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) => (val ? new Date(val).toLocaleString() : "-"),
    },
  ];

  return (
    <AppLayout title="My Cases">
      {loading ? (
        <Spin tip="Loading cases..." />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : cases.length === 0 ? (
        <Empty description="No cases found" />
      ) : (
        <Table rowKey={(r: any) => r.id} dataSource={cases} columns={columns} />
      )}
    </AppLayout>
  );
}

const styles = {
  appContainer: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    fontFamily: "Inter, system-ui, sans-serif",
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
  },

  logo: {
    fontSize: "20px",
    letterSpacing: "0.5px",
  },

  logoutBtn: {
    backgroundColor: "#0176d3",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },

  bodyContainer: {
    flex: 1,
    display: "flex",
    backgroundColor: "#f3f6f9",
  },

  sidebar: {
    width: "220px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e0e5ee",
    padding: "20px 0",
  },

  sidebarItem: {
    padding: "14px 25px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#032d60",
  },

  mainContent: {
    flex: 1,
    padding: "40px 60px",
    width: "100%",
    boxSizing: "border-box" as const,
  },

  welcomeTitle: {
    fontSize: "42px",
    fontWeight: 700,
    marginBottom: "15px",
    color: "#032d60",
  },

  subtitle: {
    fontSize: "18px",
    color: "#5f6c80",
    marginBottom: "40px",
  },

  infoBox: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    maxWidth: "500px",
  },
} as const;