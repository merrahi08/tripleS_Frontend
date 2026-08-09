const API_URL = "http://localhost:8080/api/mentors";

export async function getAllMentors() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch mentors");
  }

  return response.json();
}

export async function getMentorById(id) {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Mentor not found");
  }

  return response.json();
}

export async function getMentorClients(userId) {
  const response = await fetch(`${API_URL}/clients?userId=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch mentor clients");
  }

  return response.json();
}
