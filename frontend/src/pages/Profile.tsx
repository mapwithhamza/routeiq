/**
 * src/pages/Profile.tsx — User profile page
 * Display name, change password, account info, danger zone.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, Shield, Key, Trash2, Save, Eye, EyeOff, LogOut } from 'lucide-react';
import { profileApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AUTH_KEY } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

export default function Profile() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isGoogleUser = !!user?.picture_url && !user?.display_name;
  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'RQ';

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSavingName(true);
    try {
      const updated = await profileApi.update({ display_name: displayName.trim() });
      queryClient.setQueryData(AUTH_KEY, updated);
      toast.success('Display name updated');
    } catch {
      toast.error('Failed to update display name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setIsChangingPw(true);
    try {
      await profileApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await profileApi.deleteAccount();
      toast.success('Account deleted');
      logout();
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!user) return <div className="flex h-full items-center justify-center"><Spinner className="h-10 w-10 text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-1">Account</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E6EDF3] tracking-tight">Profile</h1>
        <p className="mt-1 text-gray-500 dark:text-[#8B949E] text-sm">Manage your account settings.</p>
      </div>

      {/* Avatar + Account Info */}
      <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-6">
        <div className="flex items-center gap-5 mb-6">
          {user.picture_url ? (
            <img src={user.picture_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-cyan-500/30" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white ring-2 ring-cyan-500/30">
              {initials}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {user.display_name || user.email}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                <Shield size={10} />
                {user.role}
              </span>
              {user.picture_url && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Google Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700/50">
          {[
            { label: 'Email', value: user.email },
            { label: 'Role', value: user.role },
            { label: 'Account Status', value: user.is_active ? 'Active' : 'Inactive' },
            { label: 'Member Since', value: new Date(user.created_at).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200 capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Display Name */}
      <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Display Name</h2>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. Hamza Khan"
            className="flex-1 rounded-lg bg-white dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700/60 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/50 transition text-sm"
          />
          <Button onClick={handleSaveName} isLoading={isSavingName} disabled={!displayName.trim()}>
            <Save size={14} className="mr-1.5" />
            Save
          </Button>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">This name appears in the sidebar and dashboard.</p>
      </div>

      {/* Change Password */}
      {!isGoogleUser && (
        <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-amber-500 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Change Password</h2>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full rounded-lg bg-white dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700/60 px-3 py-2 pr-10 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/50 transition text-sm"
              />
              <button onClick={() => setShowCurrentPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                className="w-full rounded-lg bg-white dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700/60 px-3 py-2 pr-10 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/50 transition text-sm"
              />
              <button onClick={() => setShowNewPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg bg-white dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700/60 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/50 transition text-sm"
            />
            <Button onClick={handleChangePassword} isLoading={isChangingPw} variant="secondary">
              <Key size={14} className="mr-1.5" />
              Change Password
            </Button>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-6">
        <div className="flex items-center gap-2 mb-4">
          <LogOut size={16} className="text-gray-500 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Sign Out</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Sign out of your account on this device.</p>
        <Button variant="secondary" onClick={() => logout()}>
          <LogOut size={14} className="mr-1.5" />
          Sign Out
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-white dark:bg-[#1C2128] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 size={16} className="text-red-500" />
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
          Permanently delete your account. This cannot be undone. Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="flex-1 rounded-lg bg-white dark:bg-slate-900/60 border border-red-300 dark:border-red-500/30 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-red-500/50 transition text-sm"
          />
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            isLoading={isDeletingAccount}
            disabled={deleteConfirm !== 'DELETE'}
          >
            <Trash2 size={14} className="mr-1.5" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
