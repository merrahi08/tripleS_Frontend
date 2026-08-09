const API_URL = "http://localhost:8080/api/requests";

export async function getUserPendingRequests(userId) {
  const response = await fetch(`${API_URL}/${userId}/pending`);

  if (!response.ok) {
    throw new Error("Failed to fetch user requests");
  }

  return response.json();
}

export async function getMentorPendingRequests(userId) {
  const response = await fetch(`${API_URL}/mentor/${userId}/pending`);

  if (!response.ok) {
    throw new Error("Failed to fetch mentor requests");
  }

  return response.json();
}

export async function claimRequest(requestId) {
  const response = await fetch(`${API_URL}/${requestId}/claim`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to claim request");
  }

  return response.json();
}
