import React from "react";
import { useNavigate } from "react-router-dom";
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

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={styles.logo}>TheNucleus</div>
        </div>

        {token ? (
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        ) : null}
      </header>

      <div style={styles.bodyContainer}>
        {showSidebar && (
          <aside style={styles.sidebar}>
            <div style={styles.sidebarItem} onClick={() => navigate("/dashboard")}>Dashboard</div>
            <div style={styles.sidebarItem} onClick={() => navigate("/customers")}>Customers</div>
            <div style={styles.sidebarItem}>Reports</div>
          </aside>
        )}

        <main style={styles.mainContent}>
          <div style={styles.contentInner}>
            {title && <h1 style={styles.welcomeTitle}>{title}</h1>}
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
