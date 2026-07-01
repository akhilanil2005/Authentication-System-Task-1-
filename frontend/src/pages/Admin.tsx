import { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

function Admin() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const handleCreateNotification = async () => {
    await axios.post("/notifications", {
  userId,
  title,
  message,
});

    alert("Notification Created");

    setTitle("");
    setMessage("");
  };
    useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await axios.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  fetchUsers();
}, []);

  return (
    <>
    <Navbar
        email={localStorage.getItem("email") || ""}
        role={localStorage.getItem("role") || ""}
/>
    <div className="admin-container">
      <div className="admin-card">
      <h1 className="admin-title">Admin Page</h1>

      <h2 className="admin-subtitle">Create Notification</h2>
      <div className="admin-form">
     <select
  value={userId}
  onChange={(e) => setUserId(e.target.value)}
>
  <option value="all">All Users</option>
  <option value="">Select User</option>

  {users.map((user) => (
    <option key={user.id} value={user.id}>
      {user.name} ({user.email})
    </option>
  ))}
</select>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
  placeholder="Message"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
/>
      <button className="create-btn"onClick={handleCreateNotification}>
        Create Notification
      </button>
      </div>
      </div>
    </div>
    </>
  );
}

export default Admin;