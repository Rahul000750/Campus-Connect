import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { getFriendlyApiError, normalizeMediaUrl } from '../api';
import PostCard from '../components/PostCard';
import ImageUploader from '../components/ImageUploader';
import PageTransition from '../components/ui/PageTransition';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [activeTab, setActiveTab] = useState('Posts');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', profilePic: '' });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const { addToast } = useToast();

  async function load() {
    setErr('');
    setLoading(true);
    try {
      const [meRes, postsRes] = await Promise.all([api.get('/users/me'), api.get('/posts')]);
      setMe(meRes.data);
      const targetUser = id ? (await api.get(`/users/${id}`)).data : meRes.data;
      setProfileUser(targetUser);
      setForm({
        name: targetUser.name || '',
        bio: targetUser.bio || '',
        profilePic: targetUser.profilePic || targetUser.avatarUrl || '',
      });
      const mine = postsRes.data.filter((p) => String(p.author?._id || p.author) === String(targetUser.id));
      setPosts(mine || []);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const isOwnProfile = !id || String(id) === String(me?.id);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      let profilePic = form.profilePic;
      if (profileImageFile) {
        const uploadData = new FormData();
        uploadData.append('image', profileImageFile);
        const uploadRes = await api.post('/upload/profile', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        profilePic = normalizeMediaUrl(uploadRes.data.imageUrl);
        await api.put('/users/profile-photo', { imageUrl: profilePic });
      }

      const { data } = await api.put('/users/profile', { ...form, profilePic });
      setProfileUser(data.user);
      setForm((f) => ({ ...f, profilePic: data.user.profilePic || data.user.avatarUrl || '' }));
      setProfileImageFile(null);
      setEditing(false);

      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...data.user }));
      window.dispatchEvent(new Event('user-updated'));

      addToast('Profile updated', 'success');
      await load();
    } catch (error) {
      addToast(getFriendlyApiError(error, 'Could not update profile'), 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function toggleFollow() {
    try {
      await api.post(`/users/follow/${profileUser.id}`);
      addToast('Connection updated', 'success');
      await load();
    } catch (error) {
      addToast(error.response?.data?.message || 'Could not follow user', 'error');
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-5xl space-y-4">
        {loading && (
          <>
            <Skeleton className="h-48" />
            <Skeleton className="h-60" />
          </>
        )}

        {err && (
          <div className="rounded-2xl border border-rose-300/50 bg-rose-100/60 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            {err}
          </div>
        )}

        {profileUser && (
          <section className="glass-card p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 p-[3px]">
                  {(profileUser.profilePic || profileUser.avatarUrl) ? (
                    <img src={profileUser.profilePic || profileUser.avatarUrl} alt="avatar" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-2xl font-semibold dark:bg-slate-900">
                      {profileUser.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{profileUser.name}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{profileUser.email}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{profileUser.bio || 'No bio yet.'}</p>
                </div>
              </div>

              {isOwnProfile ? (
                <button type="button" className="primary-btn" onClick={() => setEditing((v) => !v)}>
                  {editing ? 'Close Editor' : 'Edit Profile'}
                </button>
              ) : (
                <button type="button" className="primary-btn" onClick={toggleFollow}>
                  Follow / Unfollow
                </button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-slate-800/70">
                <p className="text-xl font-semibold">{posts.length}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Posts</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-slate-800/70">
                <p className="text-xl font-semibold">{profileUser.followersCount || 0}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Followers</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-slate-800/70">
                <p className="text-xl font-semibold">{profileUser.followingCount || 0}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Following</p>
              </div>
            </div>

            {isOwnProfile && editing && (
              <form className="mt-5 space-y-3" onSubmit={saveProfile}>
                <input className="input-modern" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <ImageUploader
                  label="Profile photo"
                  initialImage={form.profilePic}
                  buttonText="Upload profile photo"
                  onFileChange={setProfileImageFile}
                />
                <textarea className="input-modern min-h-20 resize-none" placeholder="Bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
                <button type="submit" className="primary-btn" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            )}
          </section>
        )}

        <section className="glass-card p-4">
          <div className="mb-4 flex gap-2">
            {['Posts', 'Media', 'Activity'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`rounded-xl px-4 py-2 text-sm ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white/70 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Posts' && (
            <div className="space-y-3">
              {posts.length === 0 && !loading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">You have not posted yet.</p>
              ) : (
                posts.map((p) => <PostCard key={p._id} post={p} onUpdate={load} />)
              )}
            </div>
          )}

          {activeTab !== 'Posts' && <p className="text-sm text-slate-500 dark:text-slate-400">No {activeTab.toLowerCase()} items yet.</p>}
        </section>
      </div>
    </PageTransition>
  );
}
