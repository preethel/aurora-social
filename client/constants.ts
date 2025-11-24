import { Platform } from "./types";

// Removed hardcoded Iframely key. Frontend no longer needs the key; server proxy uses IFRAMELY_API_KEY.
// Keep empty string fallback so previous import sites don't break if still referenced.
export const IFRAMELY_API_KEY = ""; // Deprecated: avoid using client-side.

export const PLATFORM_COLORS: Record<Platform, string> = {
  [Platform.FacebookPage]: "#1877F2",
  [Platform.FacebookGroup]: "#1877F2",
  [Platform.Instagram]: "#E4405F",
  [Platform.Threads]: "#000000",
  [Platform.X]: "#000000",
  [Platform.Pinterest]: "#BD081C",
  [Platform.YouTube]: "#FF0000",
  [Platform.TikTok]: "#000000",
  [Platform.Telegram]: "#24A1DE",
  [Platform.WhatsApp]: "#25D366",
  [Platform.IMO]: "#0056F0",
};

export const PLATFORM_OPTIONS = Object.values(Platform);

export const POST_TYPES = ["IMAGE", "REEL", "VIDEO", "LINK", "TEXT", "GIF"];

export const BRAND_OPTIONS: Record<string, string[]> = {
  BAJI: [
    "BDT",
    "INR",
    "PKR",
    "NPR",
    "AED",
    "SAR",
    "OMR",
    "News",
    "Official",
    "Meme",
    "AI",
    "Others",
  ],
  JeetBuzz: ["BDT", "INR", "PKR", "News", "Official", "Meme", "AI", "Others"],
  SIX6S: ["BDT", "INR", "PKR", "News", "Official", "Meme", "AI", "Others"],
  TekkaBuzz: ["BDT", "PKR", "News", "Official", "Meme", "AI", "Others"],
  BADSHA: ["BDT", "News", "Official", "Meme", "AI", "Others"],
  "CAZ VIP": [
    "ALL",
    "BAJI",
    "JeetBuzz",
    "SIX6S",
    "BADSHA",
    "TekkaBuzz",
    "Others",
  ],
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
