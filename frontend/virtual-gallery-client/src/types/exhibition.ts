export interface Exhibition {
  id: string;
  title: string;
  theme: string;
  description: string;
  submissionStartDate: string;
  submissionEndDate: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: string;
  artworkCount: number;
}

export interface ExhibitionCalendarItem {
  id: string;
  title: string;
  theme: string;
  submissionStartDate: string;
  submissionEndDate: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ExhibitionArtworkItem {
  id: string;
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  authorName: string;
  authorEmail: string;
  tags: string[];
}

export interface ExhibitionDetails {
  id: string;
  title: string;
  theme: string;
  description: string;
  submissionStartDate: string;
  submissionEndDate: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: string;
  artworkCount: number;
  artworks: ExhibitionArtworkItem[];
}