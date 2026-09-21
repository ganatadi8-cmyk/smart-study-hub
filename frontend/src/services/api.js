export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const apiUrl = path => `${API_BASE_URL}${path}`;
export async function fetchBranches() {
  const response = await fetch(apiUrl('/resources/branches'));
  if (!response.ok) throw new Error('Failed to load branches. Please try again.');
  return response.json();
}
export async function loadProfile(user) {
  const response = await fetch(apiUrl('/users/profile'), {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to load profile.');
  return data;
}
