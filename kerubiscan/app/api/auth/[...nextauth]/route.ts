import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { NextRequest } from "next/server";

function getDynamicAuthOptions(req?: NextRequest): AuthOptions {
  // Use the Host header dynamically if available, otherwise fallback to localhost for server-side checks
  const host = req ? (req.headers.get("host") || "localhost") : "localhost";
  const hostIp = host.split(":")[0];
  
  const keycloakInternalUrl = process.env.KEYCLOAK_INTERNAL_URL || "http://keycloak:8080";
  const keycloakPublicUrl = process.env.KEYCLOAK_PUBLIC_URL || `http://${hostIp}:1990`;
  const realm = process.env.KEYCLOAK_REALM || "kimia";

  return {
    providers: [
      KeycloakProvider({
        clientId: process.env.KEYCLOAK_CLIENT_ID || "kerubiscan-web",
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "kerubiscan-web-secret",
        // The issuer must match the internal endpoint used for token exchange
        issuer: process.env.KEYCLOAK_ISSUER || `${keycloakInternalUrl}/realms/${realm}`,
        wellKnown: `${keycloakInternalUrl}/realms/${realm}/.well-known/openid-configuration`,
        authorization: {
          url: `${keycloakPublicUrl}/realms/${realm}/protocol/openid-connect/auth`,
          params: { scope: "openid email profile" },
        },
        token: `${keycloakInternalUrl}/realms/${realm}/protocol/openid-connect/token`,
        userinfo: `${keycloakInternalUrl}/realms/${realm}/protocol/openid-connect/userinfo`,
        httpOptions: { timeout: 10000 }
      }),
    ],
    pages: { signIn: '/fr/login' },
    session: { strategy: "jwt", maxAge: 15 * 60 },
    callbacks: {
      async jwt({ token, account }) {
        if (account) {
          token.accessToken = account.access_token;
          token.idToken = account.id_token;
          if (account.access_token) {
            try {
              const payload = account.access_token.split('.')[1];
              if (payload) {
                const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
                token.roles = decoded?.realm_access?.roles || [];
                token.expiresAt = decoded?.exp;
              }
            } catch (e) {
              console.error("Failed to decode token", e);
            }
          }
        }
        
        if (token.expiresAt && Math.floor(Date.now() / 1000) > (token.expiresAt as number)) {
          return { ...token, error: "RefreshAccessTokenError" };
        }
        return token;
      },
      async session({ session, token }: any) {
        session.accessToken = token.accessToken;
        session.idToken = token.idToken;
        session.roles = token.roles || [];
        session.error = token.error;
        return session;
      },
    },
  };
}

// Export a default fallback for getServerSession (which doesn't need authorization URL)
export const authOptions = getDynamicAuthOptions();

// Export the dynamic handlers for actual browser-based API routes
export async function GET(req: NextRequest, ctx: any) {
  const handler = NextAuth(getDynamicAuthOptions(req));
  return handler(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  const handler = NextAuth(getDynamicAuthOptions(req));
  return handler(req, ctx);
}
