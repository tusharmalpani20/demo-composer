import { FormEvent, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ApiClientError, login } from "../../lib/api";
import { safeNextPath } from "./navigation";
import { OssieBrand } from "../../components/OssieBrand";
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
  nextPath = "/projects",
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
      navigate(safeNextPath(nextPath, "/projects"));
    } catch (submitError: unknown) {
      setError(errorMessage(submitError));
      setState("idle");
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/projects"><OssieBrand /></a>
      </header>
      <main className={styles.main}>
        <Card className={styles.panel} aria-labelledby="login-heading">
          <CardHeader>
            <h1 className={styles.title} id="login-heading">Sign in</h1>
            <p className={styles.copy}>Access your projects, capture sessions, guides, and demos.</p>
          </CardHeader>
          <CardContent>
            <form className={styles.form} onSubmit={handleSubmit}>
              <Label className={styles.field}>
                <span>Email</span>
                <Input
                  type="email"
                  value={email}
                  required
                  autoComplete="email"
                  disabled={submitting}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Label>
              <Label className={styles.field}>
                <span>Password</span>
                <Input
                  type="password"
                  value={password}
                  required
                  autoComplete="current-password"
                  disabled={submitting}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Label>
              {error ? <Alert variant="destructive">{error}</Alert> : null}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
