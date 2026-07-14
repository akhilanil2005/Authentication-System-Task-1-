import { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { uploadFile, clearFileError, resetUploadProgress } from "../features/files/filesSlice";
import type { RootState, AppDispatch } from "../app/store";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/json",
];

function FileUpload() {
  const dispatch = useDispatch<AppDispatch>();
  const { uploading, error } = useSelector((state: RootState) => state.files);

  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large. Max size is ${MAX_SIZE_BYTES / (1024 * 1024)}MB.`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Unsupported file type.";
    }
    return null;
  };

  const handleSelect = useCallback((file: File) => {
    setValidationError("");
    dispatch(clearFileError());

    const validationMsg = validateFile(file);
    if (validationMsg) {
      setValidationError(validationMsg);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleUploadClick = async () => {
    if (!selectedFile) {
      toast.error("Please select a file before uploading.");
      return;
    }

    setProgress(0);
    const fileName = selectedFile.name;

    const result = await dispatch(
      uploadFile({
        file: selectedFile,
        onProgress: (percent) => setProgress(percent),
      })
    );

    dispatch(resetUploadProgress());
    setProgress(0);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";

    if (uploadFile.rejected.match(result)) {
      toast.error(`Failed to upload "${fileName}".`);
    } else {
      toast.success(`"${fileName}" uploaded successfully.`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSelect(file);
  };

  return (
    <div className="file-upload">
      <div
        className={`file-drop-zone ${isDragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleInputChange}
          style={{ display: "none" }}
        />
        <p>Drag & drop a file here, or click to browse</p>
        <p className="file-drop-hint">
          Images, PDFs, Word docs, text, zip — up to 10MB
        </p>
      </div>

      {selectedFile && !uploading && (
        <div className="file-selected-row">
          <span className="file-selected-name">{selectedFile.name}</span>
          <button
            type="button"
            className="upload-confirm-btn"
            onClick={handleUploadClick}
          >
            Upload
          </button>
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}

      {validationError && <p className="error">{validationError}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default FileUpload;