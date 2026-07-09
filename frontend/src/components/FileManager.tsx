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
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
  const [deleteErrorId, setDeleteErrorId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);

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

  // Regular users only see their own uploads; admins see everything.
  const isAdmin = user?.role === "admin";
 const visibleItems = (isAdmin ? items : items.filter((f) => Number(f.owner_id) === Number(user?.id))).filter(
  (f) => !pendingDeleteIds.has(f.id)
);
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

  const requestDelete = (id: number, originalName: string) => {
    setConfirmTarget({ id, name: originalName });
  };

  const cancelDelete = () => {
    setConfirmTarget(null);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    const { id } = confirmTarget;
    setConfirmTarget(null);

    // Optimistically hide the file right away.
    setPendingDeleteIds((prev) => new Set(prev).add(id));
    setDeleteErrorId(null);

    const result = await dispatch(deleteFile(id));

    if (deleteFile.rejected.match(result)) {
      // Revert: bring the file back and flag the error.
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeleteErrorId(id);
    }
  };

  if (loading) return <p>Loading files...</p>;

  return (
    <div className="file-manager">
      <h3 className="file-drop-zone">{isAdmin ? "Files" : "My Files"}</h3>
      {error && <p className="error">{error}</p>}
      {deleteErrorId !== null && (
        <p className="error">Failed to delete file. Please try again.</p>
      )}

      {visibleItems.length === 0 ? (
        <p className="file-drop-zone">No files uploaded yet.</p>
      ) : (
        <ul className="file-list">
          {visibleItems.map((file) => {
           const isOwner = Number(file.owner_id) === Number(user?.id);
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
                      onClick={() => requestDelete(file.id, file.original_name)}
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

      {confirmTarget && (
        <div className="confirm-modal-overlay" onClick={cancelDelete}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">Delete file</h4>
            <p className="confirm-modal-message">
              Are you sure you want to delete <strong>{confirmTarget.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="confirm-modal-delete" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManager;
