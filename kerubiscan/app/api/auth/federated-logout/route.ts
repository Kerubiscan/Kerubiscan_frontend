import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:9443";
    const keycloakPublicUrl = process.env.KEYCLOAK_PUBLIC_URL || "http://localhost:1990";
    const realm = process.env.KEYCLOAK_REALM || "kimia";
    
    if (session && (session as any).idToken) {
        // Keycloak federated logout URL
        const url = `${keycloakPublicUrl}/realms/${realm}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(baseUrl)}&id_token_hint=${(session as any).idToken}`;
        return NextResponse.json({ url });
    }
    
    // Fallback if no session found
    return NextResponse.json({ url: baseUrl });
}
