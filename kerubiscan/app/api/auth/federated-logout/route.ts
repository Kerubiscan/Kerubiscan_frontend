import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    if (session && (session as any).idToken) {
        // Keycloak federated logout URL
        const url = `http://127.0.0.1:8080/realms/kimia/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(baseUrl)}&id_token_hint=${(session as any).idToken}`;
        return NextResponse.json({ url });
    }
    
    // Fallback if no session found
    return NextResponse.json({ url: baseUrl });
}
