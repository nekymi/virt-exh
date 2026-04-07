import { http } from "./http";
import type { Artwork } from "../types/artwork";

export const adminArtworksApi = {
  getAll: async () => {
    const response = await http.get<Artwork[]>("/artworks/admin/all");
    return response.data;
  },

  hide: async (id: string) => {
    await http.post(`/artworks/${id}/hide`);
  },

  show: async (id: string) => {
    await http.post(`/artworks/${id}/show`);
  },
};