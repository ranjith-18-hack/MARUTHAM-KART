import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useCallback, memo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import { triggerGoogleAccountChooser } from "@/lib/google-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign In | MARUTHAM KART" },
      {
        name: "description",
        content: "MARUTHAM KART — Fresh agricultural products directly from farmers to your doorstep.",
      },
    ],
  }),
  component: CustomerAuthScreen,
});

type AuthMode = "login" | "otp" | "register";

declare global {
  interface Window {
    google?: any;
  }
}

// 1. BRAND HEADER (Memoized: 0 re-renders during typing)
const AuthBrandHeader = memo(function AuthBrandHeader() {
  return (
    <header className="w-full max-w-lg mx-auto pt-8 px-4 pb-4 flex flex-col items-center text-center select-none">
      <div className="w-24 h-24 mb-3 relative flex items-center justify-center bg-white rounded-3xl shadow-sm border border-emerald-100 p-2 transform-gpu">
        <img
          src="/logo-auth.png"
          alt="MARUTHAM KART Logo"
          width={96}
          height={96}
          decoding="async"
          loading="eager"
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/favicon.png";
          }}
        />
      </div>
      <h1 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-1.5">
        MARUTHAM KART
      </h1>
      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mt-0.5">
        From Farmers • For Everyone
      </p>
    </header>
  );
});

// 2. AUTH MODE TABS (Memoized: only re-renders on tab switch)
interface AuthModeTabsProps {
  mode: AuthMode;
  onSelectMode: (mode: AuthMode) => void;
}
const AuthModeTabs = memo(function AuthModeTabs({ mode, onSelectMode }: AuthModeTabsProps) {
  return (
    <div className="flex bg-emerald-50/80 p-1.5 rounded-2xl mb-6 border border-emerald-100/50">
      <button
        type="button"
        onClick={() => onSelectMode("login")}
        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
          mode === "login"
            ? "bg-white text-emerald-900 shadow-sm border border-emerald-100 font-extrabold"
            : "text-emerald-700 hover:text-emerald-900"
        }`}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onSelectMode("otp")}
        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
          mode === "otp"
            ? "bg-white text-emerald-900 shadow-sm border border-emerald-100 font-extrabold"
            : "text-emerald-700 hover:text-emerald-900"
        }`}
      >
        Phone OTP
      </button>
      <button
        type="button"
        onClick={() => onSelectMode("register")}
        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
          mode === "register"
            ? "bg-white text-emerald-900 shadow-sm border border-emerald-100 font-extrabold"
            : "text-emerald-700 hover:text-emerald-900"
        }`}
      >
        Register
      </button>
    </div>
  );
});

// 3. ERROR ALERT BANNER (Memoized)
const ErrorAlert = memo(function ErrorAlert({ errorMsg }: { errorMsg: string | null }) {
  if (!errorMsg) return null;
  return (
    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 font-medium transition-all">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <span className="flex-1 leading-relaxed">{errorMsg}</span>
    </div>
  );
});

// 4. GOOGLE SIGN-IN BUTTON (Memoized)
interface GoogleSignInButtonProps {
  loading: boolean;
  onClick: () => void;
}
const GoogleSignInButton = memo(function GoogleSignInButton({ loading, onClick }: GoogleSignInButtonProps) {
  return (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-500 font-medium">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] transition-all transform-gpu"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>
    </>
  );
});

// 5. PASSWORD LOGIN FORM (Local state: 0 parent re-renders during typing)
interface PasswordLoginFormProps {
  loading: boolean;
  onLogin: (identifier: string, pass: string) => void;
  onGoogleSignIn: () => void;
}
const PasswordLoginForm = memo(function PasswordLoginForm({ loading, onLogin, onGoogleSignIn }: PasswordLoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(identifier, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-identifier" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
          Mobile Number / Email
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <User className="w-4 h-4" />
          </span>
          <input
            id="login-identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="Enter mobile or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5 ml-1">
          <label htmlFor="login-password" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Password
          </label>
          <button
            type="button"
            onClick={() => toast.info("Please use Phone OTP login or contact support to reset password.")}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Forgot?
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Lock className="w-4 h-4" />
          </span>
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
            className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2 transform-gpu"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In to MARUTHAM KART"}
      </button>

      <GoogleSignInButton loading={loading} onClick={onGoogleSignIn} />
    </form>
  );
});

// 6. PHONE OTP FORM (Local state: isolated typing & fast timers)
interface PhoneOtpFormProps {
  loading: boolean;
  onSendOtp: (phone: string, channel: "sms" | "whatsapp") => Promise<boolean>;
  onVerifyOtp: (phone: string, code: string) => void;
  onGoogleSignIn: () => void;
}
const PhoneOtpForm = memo(function PhoneOtpForm({ loading, onSendOtp, onVerifyOtp, onGoogleSignIn }: PhoneOtpFormProps) {
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSendOtp(phone, channel);
    if (success) {
      setOtpSent(true);
      setResendTimer(30);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    onVerifyOtp(phone, otpCode);
  };

  const handleResend = async () => {
    const success = await onSendOtp(phone, channel);
    if (success) {
      setResendTimer(30);
    }
  };

  return (
    <div className="space-y-4">
      {!otpSent ? (
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
              Delivery Channel
            </label>
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-3">
              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  channel === "sms"
                    ? "bg-white text-emerald-900 shadow-sm font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📱 Mobile SMS
              </button>
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  channel === "whatsapp"
                    ? "bg-white text-emerald-900 shadow-sm font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                💬 WhatsApp
              </button>
            </div>

            <label htmlFor="otp-phone" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-800 border-r border-slate-200 pr-2.5">
                +91
              </span>
              <input
                id="otp-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
                className="w-full pl-16 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all tracking-wider"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || phone.trim().length < 10}
            className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2 transform-gpu"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Send OTP via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`}
          </button>

          <GoogleSignInButton loading={loading} onClick={onGoogleSignIn} />
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="text-center pb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> OTP sent via {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to +91 {phone.slice(0, 2)}****{phone.slice(-4)}
            </span>
          </div>

          <div>
            <label htmlFor="otp-code" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
              Enter 6-Digit OTP
            </label>
            <input
              id="otp-code"
              name="otp"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              required
              placeholder="••••••"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
              className="w-full text-center tracking-[0.6em] text-xl font-black py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
            />
          </div>

          <div className="flex justify-between items-center text-xs px-1">
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="text-slate-500 font-semibold hover:text-slate-700"
            >
              Change Number
            </button>
            {resendTimer > 0 ? (
              <span className="text-slate-400 font-medium">Resend code in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-emerald-700 font-bold hover:text-emerald-800"
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length < 4}
            className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2 transform-gpu"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sign In"}
          </button>
        </form>
      )}
    </div>
  );
});

