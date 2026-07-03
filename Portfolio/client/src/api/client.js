const BASE = '/api';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  getProfile: () => request('/profile'),
  getProjects: () => request('/projects'),
  getFeaturedProjects: () => request('/projects?featured=true'),
  getProject: (id) => request(`/projects/${id}`),
  getReviews: () => request('/reviews'),
};
