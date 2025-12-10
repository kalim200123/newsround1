/**
 * @file Inquiry-related type definitions
 */

export type InquiryStatus = "SUBMITTED" | "ANSWERED" | "CLOSED";

/**
 * Defines the data structure for an inquiry summary, used in lists.
 * This corresponds to the response from `GET /api/inquiry`.
 */
export interface InquirySummary {
  id: number;
  subject: string;
  status: InquiryStatus;
  created_at: string;
}

/**
 * Defines the data structure for a detailed inquiry view.
 * This corresponds to the response from `GET /api/inquiry/:id`.
 */
export interface InquiryDetail {
  id: number;
  subject: string;
  content: string;
  status: InquiryStatus;
  created_at: string;
  attachment_url?: string | null;
  answer?: {
    content: string;
    created_at: string;
  } | null;
}