// 7. REGISTRATION FORM (Local state: isolated fields)
interface RegisterFormProps {
  loading: boolean;
  onRegister: (data: { name: string; phone?: string; email?: string; pass: string; confirmPass: string; agree: boolean }) => void;
  onGoogleSignIn: () => void;
}
const RegisterForm = memo(function RegisterForm({ loading, onRegister, onGoogleSignIn }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister({
      name,
      phone,
      email,
      pass: password,
      confirmPass: confirmPassword,
      agree: agreeTerms,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label htmlFor="reg-name" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
          Full Name
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          autoComplete="name"
          spellCheck={false}
          required
          placeholder="e.g. Ramesh Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="reg-phone" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
            Mobile Number
          </label>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="tel"
            maxLength={10}
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
            Email Address
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
          Create Password
        </label>
        <div className="relative">
          <input
            id="reg-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={6}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
            className="w-full px-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="reg-confirm-password" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
          Confirm Password
        </label>
        <input
          id="reg-confirm-password"
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
        />
      </div>

      <div className="flex items-center gap-2 pt-1 px-1">
        <input
          type="checkbox"
          id="terms"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          className="rounded text-emerald-700 focus:ring-emerald-600 w-4 h-4"
        />
        <label htmlFor="terms" className="text-xs text-slate-600 font-medium">
          I agree to the <span className="text-emerald-700 font-bold">Terms of Service</span> and{" "}
          <span className="text-emerald-700 font-bold">Privacy Policy</span>.
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2 transform-gpu"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Customer Account"}
      </button>

      <GoogleSignInButton loading={loading} onClick={onGoogleSignIn} />
    </form>
  );
});

