import FileUpload from "../components/FileUpload";
import FileManager from "../components/FileManager";
import Navbar from "../components/Navbar";

function Files() {
  return (
    <>
      <Navbar />
      <div className="admin-container">
        <div className="admin-card">
          <h1 className="admin-title">File Management</h1>
          <FileUpload />
          <FileManager />
        </div>
      </div>
    </>
  );
}

export default Files;