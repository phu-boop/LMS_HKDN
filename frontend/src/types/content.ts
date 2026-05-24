export type ContentType = "VIDEO" | "PDF" | "SLIDE" | "WORD" | "URL";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  isPublished: boolean;
}
