import { useEffect, useMemo, useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export default function ImageUploader({
  label,
  onFileChange,
  initialImage = '',
  buttonText = 'Choose Image',
  resetToken,
}) {
  const [preview, setPreview] = useState(initialImage);
  const [error, setError] = useState('');

  useEffect(() => {
    setPreview(initialImage || '');
  }, [initialImage]);

  useEffect(() => {
    if (resetToken !== undefined) {
      setPreview(initialImage || '');
      setError('');
    }
  }, [resetToken, initialImage]);

  const previewUrl = useMemo(() => preview, [preview]);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      onFileChange(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload jpg, jpeg, png, or webp image');
      onFileChange(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be 5MB or smaller');
      onFileChange(null);
      return;
    }
    setError('');
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-sm hover:bg-white dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-900">
        <span>{buttonText}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleChange} />
      </label>
      {error && <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="h-44 w-full rounded-2xl border border-slate-200 object-cover dark:border-slate-700"
        />
      )}
    </div>
  );
}
