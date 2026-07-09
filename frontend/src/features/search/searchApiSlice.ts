// src/features/search/searchApiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

export interface SearchEntityResult<T> {
  rows: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FileResult {
  id: number;
  original_name: string;
  mime_type: string;
  owner_id: number;
  created_at: string;
  entity_type: 'file';
}

export interface UserResult {
  id: number;
  name: string;
  email: string;
  role_id: number;
  entity_type: 'user';
}

export interface RoleResult {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  entity_type: 'role';
}

export interface SearchResponse {
  files?: SearchEntityResult<FileResult> | undefined;
  users?: SearchEntityResult<UserResult> | undefined;
  roles?: SearchEntityResult<RoleResult> | undefined;
}

export interface SearchParams {
  q?: string | undefined;
  entities?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'ASC' | 'DESC' | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
  mimeType?: string | undefined;
  roleId?: string | undefined;
}

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Search'],
  endpoints: (builder) => ({
    globalSearch: builder.query<SearchResponse, SearchParams>({
      query: (params) => ({
        url: '/api/search',
        params,
      }),
      providesTags: ['Search'],
    }),
    deleteFile: builder.mutation<{ message: string }, number>({
      query: (fileId) => ({
        url: `/files/${fileId}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const { useGlobalSearchQuery, useLazyGlobalSearchQuery, useDeleteFileMutation } = searchApi;