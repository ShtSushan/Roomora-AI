import axios from "axios";

export const API_URL = "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, // give up after 60 seconds instead of waiting forever
});

export async function checkHealth() {
  const { data } = await client.get("/health");
  return data;
}

export async function uploadImage(file) {
  // Files travel as "multipart form data". Axios sets the correct
  // Content-Type header (with its boundary) automatically for FormData.
  const formData = new FormData();
  formData.append("file", file); // "file" must match the parameter name in upload.py

  const { data } = await client.post("/api/upload", formData);
  return data; // { image_id, filename, width, height }
}

export function imageUrl(imageId) {
  return `${API_URL}/api/images/${imageId}`;
}

// Turns any Axios error into a sentence a user can understand.
export function getErrorMessage(error) {
  if (error.response) {
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail; // our own 400 messages
    return `The server returned an error (${error.response.status}).`;
  }
  if (error.request) {
    return "Cannot reach the server. Is the backend running?";
  }
  return "Something went wrong. Please try again.";
}

export async function generateDesign({ imageId, roomType, style, palette, prompt }) {
  const { data } = await client.post(
    "/api/design/generate",
    {
      image_id: imageId,
      room_type: roomType,
      style,
      palette,
      prompt,
    },
    { timeout: 300000 } // generation can take a while; allow 5 minutes
  );
  return data; // { generated_id, width, height, prompt_used }
}

export function generatedImageUrl(generatedId) {
  return `${API_URL}/api/generated/${generatedId}`;
}