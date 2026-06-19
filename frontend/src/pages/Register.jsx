import { useState } from "react";
import axios from "axios";
import { useNavigate} from "react-router-dom";
import { Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {

    if (!name || !email || !password) {
    alert("Please fill in all fields");
    return;
    }

    try {
      const res = await axios.post("http://localhost:5000/register", {
        name,
        email,
        password,
      });
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      console.log("FULL ERROR:", err);
      if (err.response) {
        alert(err.response.data?.message || err.message); // shows "Registration failed" or "Email already exists"
      } else {
        alert("Network error - backend not running?");
      }
    }
  };
  return (
    <div className="container">
        <div className="card">
      <h1>Register</h1>

      <input
        type="text"
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />
      <br /><br />

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

      <button onClick={handleRegister}>
        Register
      </button>

<p style={{ marginTop: "15px" }}>
  Already have an account?{" "}
  <Link to="/login">Login</Link>
</p>
      </div>
    </div>
  );
}

export default Register;