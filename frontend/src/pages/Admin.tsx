import { useState } from "react";
import axios from "../api/axios";

function Admin() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleCreateNotification = async () => {
    await axios.post("/notifications", {
  userId: Number(userId),
  title,
  message,
});

    alert("Notification Created");

    setTitle("");
    setMessage("");
  };

  return (
    <div>
      <h1>Admin Page</h1>

      <h2>Create Notification</h2>
      <input
  type="number"
  placeholder="User ID"
  value={userId}
  onChange={(e) => setUserId(e.target.value)}
/>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleCreateNotification}>
        Create Notification
      </button>
    </div>
  );
}

export default Admin;