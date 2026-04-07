export interface VirtualRoomArtwork {
  id: string;
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  authorName: string;
  authorEmail: string;
  tags: string[];
  positionIndex: number;
}

export interface VirtualRoomData {
  exhibitionId: string;
  exhibitionTitle: string;
  exhibitionTheme: string;
  exhibitionDescription: string;
  status: string;
  maxArtworks: number;
  artworks: VirtualRoomArtwork[];
}