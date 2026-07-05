import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="unauthorized-icon">🔒</div>
        <h1 style={{ fontSize: "72px", marginBottom: "8px" }}>403</h1>
        <h2 style={{ color: "#f97316", fontSize: "22px", marginBottom: "12px" }}>
          Access Denied
        </h2>
        <p style={{ color: "#cbd5e1", marginBottom: "30px", fontSize: "15px" }}>
          You don't have permission to view this page. </p>
        <Link to="/dashboard" className="auth-btn" style={{ display: "block", textDecoration: "none" }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;