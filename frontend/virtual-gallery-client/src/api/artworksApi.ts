import { http } from "./http";
import type { Artwork } from "../types/artwork";

export const artworksApi = {
  getAll: async (params?: {
    search?: string;
    author?: string;
    tag?: string;
    exhibitionId?: string;
  }) => {
    const response = await http.get<Artwork[]>("/artworks", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await http.get<Artwork>(`/artworks/${id}`);
    return response.data;
  },
};