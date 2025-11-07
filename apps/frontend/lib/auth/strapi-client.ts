export interface StrapiFetchOptions extends RequestInit {
  jwt?: string;
}

export async function strapiFetch<T>(path: string, { jwt, headers, ...init }: StrapiFetchOptions = {}) {
  const baseUrl = process.env.SHELLY_BASE_URL;
  if (!baseUrl) {
    throw new Error('SHELLY_BASE_URL no está configurado.');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : process.env.SHELLY_API_TOKEN ? { Authorization: `Bearer ${process.env.SHELLY_API_TOKEN}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Error en la petición a Strapi (${response.status})`);
  }

  return (await response.json()) as T;
}
