const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchBranches() {
  const response = await fetch(`${API_BASE_URL}/resources/branches`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch branches from backend');
  }
  return response.json();
}
