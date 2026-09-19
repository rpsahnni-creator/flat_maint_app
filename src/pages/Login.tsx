import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, Mail, Lock, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';
import { BrandFooter } from '@/components/BrandFooter';

export function Login() {
  const { signInWithPassword, signInWithGoogle, requestOTP, verifyOTP, error } = useAuth();
  const [email, setLocalEmail] = useState('admin@greenvalley.com');
  const [password, setPassword] = useState('Admin123!');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [mode, setMode] = useState<'password' | 'otp' | 'otp-verify'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const showError = localError || error;

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setLocalError('');
      await signInWithPassword(email.trim(), password);
    } catch (err: unknown) {
      setLocalError('Login failed. Check email/password.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setIsLoading(true);
      setLocalError('');
      await signInWithGoogle();
    } catch (err) {
      setLocalError('Google sign-in failed (configure GOOGLE_WEB_CLIENT_ID for production).');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setLocalError('');
      const res = await requestOTP(email.trim());
      if (res.demo_code) setDemoOtp(res.demo_code);
      setMode('otp-verify');
    } catch (err) {
      setLocalError('Could not send OTP.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setLocalError('');
      await verifyOTP(email.trim(), otp.trim());
    } catch (err) {
      setLocalError('Invalid OTP.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100 px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{BRAND.clientName}</h1>
          <p className="text-slate-600 text-sm sm:text-base">{BRAND.clientLocation}</p>
          <p className="text-sm text-slate-500 mt-1">{BRAND.productTagline}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-8">
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-teal-100 text-sm mt-2">Sign in with your society account</p>
          </div>

          <div className="p-6 space-y-4">
            {showError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{showError}</p>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              Demo: admin@greenvalley.com / Admin123! · resident@greenvalley.com / Resident123!
            </div>

            {mode === 'password' && (
              <form onSubmit={handlePassword} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 outline-none"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full py-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 font-semibold text-white',
                    isLoading && 'opacity-50',
                  )}
                >
                  {isLoading ? <Loader className="h-5 w-5 animate-spin mx-auto" /> : 'Sign in'}
                </button>
              </form>
            )}

            {mode === 'otp' && (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setLocalEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 outline-none focus:border-teal-600"
                  required
                />
                <button type="submit" disabled={isLoading} className="w-full py-3 rounded-lg bg-teal-600 text-white font-semibold">
                  Send OTP
                </button>
                <button type="button" onClick={() => setMode('password')} className="w-full text-sm text-slate-500">
                  Back
                </button>
              </form>
            )}

            {mode === 'otp-verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                {demoOtp && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    Dev OTP: <strong>{demoOtp}</strong>
                  </p>
                )}
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 outline-none focus:border-teal-600"
                  required
                />
                <button type="submit" disabled={isLoading} className="w-full py-3 rounded-lg bg-teal-600 text-white font-semibold">
                  Verify OTP
                </button>
              </form>
            )}

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-sm text-slate-500">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full py-3 rounded-lg border-2 border-slate-200 font-semibold text-slate-700 hover:bg-teal-50"
            >
              Continue with Google
            </button>
            {mode === 'password' && (
              <button onClick={() => setMode('otp')} className="w-full text-sm text-teal-700 font-medium">
                Sign in with Email OTP
              </button>
            )}
          </div>
        </div>

        <BrandFooter className="mt-8" />
      </div>
    </div>
  );
}
