
export enum Platform {
  FacebookPage = 'Facebook Page',
  FacebookGroup = 'Facebook Group',
  Instagram = 'Instagram',
  Threads = 'Threads',
  X = 'X (Twitter)',
  Pinterest = 'Pinterest',
  YouTube = 'YouTube',
  TikTok = 'TikTok',
  Telegram = 'Telegram Channel',
  WhatsApp = 'WhatsApp Channel',
  IMO = 'IMO Channel'
}

export type PostType = 'IMAGE' | 'REEL' | 'VIDEO' | 'LINK' | 'TEXT' | 'GIF';

export interface SocialPost {
  id: string;
  platform: Platform;
  brandName: string;
  accountName: string; // e.g. @handle or Page Name
  currency: string;
  creatorName: string; // Internal team member
  postedBy: string; // Person who published
  remarks?: string; // Remarks or Notes
  content: string; // Embed code or URL
  date: string; // ISO Date string YYYY-MM-DD
  createdAt: number;
  // New fields for Screenshot support
  mediaType?: 'embed' | 'screenshot';
  screenshot?: string; // Base64 string of the image
  redirectLink?: string; // URL to the post
  
  // New Classification Fields
  category?: string;
  postType?: PostType;
}

export type ViewState = 'dashboard' | 'calendar' | 'add-post' | 'recent-posts' | 'report' | 'accounts-management';

export interface DayMetrics {
  date: string;
  count: number;
  posts: SocialPost[];
}
