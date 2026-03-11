import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalyzeResponse {
  success: boolean;
  summary?: string;
  detail?: string;
  metrics?: {
    total_revenue: number;
    top_region: string;
    top_category: string;
    total_units_sold: number;
    cancelled_orders: number;
    cancellation_rate: number;
  };
}

export async function analyzeSalesData(
  file: File,
  email: string
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("email", email);

  const { data } = await axios.post<AnalyzeResponse>(
    `${API_URL}/analyze`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}
