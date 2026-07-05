import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
  const auth = useSelector(
  (state: RootState) => state.auth
);
const dispatch = useDispatch();
const navigate = useNavigate();

const handleLogout = () => {
  dispatch(logout());

  localStorage.clear();

  navigate("/login");
};
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
    if (
  (currentPassword && !newPassword) ||
  (!currentPassword && newPassword)
) {
  alert(
    "Enter both Current Password and New Password"
  );
  return;
}
   if (currentPassword && newPassword) {

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
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

  setCurrentPassword("");
  setNewPassword("");
  setConfirmPassword("");
}

    alert("Profile updated successfully");
  } catch (error) {
    console.error(error);
    alert("Update failed");
  }
};
if (!profile) {
  return <h2>Loading...</h2>;
}
  return (
    <>
    <Navbar/>
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
      <h2>Edit Profile & Password</h2>
      <div className="profile-grid">

  <div>
    <label>Current Name</label>
    <p>{profile.name}</p>
  </div>

  <div>
    <label>Update Name</label>
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      autoComplete="off"
    />
  </div>

  <div>
    <label>Current Email</label>
    <p>{profile.email}</p>
  </div>

  <div>
    <label>Update Email</label>
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      autoComplete="off"
    />
  </div>

</div>
      <h3>Change Password</h3>

<div className="password-section">

  <input
    type="password"
    placeholder="Current Password"
    value={currentPassword}
    onChange={(e) => setCurrentPassword(e.target.value)}
    autoComplete="off"
  />

  <input
    type="password"
    placeholder="New Password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
  />

  <input
    type="password"
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
  />

</div>

      <button
        className="primary-btn"
        onClick={handleUpdate}
      >
        Save Changes
      </button>
      <button
  className="logout-btn"
  onClick={handleLogout}
>
  Logout
</button>
    </div>

    

  </div>
</div>
</>
  );
};

export default Profile;