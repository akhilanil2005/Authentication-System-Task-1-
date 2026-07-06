import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFiles, deleteFile } from "../features/files/filesSlice";
import type { RootState, AppDispatch } from "../app/store";
import api from "../api/axios";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileManager() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((state: RootState) => state.files);
  const { user } = useSelector((state: RootState) => state.auth);

  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    dispatch(fetchFiles());
  }, [dispatch]);

  // Fetch authenticated blob previews for image files
  useEffect(() => {
    let isCancelled = false;
    const objectUrls: string[] = [];

    const loadPreviews = async () => {
      const imageFiles = items.filter((f) => f.file_type === "image" && !previewUrls[f.id]);

      for (const file of imageFiles) {
        try {
          const response = await api.get(`/files/download/${file.download_token}`, {
            responseType: "blob",
          });
          if (isCancelled) return;
          const url = window.URL.createObjectURL(response.data);
          objectUrls.push(url);
          setPreviewUrls((prev) => ({ ...prev, [file.id]: url }));
        } catch (err) {
          console.error(`Failed to load preview for file ${file.id}:`, err);
        }
      }
    };

    loadPreviews();

    return () => {
      isCancelled = true;
      objectUrls.forEach((url) => window.URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const canDelete = user?.permissions?.includes("files:delete");

  const handleDownload = async (token: string, originalName: string) => {
    try {
      const response = await api.get(`/files/download/${token}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleDelete = (id: number, originalName: string) => {
    if (!confirm(`Delete "${originalName}"? This cannot be undone.`)) return;
    dispatch(deleteFile(id));
  };

  if (loading) return <p>Loading files...</p>;

  return (
    <div className="file-manager">
      <h3 className="file-drop-zone">Files</h3>
      {error && <p className="error">{error}</p>}

      {items.length === 0 ? (
        <p className="file-drop-zone">No files uploaded yet.</p>
      ) : (
        <ul className="file-list">
          {items.map((file) => {
            const isOwner = file.owner_id === user?.id;
            const showDelete = isOwner || canDelete;

            return (
              <li key={file.id} className="file-list-item">
                {file.file_type === "image" ? (
                  previewUrls[file.id] ? (
                    <img
                      src={previewUrls[file.id]}
                      alt={file.original_name}
                      className="file-thumbnail"
                    />
                  ) : (
                    <div className="file-icon">...</div>
                  )
                ) : (
                  <div className="file-icon">{file.file_type.toUpperCase()}</div>
                )}

                <div className="file-info">
                  <strong>{file.original_name}</strong>
                 <span className="file-meta">
  {formatSize(file.size_bytes)} ·{" "}
  {new Date(file.created_at).toLocaleDateString()} · Uploaded by{" "}
  {file.owner_name}
</span>
                </div>

                <div className="file-actions">
                  <button
                    onClick={() => handleDownload(file.download_token, file.original_name)}
                  >
                    Download
                  </button>
                  {showDelete && (
                    <button
                      className="danger"
                      onClick={() => handleDelete(file.id, file.original_name)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default FileManager;