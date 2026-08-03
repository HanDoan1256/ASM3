import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { authService } from "../services/authService";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // State for tracking account not found condition
  const [accountNotFound, setAccountNotFound] = useState(false);
  
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setAccountNotFound(false);

    try {
      if (mode === "register") {
        const result = await authService.register({ 
          email, 
          full_name: fullName, 
          password, 
          phone 
        });
        setMessage(`Registered ${result.email} successfully. Please switch to Login tab.`);
      } else {
        const result = await authService.login({ email, password });
        
        if (result && result.principal_id) {
          localStorage.setItem("smartfm_principal_id", result.principal_id);
          localStorage.setItem("smartfm_principal_type", result.principal_type || "customer");
          localStorage.setItem("smartfm_principal_role", result.role || "customer");
          localStorage.setItem("smartfm_access_token", result.access_token);
          
          setMessage("Login successful! Redirecting to account...");

          setTimeout(() => {
            window.location.href = "/"; // Hard reload to clear guest state completely
          }, 500);
        }
      }
    } catch (err: any) {
      console.error(err);
      
      // Read error detail from backend FastAPI response
      const errorDetail = err.response?.data?.detail?.toLowerCase() || "";

      // CLASSIFY ERRORS PER REQUIREMENTS:
      if (errorDetail.includes("not found") || errorDetail.includes("không tìm thấy")) {
        setError("Account with this email address was not found. ");
        setAccountNotFound(true); // Trigger option to switch to registration
      } 
      else if (errorDetail.includes("password") || errorDetail.includes("mật khẩu")) {
        setError("Incorrect password. Please verify and try again.");
      } 
      else {
        // Fallback for other server errors
        setError("Authentication failed. Please verify your connection.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1440px] overflow-hidden rounded-[32px] border border-border bg-white shadow-panel lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-brand-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_22%),linear-gradient(180deg,#0058BE_0%,#00489A_100%)]" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">SmartFM</p>
            <h1 className="mt-6 max-w-md text-5xl font-bold leading-tight">Smart Freight Management Platform</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/85">
              Enterprise-grade visibility for logistics teams managing orders, shipment execution, fleet assignments,
              and payment workflows.
            </p>
          </div>

          <div className="relative z-10 grid gap-4">
            {[
              "Centralized order and shipment operations",
              "Driver, vehicle, and assignment visibility",
              "Internal dashboard for modern logistics teams",
            ].map((item) => (
              <div key={item} className="glass-surface flex items-center gap-3 px-4 py-4 text-white">
                <Icon className="text-[22px]" name="check_circle" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Welcome Back</p>
              <h2 className="mt-3 text-[32px] font-bold text-text-primary">
                {mode === "login" ? "Sign in to SmartFM" : "Create your SmartFM account"}
              </h2>
              <p className="mt-3 text-base leading-7 text-text-secondary">
                Access your internal logistics workspace and manage freight operations confidently.
              </p>
            </div>

            <div className="mb-6 inline-flex rounded-2xl border border-border bg-brand-50 p-1">
              <button
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary"
                }`}
                onClick={() => { setMode("login"); setError(""); setAccountNotFound(false); }}
                type="button"
              >
                Login
              </button>
              <button
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "register" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary"
                }`}
                onClick={() => { setMode("register"); setError(""); setAccountNotFound(false); }}
                type="button"
              >
                Register
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "register" && (
                <>
                  <Input 
                    label="Full Name" 
                    placeholder="Alex Morgan" 
                    value={fullName} 
                    onChange={(event) => setFullName(event.target.value)} 
                    required 
                  />
                  <Input 
                    label="Phone Number" 
                    placeholder="0912345678" 
                    type="tel" 
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={phone} 
                    onChange={(event) => {
                      const numericValue = event.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(numericValue);
                    }} 
                    required 
                  />
                </>
              )}
              <Input label="Email Address" placeholder="team@smartfm.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <Input label="Password" placeholder="Enter your password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />

              <Button className="w-full" type="submit">
                {mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            {/* ERROR DISPLAY WITH ACCOUNT CREATION REDIRECTION PROMPT */}
            {(message || error) && (
              <div className={`mt-5 rounded-2xl px-4 py-3 text-sm ${error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                <span>{error || message}</span>
                {accountNotFound && (
                  <span 
                    className="ml-1 cursor-pointer font-bold text-brand-600 underline hover:text-brand-700"
                    onClick={() => {
                      setMode("register");
                      setError("");
                      setAccountNotFound(false);
                    }}
                  >
                    Would you like to create a new account?
                  </span>
                )}
              </div>
            )}

            <p className="mt-6 text-sm text-text-secondary">
              Use the enterprise dashboard after login. You can also preview the workspace from{" "}
              <Link className="font-semibold text-brand-500" to="/">
                Dashboard
              </Link>
              .
            </p>
          </div>
        </section>
      </div>

      <Modal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} title="">
        <div className="py-6 px-2 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-inner">
            <Icon className="text-3xl" name="local_shipping" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-text-primary">Welcome to SmartFM</h3>
            <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
              Do you already have an account with us, or would you like to set up a new one?
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              className="w-full py-3 rounded-2xl font-semibold shadow-md"
              onClick={() => {
                setMode("login");
                setShowWelcomeModal(false);
              }}
            >
              Sign In
            </Button>
            <Button
              variant="secondary"
              className="w-full py-3 rounded-2xl font-semibold border-border hover:bg-gray-50"
              onClick={() => {
                setMode("register");
                setShowWelcomeModal(false);
              }}
            >
              Create Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}