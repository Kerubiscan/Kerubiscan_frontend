import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    // Dynamically detect the IP and port from the incoming Host header
    const host = req.headers.get("host") || "localhost";
    const hostIp = host.split(":")[0];

    // The host header usually includes the port (e.g. 192.168.1.253:9443)
    const baseUrl = process.env.NEXTAUTH_URL || `http://${host}`;
    const keycloakPublicUrl = process.env.KEYCLOAK_PUBLIC_URL || `http://${hostIp}:1990`;
    const realm = process.env.KEYCLOAK_REALM || "kimia";

    if (session && (session as any).idToken) {
        // Keycloak federated logout URL
        const url = `${keycloakPublicUrl}/realms/${realm}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(baseUrl)}&id_token_hint=${(session as any).idToken}`;
        return NextResponse.json({ url });
    }
    // Fallback if no session found
    return NextResponse.json({ url: baseUrl });
}
