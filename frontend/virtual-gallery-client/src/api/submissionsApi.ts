import { http } from "./http";
import type {
  CreateSubmissionRequest,
  ReviewSubmissionRequest,
  Submission,
} from "../types/submission";

export const submissionsApi = {
  create: async (payload: CreateSubmissionRequest) => {
    const response = await http.post<Submission>("/submissions", payload);
    return response.data;
  },

  getMy: async () => {
    const response = await http.get<Submission[]>("/submissions/my");
    return response.data;
  },

  getAll: async () => {
    const response = await http.get<Submission[]>("/submissions");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await http.get<Submission>(`/submissions/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    await http.delete(`/submissions/${id}`);
  },

  review: async (id: string, payload: ReviewSubmissionRequest) => {
    const response = await http.post<Submission>(`/submissions/${id}/review`, payload);
    return response.data;
  },
};