export interface SocialPost {
  id: string;
  author: string;
  content: string;
  platform: 'twitter' | 'facebook' | 'instagram';
  sentiment: 'negative' | 'neutral' | 'positive';
  likes: number;
}

export interface MapLocation {
  name: string;
  address: string;
  rating?: number;
  user_ratings_total?: number;
  uri?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            snippet: string;
        }[]
    }
  }
}

export interface ScandalStrategy {
  headline: string;
  articleContent: string;
  hashtags: string[];
  targetAuthority: string;
  pressurePoints: string[];
  // New actionable fields
  officialComplaint: {
    subject: string;
    recipient: string;
    body: string;
  };
  socialContent: {
    twitterPost: string;
    facebookPost: string;
  };
}

export enum AppState {
  IDLE,
  SCRAPING,
  ANALYZING_IMAGE, // New state
  ANALYZING_MAP,
  GENERATING,
  FINISHED,
  ERROR
}