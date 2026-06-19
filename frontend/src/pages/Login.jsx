import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");

  const handleLogin = async () => {

    if (!email || !password) {
    alert("Please enter email and password");
    return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
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

      <button onClick={handleLogin}>Login</button>
      <p style={{ marginTop: "15px" }}>
  Don't have an account?{" "}
  <Link to="/">Register</Link>
</p>
    </div>
    </div>
  );
}

export default Login;