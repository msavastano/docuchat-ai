
export interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
}
