import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

function Admin() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const handleCreateNotification = async () => {
    if (!userId) {
      toast.error("Please select a recipient.");
      return;
    }
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    try {
      await axios.post("/notifications", {
        userId,
        title,
        message,
      });

      toast.success("Notification created successfully!");

      setTitle("");
      setMessage("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create notification.");
    }
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
      <Navbar />
      <div className="admin-container">
        <div className="admin-card">
          <h1 className="admin-title">Admin Announcement</h1>

          <h2 className="admin-subtitle">Create Notification</h2>
          <div className="admin-form">
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Select User</option>
              <option value="all">All Users</option>

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
            <button className="create-btn" onClick={handleCreateNotification}>
              Create Notification
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Admin;