// 8. GOOGLE ACCOUNT CHOOSER MODAL (Memoized)
interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, name: string, id: string) => void;
}
const GoogleAccountChooserModal = memo(function GoogleAccountChooserModal({
  isOpen,
  onClose,
  onSelectAccount,
}: GoogleAccountChooserModalProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    onSelectAccount(
      customEmail.trim().toLowerCase(),
      customName.trim() || customEmail.split("@")[0],
      `g_${Date.now()}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 relative transform-gpu">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center pt-2 pb-4">
          <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 text-base">Sign in with Google</h3>
          <p className="text-xs text-slate-500 mt-0.5">Choose an account to continue to MARUTHAM KART</p>
        </div>

        {!showCustom ? (
          <div className="space-y-2 py-1">
            <button
              type="button"
              onClick={() => onSelectAccount("ranjith.marutham@gmail.com", "Ranjith Kumar", "g_ranjith_1")}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-left transition-all group active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                R
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate">Ranjith Kumar</p>
                <p className="text-[11px] text-slate-500 truncate">ranjith.marutham@gmail.com</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">Active</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectAccount("customer@gmail.com", "Farm Fresh Customer", "g_customer_2")}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-left transition-all group active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                F
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate">Farm Fresh Customer</p>
                <p className="text-[11px] text-slate-500 truncate">customer@gmail.com</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-left transition-all text-slate-600 hover:text-emerald-700 active:scale-[0.98] mt-2"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xs">Use another Google account</p>
                <p className="text-[10px] text-slate-400">Enter custom Google email</p>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3 py-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Google Email
              </label>
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Full Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ananya Sharma"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!customEmail.includes("@")}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 transition-all"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
});

// 9. AUTH TRUST FOOTER (Memoized: 0 re-renders)
const AuthTrustFooter = memo(function AuthTrustFooter() {
  return (
    <footer className="mt-6 text-center space-y-2 select-none">
      <div className="flex items-center justify-center gap-4 text-xs font-semibold text-emerald-800/80">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Direct Farm Sourcing
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" /> 100% Quality Guaranteed
        </span>
      </div>
      <p className="text-[11px] text-slate-400">
        Protected by SSL Encryption • MARUTHAM KART Platform
      </p>
    </footer>
  );
});

// 10. MAIN ROOT AUTH CONTAINER (Coordinating Controller)
function CustomerAuthScreen() {
  const navigate = useNavigate();
  const { user, isAuthenticated, needsOnboarding, login, loginWithOtp, loginWithGoogle, registerCustomer } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role.toUpperCase() === "CUSTOMER") {
        if (needsOnboarding) {
          navigate({ to: "/onboarding" });
        } else {
          navigate({ to: "/home" });
        }
      }
    }
  }, [isAuthenticated, user, needsOnboarding, navigate]);

  const handleSelectMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg(null);
  }, []);

  // Handle Password Login Callback
  const handlePasswordLogin = useCallback(
    async (identifier: string, pass: string) => {
      setErrorMsg(null);
      if (!identifier.trim()) {
        setErrorMsg("Please enter your mobile number or email address.");
        return;
      }
      if (!pass) {
        setErrorMsg("Please enter your account password.");
        return;
      }

      setLoading(true);
      try {
        const res = await login(identifier, pass);
        if (res.success && res.portal) {
          toast.success("Welcome back to MARUTHAM KART!");
          if (res.needsOnboarding) {
            navigate({ to: "/onboarding" });
          } else {
            navigate({ to: res.portal as any });
          }
        } else {
          setErrorMsg("Invalid mobile/email or password. Please try again.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to sign in. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [login, navigate]
  );

  // Handle Send OTP Callback
  const handleSendOtp = useCallback(
    async (phone: string, channel: "sms" | "whatsapp"): Promise<boolean> => {
      setErrorMsg(null);
      const cleanPhone = phone.trim();
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg("Please enter a valid 10-digit mobile number.");
        return false;
      }

      setLoading(true);
      try {
        const res = await authApi.sendOtp({ phone: cleanPhone, purpose: "login", channel });
        const medium = channel === "whatsapp" ? "WhatsApp" : "SMS";
        toast.success(res.message || `Verification code sent via ${medium}.`);
        return true;
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to send OTP. Please check your connection and configuration.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Handle Verify OTP Callback
  const handleVerifyOtp = useCallback(
    async (phone: string, code: string) => {
      setErrorMsg(null);
      if (!code || code.trim().length < 4) {
        setErrorMsg("Please enter the verification code sent to your phone.");
        return;
      }

      setLoading(true);
      try {
        const res = await loginWithOtp(phone, code);
        if (res.success) {
          if (res.needsOnboarding) {
            navigate({ to: "/onboarding" });
          } else {
            navigate({ to: "/home" });
          }
        } else {
          setErrorMsg("Invalid verification code. Please check and try again.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Verification failed.");
      } finally {
        setLoading(false);
      }
    },
    [loginWithOtp, navigate]
  );

  // Handle Google Login Execution Callback
  const executeGoogleLogin = useCallback(
    async (email: string, name: string, avatarUrl?: string, googleId?: string) => {
      setErrorMsg(null);
      setLoading(true);
      try {
        const res = await loginWithGoogle({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          avatar_url: avatarUrl,
          google_id: googleId || `g_${Date.now()}`,
        });
        if (res.success) {
          if (res.needsOnboarding) {
            navigate({ to: "/onboarding" });
          } else {
            navigate({ to: "/home" });
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Google authentication failed.");
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, navigate]
  );

  // Handle Google Sign-In Trigger
  const handleGoogleSignIn = useCallback(() => {
    setErrorMsg(null);
    const clientId =
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      "1028741363990-maruthamkart.apps.googleusercontent.com";

    triggerGoogleAccountChooser(
      clientId,
      (profile) => {
        executeGoogleLogin(
          profile.email,
          profile.name,
          profile.picture,
          profile.sub
        );
      },
      (err) => {
        setErrorMsg(err);
      },
      () => {
        setShowGoogleModal(true);
      }
    );
  }, [executeGoogleLogin]);

  // Handle Customer Registration Callback
  const handleRegister = useCallback(
    async (data: { name: string; phone?: string; email?: string; pass: string; confirmPass: string; agree: boolean }) => {
      setErrorMsg(null);
      if (!data.name.trim() || data.name.length < 2) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      if (!data.phone && !data.email) {
        setErrorMsg("Please provide at least a mobile number or email address.");
        return;
      }
      if (data.pass.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
      if (data.pass !== data.confirmPass) {
        setErrorMsg("Passwords do not match. Please re-enter your password.");
        return;
      }
      if (!data.agree) {
        setErrorMsg("Please accept the Terms of Service to create an account.");
        return;
      }

      setLoading(true);
      try {
        const res = await registerCustomer({
          name: data.name.trim(),
          phone: data.phone?.trim() || undefined,
          email: data.email?.trim() || undefined,
          password: data.pass,
        });

        if (res.success) {
          navigate({ to: "/onboarding" });
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Registration failed. Account may already exist.");
      } finally {
        setLoading(false);
      }
    },
    [registerCustomer, navigate]
  );

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex flex-col justify-between">
      {/* 1. Brand Logo Header */}
      <AuthBrandHeader />

      {/* 2. Main Authentication Card */}
      <main className="w-full max-w-md mx-auto px-4 pb-8 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-emerald-950/5 border border-emerald-100/80">
          {/* Mode Switcher Tabs */}
          <AuthModeTabs mode={mode} onSelectMode={handleSelectMode} />

          {/* Error Alert Banner */}
          <ErrorAlert errorMsg={errorMsg} />

          {/* 1. PASSWORD LOGIN TAB */}
          {mode === "login" && (
            <PasswordLoginForm
              loading={loading}
              onLogin={handlePasswordLogin}
              onGoogleSignIn={handleGoogleSignIn}
            />
          )}

          {/* 2. PHONE OTP TAB */}
          {mode === "otp" && (
            <PhoneOtpForm
              loading={loading}
              onSendOtp={handleSendOtp}
              onVerifyOtp={handleVerifyOtp}
              onGoogleSignIn={handleGoogleSignIn}
            />
          )}

          {/* 3. CREATE ACCOUNT TAB */}
          {mode === "register" && (
            <RegisterForm
              loading={loading}
              onRegister={handleRegister}
              onGoogleSignIn={handleGoogleSignIn}
            />
          )}
        </div>

        {/* 3. Trust & Security Footer */}
        <AuthTrustFooter />
      </main>

      {/* Google Account Selection Modal */}
      <GoogleAccountChooserModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={(email, name, id) => {
          setShowGoogleModal(false);
          executeGoogleLogin(email, name, undefined, id);
        }}
      />
    </div>
  );
}
