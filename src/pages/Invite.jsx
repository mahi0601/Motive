import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';
import { getInviteByToken, acceptInvite, declineInvite } from '../services/workspaceService';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { logger } from '../utils/logger';

const ROLE_LABEL = { editor: 'an editor', viewer: 'a viewer' };

// Public — reachable with no account at all, which is the entire point
// (see workspace.service.js's note on why inviteMember used to fail here).
// Branches into three states below rather than three separate routes, since
// they all start from the same "look up this token" step.
const Invite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, bootstrapping } = useAuth();
  const { loadWorkspace } = useWorkspace();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getInviteByToken(token)
      .then(({ data }) => { if (active) setInvite(data.invite); })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const handleAccept = async () => {
    setResponding(true);
    setError('');
    try {
      await acceptInvite(token);
      await loadWorkspace(); // picks up the new workspace immediately
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not accept this invite.');
      logger.warn('Invite accept failed', { error: err.message });
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    try {
      await declineInvite(token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not decline this invite.');
      logger.warn('Invite decline failed', { error: err.message });
      setResponding(false);
    }
  };

  const Shell = ({ children }) => (
    <div className="flex min-h-screen items-center justify-center bg-light-background px-6 dark:bg-dark-background">
      <div className="w-full max-w-md text-center">
        <LogoMark size={48} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );

  if (loading || bootstrapping) {
    return (
      <Shell>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-light-muted dark:text-dark-muted" />
      </Shell>
    );
  }

  if (notFound || !invite || invite.status !== 'pending' || invite.expired) {
    const message =
      invite?.status === 'accepted' ? 'This invite has already been accepted.'
      : invite?.status === 'declined' ? 'This invite was declined.'
      : invite?.status === 'revoked' ? 'This invite has been revoked.'
      : invite?.expired ? 'This invite link has expired — ask for a new one.'
      : 'This invite link is invalid.';
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 text-semantic-danger-500 dark:text-semantic-danger-dark">
          <AlertCircle size={20} />
          <h1 className="font-display text-xl font-bold text-light-text dark:text-white">Can't open this invite</h1>
        </div>
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">{message}</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          Go to Motive
        </Link>
      </Shell>
    );
  }

  const heading = (
    <>
      <h1 className="font-display text-2xl font-bold text-light-text dark:text-white">
        Join {invite.workspaceName}
      </h1>
      <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
        <strong className="text-light-text dark:text-dark-text">{invite.inviterName}</strong> invited you as {ROLE_LABEL[invite.role] || invite.role} on Motive.
      </p>
    </>
  );

  if (!isAuthenticated) {
    const params = new URLSearchParams({ invite: token, email: invite.email });
    return (
      <Shell>
        {heading}
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to={`/register?${params.toString()}`}
            className="w-full rounded-lg bg-brand-gradient py-3 text-center font-semibold text-white shadow-brand-sm transition hover:shadow-brand"
          >
            Create an account
          </Link>
          <Link
            to={`/login?invite=${token}`}
            className="w-full rounded-lg border border-light-border py-3 text-center text-sm font-medium text-light-text transition hover:border-brand-500 dark:border-dark-border dark:text-dark-text"
          >
            I already have an account
          </Link>
        </div>
      </Shell>
    );
  }

  // Authenticated, but the invite was sent to a different address than the
  // one they're logged in as — never silently accept on their behalf.
  if (user?.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 text-semantic-warning-500 dark:text-semantic-warning-dark">
          <AlertCircle size={20} />
          <h1 className="font-display text-xl font-bold text-light-text dark:text-white">Wrong account</h1>
        </div>
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">
          This invite was sent to <strong>{invite.email}</strong>, but you're logged in as {user?.email}.
        </p>
        <Link to="/profile" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          Go to your account
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      {heading}
      {error && (
        <p className="mt-4 rounded-lg border border-semantic-danger-200 bg-semantic-danger-50 px-4 py-2 text-sm text-semantic-danger-500 dark:border-semantic-danger-500/30 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <button
          onClick={handleAccept}
          disabled={responding}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient py-3 font-semibold text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60"
        >
          <CheckCircle2 size={18} /> {responding ? 'Joining…' : 'Accept invite'}
        </button>
        <button
          onClick={handleDecline}
          disabled={responding}
          className="w-full rounded-lg border border-light-border py-3 text-sm font-medium text-light-muted transition hover:border-semantic-danger-300 hover:text-semantic-danger-500 dark:border-dark-border dark:text-dark-muted disabled:opacity-60"
        >
          Decline
        </button>
      </div>
    </Shell>
  );
};

export default Invite;
