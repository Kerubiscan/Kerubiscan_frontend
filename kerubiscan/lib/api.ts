import { getSession } from "next-auth/react";

const API_BASE_URL = "/api/v1";
let isLoggingOut = false;

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Attempt to get the current NextAuth session on the client
  try {
    const session = await getSession();
    if (session && (session as any).accessToken) {
      headers["Authorization"] = `Bearer ${(session as any).accessToken}`;
    }
  } catch (err) {
    console.warn("Could not retrieve session for API request");
  }

  const response = await fetch(url, {
    cache: "no-store", // Prevent Next.js or browser from caching API responses (especially 401s)
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        if (isLoggingOut) return new Promise(() => {}) as any;
        isLoggingOut = true;
        
        try {
          const res = await fetch("/api/auth/federated-logout", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            const { signOut } = await import("next-auth/react");
            await signOut({ redirect: false }); // Clear NextAuth cookie
            
            // Give NextAuth a tiny bit of time to delete the cookie before redirecting
            setTimeout(() => {
              if (data.url && data.url.includes("logout")) {
                window.location.replace(data.url);
              } else {
                window.location.replace("/fr/login");
              }
            }, 300);
            return new Promise(() => {}) as any;
          }
        } catch (e) {
          console.error("Federated logout failed", e);
        }
      }
      
      // Fallback: clear cookie and hard redirect to login
      if (typeof window !== "undefined") {
          const { signOut } = await import("next-auth/react");
          await signOut({ redirect: false });
          setTimeout(() => {
            window.location.replace("/fr/login");
          }, 300);
      }
      return new Promise(() => {}) as any;
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${response.status} ${response.statusText}`);
  }

  // Check if response has content before parsing JSON
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
