import { useEffect } from 'react';
import { Building2 } from 'lucide-react';

export function AuthCallback() {
  useEffect(() => {
    // The session is automatically handled by Supabase
    // Redirect to home after a short delay
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 animate-pulse">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Signing you in...</h2>
        <p className="text-slate-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
