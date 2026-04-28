import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Col, Empty, Row, Spin, Tag, Typography } from "antd";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

const { Text, Title } = Typography;

type Customer = {
  ID: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type CaseRecord = {
  id: number;
  case_number: string;
  status: string;
  subject: string;
  customer_id: number;
  customer?: Customer;
  created_date: string;
};

const STATUS_COLORS: Record<string, string> = {
  New: "#fa8c16",
  "In Progress": "#1677ff",
  Closed: "#52c41a",
};

const STATUS_TAG_COLORS: Record<string, string> = {
  New: "orange",
  "In Progress": "blue",
  Closed: "green",
};

function statusTag(status: string) {
  return (
    <Tag color={STATUS_TAG_COLORS[status] ?? "default"} style={{ margin: 0 }}>
      {status}
    </Tag>
  );
}

function sliceColor(status: string) {
  return STATUS_COLORS[status] ?? "#8c8c8c";
}

export default function Dashboard() {
  const [myCases, setMyCases] = useState<CaseRecord[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const [recentCases, setRecentCases] = useState<CaseRecord[]>([]);
  const [recentCasesLoading, setRecentCasesLoading] = useState(true);

  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [recentCustomersLoading, setRecentCustomersLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/cases?view=my_cases")
      .then((res) => setMyCases(res.data?.data ?? []))
      .catch(() => setMyCases([]))
      .finally(() => setCasesLoading(false));

    api
      .get("/api/recently-viewed/cases")
      .then((res) => setRecentCases(res.data?.data ?? []))
      .catch(() => setRecentCases([]))
      .finally(() => setRecentCasesLoading(false));

    api
      .get("/api/recently-viewed/customers")
      .then((res) => setRecentCustomers(res.data?.data ?? []))
      .catch(() => setRecentCustomers([]))
      .finally(() => setRecentCustomersLoading(false));
  }, []);

  const stageMap = myCases.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(stageMap).map(([name, value]) => ({
    name,
    value,
  }));

  const stagedCases = selectedStage
    ? myCases.filter((c) => c.status === selectedStage)
    : [];

  function handleSliceClick(entry: { name: string }) {
    setSelectedStage((prev) => (prev === entry.name ? null : entry.name));
  }

  return (
    <AppLayout title="Dashboard">
      <div style={{ paddingBottom: 32 }}>
        {/* ── Cases by Stage ── */}
        <Title level={4} style={sectionTitle}>
          Cases by Stage
        </Title>
        <Card style={cardStyle}>
          {casesLoading ? (
            <div style={centeredStyle}>
              <Spin tip="Loading cases..." />
            </div>
          ) : myCases.length === 0 ? (
            <Empty description="No cases assigned to you" />
          ) : (
            <Row gutter={32} align="middle">
              <Col xs={24} md={selectedStage ? 12 : 24}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={handleSliceClick}
                      style={{ cursor: "pointer" }}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={sliceColor(entry.name)}
                          opacity={
                            selectedStage && selectedStage !== entry.name
                              ? 0.35
                              : 1
                          }
                          stroke={
                            selectedStage === entry.name ? "#032d60" : "none"
                          }
                          strokeWidth={selectedStage === entry.name ? 2 : 0}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} case${value !== 1 ? "s" : ""}`,
                        name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <Text
                  type="secondary"
                  style={{ display: "block", textAlign: "center", fontSize: 12 }}
                >
                  Click a slice to view cases in that stage
                </Text>
              </Col>

              {selectedStage && (
                <Col xs={24} md={12}>
                  <div style={stageListHeader}>
                    <Text strong style={{ color: "#032d60", fontSize: 15 }}>
                      {selectedStage}{" "}
                      <span style={{ color: "#888", fontWeight: 400 }}>
                        ({stagedCases.length})
                      </span>
                    </Text>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedStage(null)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setSelectedStage(null)
                      }
                      style={clearButtonStyle}
                    >
                      Clear
                    </span>
                  </div>
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {stagedCases.map((c) => (
                      <Link
                        to={`/cases/${c.id}`}
                        key={c.id}
                        style={{ textDecoration: "none" }}
                      >
                        <div style={caseRowStyle}>
                          <div style={caseRowTopStyle}>
                            <Text
                              style={{
                                fontWeight: 600,
                                color: "#0176d3",
                                fontSize: 13,
                              }}
                            >
                              {c.case_number}
                            </Text>
                            {statusTag(c.status)}
                          </div>
                          <Text style={{ color: "#444", fontSize: 13 }}>
                            {c.subject}
                          </Text>
                          {c.customer && (
                            <Text
                              style={{
                                color: "#888",
                                fontSize: 12,
                                display: "block",
                                marginTop: 2,
                              }}
                            >
                              {c.customer.first_name} {c.customer.last_name}
                            </Text>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </Col>
              )}
            </Row>
          )}
        </Card>

        {/* ── Recently Viewed ── */}
        <Row gutter={24} style={{ marginTop: 8 }}>
          <Col xs={24} md={12}>
            <Title level={4} style={sectionTitle}>
              Recently Viewed Cases
            </Title>
            <Card style={{ ...cardStyle, minHeight: 180 }}>
              {recentCasesLoading ? (
                <div style={centeredStyle}>
                  <Spin />
                </div>
              ) : recentCases.length === 0 ? (
                <Empty description="No recently viewed cases" />
              ) : (
                recentCases.map((c) => (
                  <Link
                    to={`/cases/${c.id}`}
                    key={c.id}
                    style={{ textDecoration: "none" }}
                  >
                    <div style={recentRowStyle}>
                      <div style={caseRowTopStyle}>
                        <Text
                          style={{
                            fontWeight: 600,
                            color: "#0176d3",
                            fontSize: 13,
                          }}
                        >
                          {c.case_number}
                        </Text>
                        {statusTag(c.status)}
                      </div>
                      <Text style={{ color: "#555", fontSize: 13 }}>
                        {c.subject}
                      </Text>
                    </div>
                  </Link>
                ))
              )}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Title level={4} style={sectionTitle}>
              Recently Viewed Customers
            </Title>
            <Card style={{ ...cardStyle, minHeight: 180 }}>
              {recentCustomersLoading ? (
                <div style={centeredStyle}>
                  <Spin />
                </div>
              ) : recentCustomers.length === 0 ? (
                <Empty description="No recently viewed customers" />
              ) : (
                recentCustomers.map((cust) => (
                  <Link
                    to={`/customers/${cust.ID}`}
                    key={cust.ID}
                    style={{ textDecoration: "none" }}
                  >
                    <div style={recentRowStyle}>
                      <Text
                        style={{
                          fontWeight: 600,
                          color: "#0176d3",
                          fontSize: 14,
                          display: "block",
                        }}
                      >
                        {cust.first_name} {cust.last_name}
                      </Text>
                      <Text style={{ color: "#888", fontSize: 12 }}>
                        {cust.email}
                      </Text>
                    </div>
                  </Link>
                ))
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}

const sectionTitle: React.CSSProperties = {
  color: "#032d60",
  marginBottom: 12,
  marginTop: 0,
};

const cardStyle: React.CSSProperties = {
  borderRadius: 10,
  marginBottom: 24,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const centeredStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "24px 0",
};

const stageListHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const clearButtonStyle: React.CSSProperties = {
  cursor: "pointer",
  color: "#0176d3",
  fontSize: 13,
};

const caseRowTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
};

const caseRowStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  marginBottom: 8,
  backgroundColor: "#f8fafc",
  border: "1px solid #e8ecf0",
  cursor: "pointer",
};

const recentRowStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 8,
  backgroundColor: "#f8fafc",
  border: "1px solid #e8ecf0",
  cursor: "pointer",
};
