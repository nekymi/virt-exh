export interface Submission {
  id: string;
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  userId: string;
  userName: string;
  userEmail: string;
  exhibitionId: string;
  exhibitionTitle: string;
  exhibitionTheme: string;
  status: string;
  adminComment?: string | null;
  createdAt: string;
  tags: string[];
}

export interface CreateSubmissionRequest {
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  exhibitionId: string;
  tags: string[];
}

export interface ReviewSubmissionRequest {
  approve: boolean;
  adminComment?: string;
}