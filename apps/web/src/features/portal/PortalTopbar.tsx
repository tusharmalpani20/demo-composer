import { useState } from "react";
import { logout } from "../../lib/api";
import styles from "./PortalTopbar.module.css";

type PortalTopbarProps = {
  context: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

export const PortalTopbar = ({
  context,
  performLogout = logout,
  navigate = (path) => window.location.assign(path),
}: PortalTopbarProps) => {
  const [state, setState] = useState<"idle" | "signing_out">("idle");
  const [error, setError] = useState<string | null>(null);
  const signingOut = state === "signing_out";

  const handleSignOut = async () => {
    setState("signing_out");
    setError(null);

    try {
      await performLogout();
      navigate("/login");
    } catch {
      setError("Could not sign out.");
      setState("idle");
    }
  };

  return (
    <header className={styles.topbar}>
      <div>
        <div className={styles.brand}>Demo Composer</div>
        <div className={styles.context}>{context}</div>
      </div>
      <div className={styles.actions}>
        {error ? <div className={styles.error}>{error}</div> : null}
        <button className={styles.signOutButton} type="button" disabled={signingOut} onClick={handleSignOut}>
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
};
