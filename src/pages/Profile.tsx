import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import Button from '../components/ui/Button';
import ErrorBoundary from '../components/ErrorBoundary';

const COUNTRY_CODES = [
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'IN' },
    { code: '+92', country: 'PK' },
    { code: '+971', country: 'AE' },
    { code: '+61', country: 'AU' },
    { code: '+86', country: 'CN' },
    { code: '+33', country: 'FR' },
    { code: '+49', country: 'DE' },
    { code: '+81', country: 'JP' },
    { code: '+966', country: 'SA' },
];

const Profile: React.FC = () => {
    const { profile, user, refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Split phone state
    const [countryCode, setCountryCode] = useState('+1');
    const [localNumber, setLocalNumber] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
            });

            // Parse existing phone number
            if (profile.phone) {
                // Simple heuristic: check if it starts with a known code
                const foundCode = COUNTRY_CODES.find(c => profile.phone?.startsWith(c.code));
                if (foundCode) {
                    setCountryCode(foundCode.code);
                    setLocalNumber(profile.phone.slice(foundCode.code.length));
                } else {
                    // Fallback or legacy format
                    setLocalNumber(profile.phone);
                }
            } else {
                setLocalNumber('');
            }
        }
    }, [profile]);

    const handleUpdate = async () => {
        if (!user) return;
        setLoading(true);
        setMessage(null);

        try {
            // Combine phone
            const fullPhone = localNumber ? `${countryCode}${localNumber}` : null;

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: fullPhone,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully.' });
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setMessage(null);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            setLoading(true);

            // 1. Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const publicUrl = data.publicUrl;

            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user?.id);

            if (updateError) throw updateError;

            await refreshProfile();
            setMessage({ type: 'success', text: 'Avatar updated successfully.' });

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            setMessage({ type: 'error', text: error.message || 'Error uploading avatar.' });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return <div>Loading profile...</div>;

    return (
        <ErrorBoundary>
            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Header / Avatar Section */}
                    <div className="bg-slate-50 px-6 py-8 border-b border-slate-200 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-400">
                                            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        </div>
                                    )}
                                    {/* Upload Overlay */}
                                    <label
                                        htmlFor="avatar-upload"
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                                    >
                                        <span className="text-white text-xs font-medium">Change</span>
                                    </label>
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{profile.full_name || 'User'}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${profile.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {profile.role}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${profile.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {profile.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!isEditing && (
                            <Button onClick={() => setIsEditing(true)} variant="secondary">
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    {/* Form Section */}
                    <div className="px-6 py-8">
                        {message && (
                            <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* Email - Read Only */}
                            <div className="sm:col-span-4">
                                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </span>
                                    <input
                                        type="text"
                                        disabled
                                        className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-slate-300 bg-slate-50 text-slate-500 cursor-not-allowed"
                                        value={user?.email || ''}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Email cannot be changed.</p>
                            </div>

                            {/* Full Name */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md 
                                            ${!isEditing ? 'bg-slate-50 text-slate-500' : ''}`}
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Phone Input with Country Code */}
                            <div className="sm:col-span-4">
                                <label htmlFor="phone-number" className="block text-sm font-medium text-slate-700">Phone Number</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <div className="relative">
                                        <select
                                            aria-label="Country Code"
                                            disabled={!isEditing}
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className={`h-full rounded-l-md border-r-0 border-slate-300 bg-slate-50 py-0 pl-3 pr-7 text-slate-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm 
                                                ${!isEditing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            {COUNTRY_CODES.map((country) => (
                                                <option key={country.code} value={country.code}>
                                                    {country.code} ({country.country})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <input
                                        type="tel"
                                        id="phone-number"
                                        disabled={!isEditing}
                                        className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-slate-300
                                            ${!isEditing ? 'bg-slate-50 text-slate-500' : ''}`}
                                        placeholder="555 123 4567"
                                        value={localNumber}
                                        onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ''))} // Only numbers
                                    />
                                </div>
                                {isEditing && <p className="mt-1 text-xs text-slate-500">Select country code and enter mobile number.</p>}
                            </div>

                            {/* System Meta - Read Only */}
                            <div className="sm:col-span-6 border-t border-slate-200 mobile-mt-4 pt-6 mt-4">
                                <h3 className="text-sm font-medium text-slate-900 mb-4">System Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">User ID</label>
                                        <p className="mt-1 text-sm text-slate-900 font-mono bg-slate-50 p-2 rounded border border-slate-100">{profile.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Account Created</label>
                                        <p className="mt-1 text-sm text-slate-900">{new Date(user?.created_at || '').toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {isEditing && (
                            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset form
                                        if (profile) {
                                            setFormData({ full_name: profile.full_name || '' });
                                            // Reset phone state
                                            if (profile.phone) {
                                                const foundCode = COUNTRY_CODES.find(c => profile.phone?.startsWith(c.code));
                                                if (foundCode) {
                                                    setCountryCode(foundCode.code);
                                                    setLocalNumber(profile.phone.slice(foundCode.code.length));
                                                } else {
                                                    setLocalNumber(profile.phone);
                                                }
                                            } else {
                                                setLocalNumber('');
                                            }
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleUpdate}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Profile;
