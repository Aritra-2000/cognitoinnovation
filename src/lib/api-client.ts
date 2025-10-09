'use client';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${name}=`;
  const found = document.cookie.split('; ').find((row) => row.startsWith(prefix));
  return found ? decodeURIComponent(found.split('=')[1] || '') : undefined;
}

async function getAuthHeaders() {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Our API expects a JWT from the custom 'session' cookie in 'x-session-cookie'
    const sessionToken = readCookie('session');
    if (sessionToken) {
      headers['x-session-cookie'] = sessionToken;
    }

    return headers;
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return { 'Content-Type': 'application/json' };
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch data');
  }
  
  return response.json();
}

export async function apiPost<T, U = unknown>(url: string, data: U): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to post data');
  }
  
  return response.json();
}

export async function apiPatch<T, U = unknown>(url: string, data: U): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update data');
  }
  
  return response.json();
}
