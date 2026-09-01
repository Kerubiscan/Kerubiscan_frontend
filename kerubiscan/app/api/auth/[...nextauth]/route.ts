import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "kerubiscan-web",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "kerubiscan-web-secret",
      issuer: process.env.KEYCLOAK_ISSUER || "http://127.0.0.1:8080/realms/kimia",
      authorization: process.env.KEYCLOAK_AUTHORIZATION_URL || "http://127.0.0.1:8080/realms/kimia/protocol/openid-connect/auth",
      httpOptions: {
        timeout: 10000,
      }
    }),
  ],
  pages: {
    signIn: '/fr/login',
  },
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
            }
          } catch (e) {
            console.error("Failed to decode token", e);
          }
        }
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
