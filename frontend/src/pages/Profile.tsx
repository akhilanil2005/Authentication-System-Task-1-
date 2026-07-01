import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const Profile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
  const auth = useSelector(
  (state: RootState) => state.auth
);
useEffect(() => {
  axios
    .get(`http://localhost:5000/profile/${auth.userId}`)
    .then((res) => {
      setProfile(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
    })
    .catch((err) => console.error(err));
}, [auth.userId]);
const handleUpdate = async () => {
    if (!name.trim()) {
  alert("Name is required");
  return;
}

if (!email.includes("@")) {
  alert("Enter a valid email");
  return;
}
  try {
    const res = await axios.put(
  `http://localhost:5000/profile/${auth.userId}`,
  {
    name,
    email,
  }
);
    setProfile(res.data);

    alert("Profile updated successfully");
  } catch (error) {
    console.error(error);
    alert("Update failed");
  }
};
const handleChangePassword = async () => {
  try {
    if (!currentPassword) {
  alert("Current password is required");
  return;
}

if (newPassword.length < 6) {
  alert("Password must be at least 6 characters");
  return;
}
    await axios.put(
      `http://localhost:5000/change-password/${auth.userId}`,
      {
        currentPassword,
        newPassword,
      }
    );

    alert("Password changed successfully");

    setCurrentPassword("");
    setNewPassword("");
  } catch (error) {
    console.error(error);
    alert("Password change failed");
  }
};
if (!profile) {
  return <h2>Loading...</h2>;
}
  return (
    <>
    <Navbar
        email={localStorage.getItem("email") || ""}
        role={localStorage.getItem("role") || ""}
/>
    <div className="profile-container">
  <div className="profile-card">

    <h1>My Profile</h1>
    <div className="profile-header">
  <div className="avatar">
    {profile.name?.charAt(0).toUpperCase()}
  </div>

  <h1>{profile.name}</h1>

  <p>{profile.email}</p>
</div>
    <div className="profile-section">
      <h2>Account Information</h2>

      <div className="profile-grid">
        <div>
          <label>User ID</label>
          <p>{profile.id}</p>
        </div>

        <div>
          <label>Role</label>
          <span className="role-badge">
  {profile.role}
</span>
        </div>

        <div>
          <label>Name</label>
          <p>{profile.name}</p>
        </div>

        <div>
          <label>Email</label>
          <p>{profile.email}</p>
        </div>
      </div>
    </div>

    <div className="profile-section">
      <h2>Edit Profile</h2>
      <div className="profile-grid">
      <input
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    <br></br>
      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      </div>

      <button
        className="primary-btn"
        onClick={handleUpdate}
      >
        Update Profile
      </button>
    </div>

    <div className="profile-section">
      <h2>Update Password</h2>
    <div className="profile-grid">
      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) =>
          setCurrentPassword(e.target.value)
        }
      />
        <br></br>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) =>
          setNewPassword(e.target.value)
        }
      />
      </div>

      <button
        className="danger-btn"
        onClick={handleChangePassword}
      >
        Change Password
      </button>
    </div>

  </div>
</div>
</>
  );
};

export default Profile;