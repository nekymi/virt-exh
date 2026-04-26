import { http } from "./http";
import type {
  Exhibition,
  ExhibitionCalendarItem,
  ExhibitionDetails,
} from "../types/exhibition";
import type { VirtualRoomData } from "../types/virtualRoom";

export interface CreateExhibitionRequest {
  title: string;
  theme: string;
  description: string;
  submissionStartDate: string;
  submissionEndDate: string;
  startDate: string;
  endDate: string;
}

export const exhibitionsApi = {
  getAll: async () => {
    const response = await http.get<Exhibition[]>("/exhibitions");
    return response.data;
  },

  getActive: async () => {
    const response = await http.get<Exhibition[]>("/exhibitions/active");
    return response.data;
  },

  getUpcoming: async () => {
    const response = await http.get<Exhibition[]>("/exhibitions/upcoming");
    return response.data;
  },

  getCompleted: async () => {
    const response = await http.get<Exhibition[]>("/exhibitions/completed");
    return response.data;
  },

  getCalendar: async () => {
    const response = await http.get<ExhibitionCalendarItem[]>(
      "/exhibitions/calendar"
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await http.get<ExhibitionDetails>(`/exhibitions/${id}`);
    return response.data;
  },

  getVirtualRoom: async (id: string) => {
    const response = await http.get<VirtualRoomData>(
      `/exhibitions/${id}/virtual-room`
    );
    return response.data;
  },

  create: async (payload: CreateExhibitionRequest) => {
    const response = await http.post<Exhibition>("/exhibitions", payload);
    return response.data;
  },

  update: async (id: string, payload: CreateExhibitionRequest) => {
    const response = await http.put<Exhibition>(`/exhibitions/${id}`, payload);
    return response.data;
  },
};