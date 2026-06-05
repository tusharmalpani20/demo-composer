import { FormEvent, useState } from "react";
import { ApiClientError, login } from "../../lib/api";
import { safeNextPath } from "./navigation";
import type { AuthResponse } from "./types";
import styles from "./LoginPage.module.css";

type LoginPageProps = {
  nextPath?: string;
  submitLogin?: (data: {
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  navigate?: (path: string) => void;
};

const errorMessage = (error: unknown) => (
  error instanceof ApiClientError && error.type === "invalid_credentials"
    ? "Email or password is incorrect."
    : "Could not sign in."
);

export const LoginPage = ({
  nextPath = "/",
  submitLogin = login,
  navigate = (path) => window.location.assign(path),
}: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const submitting = state === "submitting";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    setError(null);

    try {
      await submitLogin({
        email: email.trim(),
        password,
      });
      navigate(safeNextPath(nextPath));
    } catch (submitError: unknown) {
      setError(errorMessage(submitError));
      setState("idle");
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>Demo Composer</div>
      </header>
      <main className={styles.main}>
        <section className={styles.panel} aria-labelledby="login-heading">
          <h1 className={styles.title} id="login-heading">Sign in</h1>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                value={email}
                required
                autoComplete="email"
                disabled={submitting}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Password</span>
              <input
                type="password"
                value={password}
                required
                autoComplete="current-password"
                disabled={submitting}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <div className={styles.error}>{error}</div> : null}
            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};
