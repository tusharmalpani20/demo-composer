import { FormEvent, useEffect, useState } from "react";
import {
  ApiClientError,
  completeFirstRunSetup,
  getPublicInstanceStatus,
  type PublicInstanceStatus,
} from "../../lib/api";
import type { AuthResponse } from "../auth/types";
import type { FirstRunSetupInput } from "./types";
import styles from "./FirstRunSetupPage.module.css";

type FirstRunSetupPageProps = {
  getInstanceStatus?: () => Promise<PublicInstanceStatus>;
  completeSetup?: (input: FirstRunSetupInput) => Promise<AuthResponse>;
  navigate?: (path: string) => void;
};

type PageState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "complete" }
  | { status: "unavailable" }
  | { status: "error"; message: string };

const textOrNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const setupErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.type === "first_run_setup_completed") {
      return "This instance is already set up.";
    }

    return error.message;
  }

  return "Could not complete first-run setup.";
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brand}>Demo Composer</div>
    </header>
    <main className={styles.main}>
      <section className={styles.panel}>{children}</section>
    </main>
  </div>
);

export const FirstRunSetupPage = ({
  getInstanceStatus = getPublicInstanceStatus,
  completeSetup = completeFirstRunSetup,
  navigate = (path) => window.location.assign(path),
}: FirstRunSetupPageProps) => {
  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [ownerEmail, setOwnerEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setPageState({ status: "loading" });

    getInstanceStatus()
      .then((status) => {
        if (!active) return;

        if (status.onboarding_mode !== "first_run_setup") {
          setPageState({ status: "unavailable" });
          return;
        }

        setPageState(status.setup_required ? { status: "ready" } : { status: "complete" });
      })
      .catch(() => {
        if (active) {
          setPageState({
            status: "error",
            message: "Could not load instance setup status.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [getInstanceStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await completeSetup({
        owner: {
          email: ownerEmail.trim(),
          password,
          first_name: textOrNull(firstName),
          last_name: textOrNull(lastName),
        },
        organization: {
          name: organizationName.trim(),
        },
      });
      navigate("/projects");
    } catch (error: unknown) {
      const message = setupErrorMessage(error);
      setSubmitError(message);
      setSubmitting(false);

      if (message === "This instance is already set up.") {
        setPageState({ status: "complete" });
      }
    }
  };

  if (pageState.status === "loading") {
    return (
      <Shell>
        <h1 className={styles.title}>Loading setup...</h1>
      </Shell>
    );
  }

  if (pageState.status === "complete") {
    return (
      <Shell>
        <h1 className={styles.title}>This instance is already set up.</h1>
        <p className={styles.copy}>Sign in with an existing owner account to continue.</p>
        <a className={styles.link} href="/login">Go to sign in</a>
      </Shell>
    );
  }

  if (pageState.status === "unavailable") {
    return (
      <Shell>
        <h1 className={styles.title}>First-run setup is not available for this instance.</h1>
        <p className={styles.copy}>Use the configured onboarding flow for this deployment.</p>
      </Shell>
    );
  }

  if (pageState.status === "error") {
    return (
      <Shell>
        <h1 className={styles.title}>Setup unavailable</h1>
        <div className={styles.error}>{pageState.message}</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className={styles.title}>Set up Demo Composer</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Owner email</span>
          <input
            type="email"
            value={ownerEmail}
            required
            autoComplete="email"
            disabled={submitting}
            onChange={(event) => setOwnerEmail(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>First name</span>
          <input
            type="text"
            value={firstName}
            autoComplete="given-name"
            disabled={submitting}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Last name</span>
          <input
            type="text"
            value={lastName}
            autoComplete="family-name"
            disabled={submitting}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Organization name</span>
          <input
            type="text"
            value={organizationName}
            required
            autoComplete="organization"
            disabled={submitting}
            onChange={(event) => setOrganizationName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            required
            autoComplete="new-password"
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {submitError ? <div className={styles.error}>{submitError}</div> : null}
        <button className={styles.primaryButton} type="submit" disabled={submitting}>
          {submitting ? "Creating owner account..." : "Create owner account"}
        </button>
      </form>
    </Shell>
  );
};
