import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authSlice";

function Login() {
    const dispatch = useDispatch();
    const { loading, error } = useSelector(
    (state) => state.auth
    );
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
const [formError, setFormError] = useState("");
  const handleLogin = async () => {

    if (!email || !password) {
      setFormError("Please fill in all fields");
    return;
    }

    try {
      const result = await dispatch(
  loginUser({ email, password })
);

if (loginUser.fulfilled.match(result)) {
  navigate("/dashboard");
}
    } catch (err) {
      alert(err.response?.data || "Login failed");
    }
  };

  return (
    <div className="container">
        <div className="card">
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />
        {formError && <p className="error-message">{formError}</p>}
      <button onClick={handleLogin} disabled={loading}>
  {loading ? "Logging in..." : "Login"}
</button>
{error && <p>{error}</p>}
      <p style={{ marginTop: "15px" }}>
  Don't have an account?{" "}
  <Link to="/">Register</Link>
</p>
    </div>
    </div>
  );
}

export default Login;