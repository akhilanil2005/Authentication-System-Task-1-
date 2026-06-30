import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { useEffect, useState } from "react";
import axios from "axios";

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
    <div className="profile-container">
      <div className="profile-card">
        <h1>Profile</h1>

        <div className="profile-item">
  <span>User ID</span>
    <p>{profile.id}</p>
</div>

<div className="profile-item">
  <span>Role</span>
  <p>{profile.role}</p>
</div>

<div className="profile-item">
  <span>Token Status</span>
  <p>{auth.token ? "Logged In" : "Logged Out"}</p>
</div>
<div className="profile-item">
  <span>Name</span>
  <p>{profile.name}</p>
</div>

<div className="profile-item">
  <span>Email</span>
  <p>{profile.email}</p>
</div>
<div className="profile-item">
  <span>Edit Name</span>
  <input
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
</div>

<div className="profile-item">
  <span>Edit Email</span>
  <input
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>

<button onClick={handleUpdate}>
  Update Profile
</button>
<div className="profile-item">
  <span>Current Password</span>
  <input
    type="password"
    value={currentPassword}
    onChange={(e) => setCurrentPassword(e.target.value)}
  />
</div>

<div className="profile-item">
  <span>New Password</span>
  <input
    type="password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
  />
</div>

<button onClick={handleChangePassword}>
  Change Password
</button>
      </div>
    </div>
  );
};

export default Profile;