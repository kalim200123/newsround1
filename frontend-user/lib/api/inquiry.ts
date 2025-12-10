/**
 * @file API functions for handling inquiries.
 */

import { InquirySummary, InquiryDetail } from "@/lib/types/inquiry";
import { fetchWrapper } from "./fetchWrapper";

/**
 * Creates a new inquiry.
 * Sends data as multipart/form-data, which is the standard for file uploads.
 * @param token - The user's authentication token.
 * @param subject - The subject of the inquiry.
 * @param content - The content of the inquiry.
 * @param privacyAgreement - Whether the user agreed to the privacy policy.
 * @param attachment - The file to attach (optional).
 * @returns A promise that resolves to a success message object.
 */
export async function createInquiry(
  token: string,
  subject: string,
  content: string,
  privacyAgreement: boolean,
  attachment?: File | null
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('subject', subject);
  formData.append('content', content);
  formData.append('privacy_agreement', String(privacyAgreement)); // API expects a string "true"
  
  if (attachment) {
    formData.append('attachment', attachment);
  }

  const response = await fetchWrapper(`/api/inquiry`, {
    method: 'POST',
    headers: {
      // For multipart/form-data, the browser sets the Content-Type header automatically, including the boundary.
      // Do not set it manually here.
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '문의 제출에 실패했습니다.' }));
    throw new Error(errorData.message || '문의 제출에 실패했습니다.');
  }

  return response.json();
}

/**
 * Fetches the list of the current user's inquiries.
 * @param token - The user's authentication token.
 * @returns A promise that resolves to an array of inquiry summaries.
 */
export async function getInquiries(token: string): Promise<InquirySummary[]> {
  const response = await fetchWrapper(`/api/inquiry`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '문의 내역을 불러오는데 실패했습니다.' }));
    throw new Error(errorData.message || '문의 내역을 불러오는데 실패했습니다.');
  }

  return response.json();
}

/**
 * Fetches the detail of a single inquiry by its ID.
 * @param token - The user's authentication token.
 * @param inquiryId - The ID of the inquiry to fetch.
 * @returns A promise that resolves to the detailed inquiry object.
 */
export async function getInquiryDetail(token: string, inquiryId: number): Promise<InquiryDetail> {
  const response = await fetchWrapper(`/api/inquiry/${inquiryId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '문의 상세 정보를 불러오는데 실패했습니다.' }));
    throw new Error(errorData.message || '문의 상세 정보를 불러오는데 실패했습니다.');
  }

  return response.json();
}