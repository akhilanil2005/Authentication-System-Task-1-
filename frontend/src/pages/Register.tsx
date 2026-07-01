import { useState } from "react";
import axios from "axios";
import { useNavigate} from "react-router-dom";
import { Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");

  const handleRegister = async () => {

    if (!name || !email || !password) {
  setFormError("Please fill in all fields");
  return;
}

    try {
      const res = await axios.post("http://localhost:5000/register", {
        name,
        email,
        password,
      });
      setFormError("Registration successful! Redirecting to login...");
setTimeout(() => {
              navigate("/login");
                  }, 1500);
    } 
    catch (err) {
  if (axios.isAxiosError(err)) {
    setFormError(
      err.response?.data?.message || err.message
    );
  } else {
    setFormError("Registration failed");
  }
}
  };
  return (
  <div className="auth-container">
    <div className="auth-card">
      <h1>Register</h1>

      <input
        type="text"
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      {formError && (
        <div className="error-message">
          {formError}
        </div>
      )}

      <button
  className="auth-btn"
  onClick={handleRegister}
>
  Register
</button>

      <p className="auth-link">
        Already have an account?{" "}
        <Link to="/login">Login</Link>
      </p>
    </div>
  </div>
);
}

export default Register;