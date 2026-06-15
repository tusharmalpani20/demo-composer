import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  ApiClientError,
  createOrganizationInvite,
  listOrganizationInvites,
  listOrganizationMembers,
  revokeOrganizationInvite,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import type {
  OrganizationInvite,
  OrganizationInviteCreateResponse,
  OrganizationInviteListResponse,
  OrganizationInviteUpdateResponse,
  OrganizationMember,
  OrganizationMemberListResponse,
  OrganizationRole,
} from "./types";
import styles from "./OrganizationMembersPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; members: OrganizationMember[]; invites: OrganizationInvite[] }
  | { status: "unauthenticated" }
  | { status: "error" };

type OrganizationMembersPageProps = {
  loadMembers?: () => Promise<OrganizationMemberListResponse>;
  loadInvites?: () => Promise<OrganizationInviteListResponse>;
  createInvite?: (input: { email: string; role?: OrganizationRole }) => Promise<OrganizationInviteCreateResponse>;
  revokeInvite?: (inviteId: string) => Promise<OrganizationInviteUpdateResponse>;
  copyText?: (text: string) => Promise<void>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const defaultCopyText = async (text: string) => {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable");
  }

  await navigator.clipboard.writeText(text);
};

const stateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError && error.kind === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  return { status: "error" };
};

const inviteErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to invite organization members.";
    }

    if (error.type === "active_invite_exists") {
      return "An active invite already exists for this email.";
    }

    if (error.kind === "validation") {
      return error.message;
    }
  }

  return "Could not create invite.";
};

const reloadOrganization = async (
  loadMembers: () => Promise<OrganizationMemberListResponse>,
  loadInvites: () => Promise<OrganizationInviteListResponse>
): Promise<LoadState> => {
  const [memberResponse, inviteResponse] = await Promise.all([
    loadMembers(),
    loadInvites(),
  ]);

  return {
    status: "loaded",
    members: memberResponse.members,
    invites: inviteResponse.invites,
  };
};

export const OrganizationMembersPage = ({
  loadMembers = listOrganizationMembers,
  loadInvites = listOrganizationInvites,
  createInvite: createInviteAction = createOrganizationInvite,
  revokeInvite = revokeOrganizationInvite,
  copyText = defaultCopyText,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: OrganizationMembersPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationRole>("member");
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    reloadOrganization(loadMembers, loadInvites)
      .then((nextState) => {
        if (active) {
          setState(nextState);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState(stateFromError(error));
        }
      });

    return () => {
      active = false;
    };
  }, [loadMembers, loadInvites, reloadKey]);

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setFormError("Invite email is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setMessage(null);
    setInviteUrl(null);

    try {
      const response = await createInviteAction({ email: normalizedEmail, role });
      setEmail("");
      setRole("member");
      setInviteUrl(response.invite_url);
      setMessage("Invite link created. Copy it now; the token is only shown once.");
      setReloadKey((key) => key + 1);
    } catch (error: unknown) {
      setFormError(inviteErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteUrl = async () => {
    if (!inviteUrl) return;

    try {
      await copyText(inviteUrl);
      setMessage("Invite link copied.");
    } catch {
      setMessage("Could not copy invite link.");
    }
  };

  const revokePendingInvite = async (invite: OrganizationInvite) => {
    setBusyInviteId(invite.id);
    setMessage(null);

    try {
      await revokeInvite(invite.id);
      setInviteUrl(null);
      setReloadKey((key) => key + 1);
    } catch {
      setMessage("Could not revoke invite.");
    } finally {
      setBusyInviteId(null);
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading organization members...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to manage organization members.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load organization members.</div>
          <button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Organization</div>
          <h1 className={styles.title}>Organization members</h1>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="invite-member-heading">
        <h2 className={styles.sectionTitle} id="invite-member-heading">Invite member</h2>
        <form className={styles.form} onSubmit={submitInvite}>
          {formError ? <div className={styles.formError}>{formError}</div> : null}
          {message ? <div className={styles.message}>{message}</div> : null}
          {inviteUrl ? (
            <div className={styles.inviteLink}>
              <span>{inviteUrl}</span>
              <button className={styles.secondaryButton} type="button" onClick={() => void copyInviteUrl()}>
                Copy invite link
              </button>
            </div>
          ) : null}
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Invite email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Invite role</span>
              <select value={role} onChange={(event) => setRole(event.target.value as OrganizationRole)}>
                <option value="member">member</option>
                <option value="owner">owner</option>
              </select>
            </label>
          </div>
          <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating invite..." : "Create invite"}
          </button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="members-heading">
        <h2 className={styles.sectionTitle} id="members-heading">Members</h2>
        <div className={styles.rows}>
          {state.members.map((member) => (
            <article className={styles.row} data-testid="organization-member-row" key={member.id}>
              <div>
                <h3 className={styles.rowTitle}>{member.display_name || member.email}</h3>
                <div className={styles.rowMeta}>{member.email}</div>
              </div>
              <span className={styles.badge}>{member.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="pending-invites-heading">
        <h2 className={styles.sectionTitle} id="pending-invites-heading">Pending invites</h2>
        {state.invites.length === 0 ? (
          <div className={styles.empty}>No pending invites.</div>
        ) : (
          <div className={styles.rows}>
            {state.invites.map((invite) => (
              <article className={styles.row} data-testid="organization-invite-row" key={invite.id}>
                <div>
                  <h3 className={styles.rowTitle}>{invite.email}</h3>
                  <div className={styles.rowMeta}>Expires {new Date(invite.expires_at).toLocaleDateString()}</div>
                </div>
                <div className={styles.rowActions}>
                  <span className={styles.badge}>{invite.status}</span>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    disabled={busyInviteId === invite.id}
                    onClick={() => void revokePendingInvite(invite)}
                  >
                    {busyInviteId === invite.id ? "Revoking..." : `Revoke invite for ${invite.email}`}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  performLogout,
  navigate,
}: {
  children: ReactNode;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar context="Organization" performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);
