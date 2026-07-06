import { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadFile, clearFileError, resetUploadProgress } from "../features/files/filesSlice";
import type { RootState, AppDispatch } from "../app/store";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, matches backend limit
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
  const { uploading, uploadProgress, error } = useSelector(
    (state: RootState) => state.files
  );

  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState("");
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

  const handleFile = useCallback(
    (file: File) => {
      setValidationError("");
      dispatch(clearFileError());

      const validationMsg = validateFile(file);
      if (validationMsg) {
        setValidationError(validationMsg);
        return;
      }

      setProgress(0);
      dispatch(
        uploadFile({
          file,
          onProgress: (percent) => setProgress(percent),
        })
      ).finally(() => {
        dispatch(resetUploadProgress());
        setProgress(0);
        if (inputRef.current) inputRef.current.value = "";
      });
    },
    [dispatch]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
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