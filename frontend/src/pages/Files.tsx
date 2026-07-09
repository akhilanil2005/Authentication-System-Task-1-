import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import FileUpload from "../components/FileUpload";
import FileManager from "../components/FileManager";
import Navbar from "../components/Navbar";

function Files() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === "admin";

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <h1 className="admin-title">{isAdmin ? "File Management" : "Files"}</h1>

        <div className="admin-card file-upload-card">
          <FileUpload />
        </div>

        <div className="admin-card file-list-card">
          <FileManager />
        </div>
      </div>
    </>
  );
}

export default Files;
