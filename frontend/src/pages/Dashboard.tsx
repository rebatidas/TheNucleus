import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    navigate("/login");
  };

  return (
    <div style={styles.appContainer}>
      
      {/* Top Navigation Bar */}
      <header style={styles.header}>
        <div style={styles.logo}>TheNucleus</div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Main Layout */}
      <div style={styles.bodyContainer}>
        
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarItem}>Dashboard</div>
          <div style={styles.sidebarItem}>Cases</div>
          <div style={styles.sidebarItem}>Customers</div>
          <div style={styles.sidebarItem}>Reports</div>
        </aside>

        {/* Main Content */}
        <main style={styles.mainContent}>
          <h1 style={styles.welcomeTitle}>
            Welcome to TheNucleus!
          </h1>

          <p style={styles.subtitle}>
            Your centralized CRM platform for managing customers,
            service cases, and operational workflows.
          </p>

          <div style={styles.infoBox}>
            <h3>System Status</h3>
            <p>Authentication system is active.</p>
            <p>Database connection successful.</p>
          </div>
        </main>

      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    height: "100vh",
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