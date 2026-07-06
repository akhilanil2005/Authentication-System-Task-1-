import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export type FileCategory = "image" | "document" | "attachment";

export interface FileRecord {
  id: number;
  owner_id: number;
  owner_name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  file_type: FileCategory;
  download_token: string;
  created_at: string;
}
export const uploadFile = createAsyncThunk<
  FileRecord,
  { file: File; onProgress?: (percent: number) => void },
  { rejectValue: string }
>("files/uploadFile", async ({ file, onProgress }, thunkAPI) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      },
    });

    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Upload failed"
    );
  }
});

export const fetchFiles = createAsyncThunk<
  FileRecord[],
  void,
  { rejectValue: string }
>("files/fetchFiles", async (_, thunkAPI) => {
  try {
    const response = await api.get("/files");
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to fetch files"
    );
  }
});

export const deleteFile = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("files/deleteFile", async (id, thunkAPI) => {
  try {
    await api.delete(`/files/${id}`);
    return id;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Delete failed"
    );
  }
});

const fileSlice = createSlice({
  name: "files",
  initialState: {
    items: [] as FileRecord[],
    loading: false,
    uploading: false,
    uploadProgress: 0,
    error: null as string | null,
  },
  reducers: {
    clearFileError: (state) => {
      state.error = null;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        state.items.unshift(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload || "Upload failed";
      })
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch files";
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.items = state.items.filter((f) => f.id !== action.payload);
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.error = action.payload || "Delete failed";
      });
  },
});

export const { clearFileError, resetUploadProgress } = fileSlice.actions;
export default fileSlice.reducer;