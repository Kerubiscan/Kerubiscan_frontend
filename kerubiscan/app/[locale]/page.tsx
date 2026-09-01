import { redirect } from "@/i18n/routing";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { hasRole, ROLES } from "@/lib/roles";
import { Link } from "@/i18n/routing";
import { Users, LayoutDashboard, ShieldCheck } from "lucide-react";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect({ href: "/login", locale });
  }

  const isAdmin = hasRole(session, ROLES.PLATFORM_ADMINISTRATOR);

  if (!isAdmin) {
    // Other users go directly to the dashboard
    redirect({ href: "/dashboard", locale });
  }

  // Admin Gateway
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base text-text-main relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-status-info/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-4xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/30 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Welcome, Administrator</h1>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Choose your destination to manage users or review system vulnerabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a 
            href="http://localhost:8080/admin/kimia/console/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group p-8 bg-surface/80 backdrop-blur-xl border border-border hover:border-primary/50 rounded-2xl shadow-xl hover:shadow-primary/20 transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Keycloak Management Center</h2>
            <p className="text-text-muted text-sm">
              Manage SSO users, groups, roles, and identity providers for the Kimia realm.
            </p>
          </a>

          <Link 
            href="/dashboard"
            className="group p-8 bg-surface/80 backdrop-blur-xl border border-border hover:border-primary/50 rounded-2xl shadow-xl hover:shadow-primary/20 transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">KerubiScan Dashboard</h2>
            <p className="text-text-muted text-sm">
              Access the vulnerability scanner dashboard to manage scans, policies, and view reports.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
