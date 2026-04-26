import { http } from "./http";

export interface UploadImageResponse {
  url: string;
  fileName: string;
}

export const uploadsApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await http.post<UploadImageResponse>(
      "/uploads/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },
};