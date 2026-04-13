import React from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown, Button } from "antd";
import type { MenuProps } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";

type Props = {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
};

export default function AppLayout({ children, title, showSidebar = true }: Props) {
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  const items: MenuProps["items"] = [
    { key: "profile", label: "Profile" },
    { key: "setup", label: "Setup" },
    { key: "logout", label: "Logout" },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
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

  return (
    <div style={styles.appContainer} data-cy="app-layout">
      <header style={styles.header} data-cy="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={styles.logo} data-cy="app-logo">
            TheNucleus
          </div>
        </div>

        {token ? (
          <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={["click"]}>
            <Button
              type="primary"
              shape="circle"
              icon={<SettingOutlined />}
              style={styles.gearBtn}
              data-cy="header-gear-menu"
            />
          </Dropdown>
        ) : null}
      </header>

      <div style={styles.bodyContainer} data-cy="app-body">
        {showSidebar && (
          <aside style={styles.sidebar} data-cy="app-sidebar">
            <div
              style={styles.sidebarItem}
              onClick={() => navigate("/dashboard")}
              data-cy="nav-dashboard"
            >
              Dashboard
            </div>

            <div
              style={styles.sidebarItem}
              onClick={() => navigate("/customers")}
              data-cy="nav-customers"
            >
              Customers
            </div>

            <div
              style={styles.sidebarItem}
              onClick={() => navigate("/cases")}
              data-cy="nav-cases"
            >
              Cases
            </div>

            <div style={styles.sidebarItem} data-cy="nav-reports">
              Reports
            </div>
          </aside>
        )}

        <main style={styles.mainContent} data-cy="app-main-content">
          <div style={styles.contentInner} data-cy="app-content-inner">
            {title && (
              <h1 style={styles.welcomeTitle} data-cy="page-title">
                {title}
              </h1>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    height: "100vh",
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

  gearBtn: {
    backgroundColor: "#0176d3",
    border: "none",
  },

  bodyContainer: {
    flex: 1,
    display: "flex",
    backgroundColor: "#f3f6f9",
    minHeight: "calc(100vh - 60px)",
  },

  sidebar: {
    width: 220,
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e0e5ee",
    padding: "20px 0",
    height: "100%",
    boxSizing: "border-box" as const,
    position: "relative" as const,
  },

  sidebarItem: {
    padding: "14px 25px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#032d60",
  },

  mainContent: {
    flex: 1,
    padding: "24px",
    width: "100%",
    boxSizing: "border-box" as const,
    overflow: "auto",
  },

  contentInner: {
    width: "100%",
    margin: 0,
    background: "transparent",
    padding: "16px",
  },

  welcomeTitle: {
    fontSize: "42px",
    fontWeight: 700,
    marginBottom: "15px",
    color: "#032d60",
  },
} as const;