import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

import { CheckCircle2, Plane, FileText, Users, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleDevLogin = async () => {
    try {
      const response = await fetch("/api/auth/dev-login", { method: "POST" });
      const data = await response.json();
      if (data.success && data.redirect) {
        window.location.href = data.redirect;
      } else {
        console.error("Dev login failed", data);
      }
    } catch (error) {
      console.error("Dev login error", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-purple-500/20 bg-slate-900/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img src="/ready2spray-logo.png" alt="Ready2Spray" className="h-10 w-10 flex-shrink-0" />
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent truncate">
                ready2spray
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="bg-yellow-500/10 border-yellow-500 text-yellow-500 hover:bg-yellow-500/20"
                onClick={handleDevLogin}
              >
                Dev Sign In
              </Button>
              {import.meta.env.VITE_OAUTH_PORTAL_URL && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-purple-300 hidden sm:inline-flex"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  Sign In
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setLocation("/signup/organization")}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold"
              >
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Join</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-[60px]" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img
 src="/ready2spray-logo.png" alt="Ready2Spray" className="h-32 w-32 mx-auto" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Streamline Your Agricultural Spraying Operations
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Ready2Spray is the all-in-one platform for managing drone spraying jobs, tracking EPA compliance, 
            and coordinating your agricultural spray operations with AI-powered efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/signup/organization")}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold text-lg px-8"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-400 text-purple-200 hover:bg-purple-800/50"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            Everything You Need to Manage Spray Operations
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Job Management</h3>
              <p className="text-purple-200">
                Create, schedule, and track all your spray jobs in one centralized dashboard. Assign personnel, equipment, and locations with ease.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">EPA Compliance</h3>
              <p className="text-purple-200">
                AI-powered product label extraction automatically captures REI, PHI, application rates, and all EPA requirements from product labels.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Team Coordination</h3>
              <p className="text-purple-200">
                Manage customers, personnel, and equipment. Role-based access control ensures everyone sees exactly what they need.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Assistant</h3>
              <p className="text-purple-200">
                Built-in AI chat widget helps you manage jobs, check weather, and answer questions about your operations instantly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Audit Logging</h3>
              <p className="text-purple-200">
                Complete activity tracking for compliance and accountability. Know who did what, when, and why.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Bulk Import/Export</h3>
              <p className="text-purple-200">
                Import jobs from CSV, export data for reporting. Seamlessly integrate with your existing workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-purple-900/60 to-slate-900/60 backdrop-blur-md border border-purple-500/30 rounded-2xl p-12">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Operations?</h2>
          <p className="text-xl text-purple-200 mb-8">
            Join the waitlist today and be among the first to experience the future of agricultural spray management.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/signup/organization")}
            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold text-lg px-8"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-slate-900/80 backdrop-blur-md py-8">
        <div className="container mx-auto px-4 text-center text-purple-300">
          <p>&copy; 2025 Ready2Spray by GTM Planetary. All rights reserved.</p>
        </div>
      </footer>


    </div>
  );
}
