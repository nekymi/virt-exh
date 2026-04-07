export interface Artwork {
  id: string;
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  exhibitionId: string;
  exhibitionTitle: string;
  exhibitionTheme: string;
  isHidden: boolean;
  createdAt: string;
  tags: string[];
}