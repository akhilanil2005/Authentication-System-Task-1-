import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

const Profile = () => {
  const auth = useSelector(
  (state: RootState) => state.auth
);

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Profile</h1>

        <div className="profile-item">
  <span>User ID</span>
  <p>{auth.userId}</p>
</div>

<div className="profile-item">
  <span>Role</span>
  <p>{auth.role}</p>
</div>

<div className="profile-item">
  <span>Token Status</span>
  <p>{auth.token ? "Logged In" : "Logged Out"}</p>
</div>
      </div>
    </div>
  );
};

export default Profile;