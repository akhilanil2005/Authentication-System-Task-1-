import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const requestLogout = () => setShowLogoutConfirm(true);
  const cancelLogout = () => setShowLogoutConfirm(false);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    dispatch(logout());
    localStorage.clear();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  useEffect(() => {
    axios
      .get(`http://localhost:5000/profile/${auth.userId}`)
      .then((res) => {
        setProfile(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load profile");
      });
  }, [auth.userId]);

  const requestSave = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const nameChanged = trimmedName !== "" && trimmedName !== profile.name;
    const emailChanged = trimmedEmail !== "" && trimmedEmail !== profile.email;
    const passwordChangeRequested = currentPassword || newPassword || confirmPassword;

    if (!nameChanged && !emailChanged && !passwordChangeRequested) {
      toast.warning("No changes to save.");
      return;
    }

    if (trimmedEmail !== "" && !trimmedEmail.includes("@")) {
      toast.warning("Enter a valid email");
      return;
    }

    if (
      (currentPassword && !newPassword) ||
      (!currentPassword && newPassword)
    ) {
      toast.warning("Enter both Current Password and New Password");
      return;
    }

    if (currentPassword && newPassword) {
      if (newPassword !== confirmPassword) {
        toast.warning("Passwords do not match");
        return;
      }

      if (newPassword.length < 6) {
        toast.warning("Password must be at least 6 characters");
        return;
      }
    }

    setShowSaveConfirm(true);
  };

  const cancelSave = () => setShowSaveConfirm(false);

  const confirmSave = async () => {
    setShowSaveConfirm(false);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nameChanged = trimmedName !== "" && trimmedName !== profile.name;
    const emailChanged = trimmedEmail !== "" && trimmedEmail !== profile.email;

    try {
      if (nameChanged || emailChanged) {
        const res = await axios.put(
          `http://localhost:5000/profile/${auth.userId}`,
          {
            name: nameChanged ? trimmedName : profile.name,
            email: emailChanged ? trimmedEmail : profile.email,
          }
        );
        setProfile(res.data);
        setName("");
        setEmail("");
      }

      if (currentPassword && newPassword) {
        await axios.put(
          `http://localhost:5000/change-password/${auth.userId}`,
          { currentPassword, newPassword }
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    }
  };

  if (!profile) {
    return <h2>Loading...</h2>;
  }

  return (
    <>
      <Navbar />
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
                <span className="role-badge">{profile.role}</span>
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
                  name="update_name_field"
                  placeholder="Enter new name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>

              <div>
                <label>Current Email</label>
                <p>{profile.email}</p>
              </div>

              <div>
                <label>Update Email</label>
                <input
                  type="text"
                  name="update_email_field"
                  placeholder="Enter new email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
            </div>

            <h3>Change Password</h3>

            <div className="password-section">
              <input
                type="password"
                name="current_password_field"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
              />

              <input
                type="password"
                name="new_password_field"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
              />

              <input
                type="password"
                name="confirm_password_field"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
              />
            </div>

            <button className="primary-btn" onClick={requestSave}>
              Save Changes
            </button>
            <button className="logout-btn" onClick={requestLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {showSaveConfirm && (
        <div className="confirm-modal-overlay" onClick={cancelSave}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">Save changes</h4>
            <p className="confirm-modal-message">
              Are you sure you want to save these profile changes?
            </p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={cancelSave}>
                Cancel
              </button>
              <button className="confirm-modal-delete" onClick={confirmSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="confirm-modal-overlay" onClick={cancelLogout}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">Log out</h4>
            <p className="confirm-modal-message">
              Are you sure you want to log out?
            </p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="confirm-modal-delete" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;