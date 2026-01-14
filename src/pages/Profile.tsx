
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import Button from '../components/ui/Button';
import ErrorBoundary from '../components/ErrorBoundary';
import type { Profile as ProfileType } from '../types';

const COUNTRY_CODES = [
    // GCC
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+973', country: 'Bahrain' },
    { code: '+965', country: 'Kuwait' },
    { code: '+968', country: 'Oman' },
    { code: '+974', country: 'Qatar' },

    // Indian Subcontinent
    { code: '+91', country: 'India' },
    { code: '+92', country: 'Pakistan' },
    { code: '+880', country: 'Bangladesh' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+977', country: 'Nepal' },

    // Middle East / North Africa
    { code: '+20', country: 'Egypt' },
    { code: '+962', country: 'Jordan' },
    { code: '+961', country: 'Lebanon' },
    { code: '+964', country: 'Iraq' },
    { code: '+967', country: 'Yemen' },
    { code: '+90', country: 'Turkey' },

    // Western / Global
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+33', country: 'France' },
    { code: '+49', country: 'Germany' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
];

const Profile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile: currentProfile, user: currentUser, refreshProfile: refreshCurrentProfile } = useAuth();

    const [targetProfile, setTargetProfile] = useState<ProfileType | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Split phone state
    const [countryCode, setCountryCode] = useState('+1');
    const [localNumber, setLocalNumber] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
    });

    // 1. Fetch Target Profile Logic
    useEffect(() => {
        const fetchTargetProfile = async () => {
            setIsLoadingProfile(true);
            try {
                // Determine target ID
                const targetId = id || currentUser?.id;

                if (!targetId) {
                    setIsLoadingProfile(false);
                    return;
                }

                // Optimization: If viewing self, use AuthContext data
                if (targetId === currentUser?.id && currentProfile) {
                    setTargetProfile(currentProfile);
                    setIsLoadingProfile(false);
                    return;
                }

                // Else fetch from DB
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', targetId)
                    .single();

                if (error) throw error;
                setTargetProfile(data as ProfileType);

            } catch (err) {
                console.error('Error fetching profile:', err);
                setMessage({ type: 'error', text: 'Could not load profile.' });
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchTargetProfile();
    }, [id, currentUser, currentProfile]);

    // 2. Initialize Form Data when Target Profile Changes
    useEffect(() => {
        if (targetProfile) {
            setFormData({
                full_name: targetProfile.full_name || '',
            });

            // Parse existing phone number
            if (targetProfile.phone) {
                const foundCode = COUNTRY_CODES.find(c => targetProfile.phone?.startsWith(c.code));
                if (foundCode) {
                    setCountryCode(foundCode.code);
                    setLocalNumber(targetProfile.phone.slice(foundCode.code.length));
                } else {
                    setLocalNumber(targetProfile.phone);
                }
            } else {
                setLocalNumber('');
            }
        }
    }, [targetProfile]);

    // 3. Permission Check
    // Can edit if: Own Profile OR (Current User is Admin/Manager)
    const canEdit = React.useMemo(() => {
        if (!currentProfile || !targetProfile) return false;
        if (currentProfile.id === targetProfile.id) return true; // Own profile
        return ['Admin', 'Manager'].includes(currentProfile.role || '');
    }, [currentProfile, targetProfile]);


    const handleUpdate = async () => {
        if (!targetProfile) return;
        setIsSaving(true);
        setMessage(null);

        try {
            const fullPhone = localNumber ? `${countryCode}${localNumber} ` : null;

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: fullPhone,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', targetProfile.id);

            if (error) throw error;

            // If updating self, refresh global context
            if (targetProfile.id === currentUser?.id) {
                await refreshCurrentProfile();
            } else {
                // Manually update local state if looking at someone else
                setTargetProfile(prev => prev ? ({ ...prev, full_name: formData.full_name, phone: fullPhone }) : null);
            }

            setMessage({ type: 'success', text: 'Profile updated successfully.' });
            setIsEditing(false);
        } catch (err: unknown) {
            console.error('Error updating profile:', err);
            const errorMessage = (err as { message?: string })?.message || 'Failed to update profile.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!targetProfile) return;

        try {
            setMessage(null);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${targetProfile.id} -${Math.random()}.${fileExt} `;
            const filePath = `${fileName} `;

            setIsSaving(true);

            // 1. Upload
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get URL
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
                .eq('id', targetProfile.id);

            if (updateError) throw updateError;

            // Refetch
            if (targetProfile.id === currentUser?.id) {
                await refreshCurrentProfile();
            } else {
                setTargetProfile(prev => prev ? ({ ...prev, avatar_url: publicUrl }) : null);
            }

            setMessage({ type: 'success', text: 'Avatar updated successfully.' });

        } catch (error: unknown) {
            console.error('Error uploading avatar:', error);
            const errorMessage = (error as { message?: string })?.message || 'Error uploading avatar.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingProfile) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!targetProfile) {
        return <div className="text-center py-10">Profile not found.</div>;
    }

    return (
        <ErrorBoundary>
            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Back Button if viewing another profile */}
                {id && (
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                        ← Back
                    </button>
                )}

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Header / Avatar Section */}
                    <div className="bg-slate-50 px-6 py-8 border-b border-slate-200 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200">
                                    {targetProfile.avatar_url ? (
                                        <img src={targetProfile.avatar_url} alt={targetProfile.full_name || 'Avatar'} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-400">
                                            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        </div>
                                    )}

                                    {isEditing && (
                                        <>
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
                                                disabled={isSaving}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{targetProfile.full_name || 'User'}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium capitalize
                                        ${targetProfile.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'} `}>
                                        {targetProfile.role}
                                    </span>
                                    <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium capitalize
                                        ${targetProfile.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} `}>
                                        {targetProfile.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {canEdit && !isEditing && (
                            <Button onClick={() => setIsEditing(true)} variant="secondary">
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    {/* Form Section */}
                    <div className="px-6 py-8">
                        {message && (
                            <div className={`mb - 6 p - 4 rounded - md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'} `}>
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
                                        title="Email Address"
                                        type="text"
                                        disabled
                                        className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-slate-300 bg-slate-50 text-slate-500 cursor-not-allowed"
                                        // Note: Email is not on profiles table by default in our type, checking if it's there or we use targetProfile.id to lookup auth metadata but we can't always. 
                                        // For now, if viewing self use currentUser.email. If other, we might not have email in 'profiles' unless we added it or joined it.
                                        // The current type definition has optional email.
                                        value={targetProfile.email || (targetProfile.id === currentUser?.id ? currentUser?.email : 'Hidden')}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Email cannot be changed.</p>
                            </div>

                            {/* Full Name */}
                            <div className="sm:col-span-3">
                                <label htmlFor="full-name" className="block text-sm font-medium text-slate-700">Full Name</label>
                                <div className="mt-1">
                                    <input
                                        id="full-name"
                                        title="Full Name"
                                        placeholder="Full Name"
                                        type="text"
                                        disabled={!isEditing}
                                        className={`block w-full sm:text-sm rounded-md transition-all duration-200
                                            ${isEditing
                                                ? 'shadow-sm border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                                                : 'border-transparent shadow-none bg-transparent text-slate-900 font-medium px-0'}`}
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Phone Input with Country Code */}
                            <div className="sm:col-span-4">
                                <label htmlFor="phone-number" className="block text-sm font-medium text-slate-700">Phone Number</label>
                                <div className={`mt-1 flex rounded-md transition-all duration-200 ${isEditing ? 'shadow-sm' : ''}`}>
                                    <div className="relative">
                                        <select
                                            aria-label="Country Code"
                                            disabled={!isEditing}
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className={`h-full rounded-l-md border-r-0 py-0 pl-3 pr-7 sm:text-sm transition-all duration-200
                                                ${isEditing
                                                    ? 'border-slate-300 bg-slate-50 text-slate-500 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer'
                                                    : 'border-transparent bg-transparent text-slate-900 font-medium px-0 appearance-none cursor-default'}`}
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
                                        className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md sm:text-sm transition-all duration-200
                                            ${isEditing
                                                ? 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                                                : 'border-transparent bg-transparent text-slate-900 font-medium px-2 shadow-none'}`}
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
                                        <p className="mt-1 text-sm text-slate-900 font-mono bg-slate-50 p-2 rounded border border-slate-100">{targetProfile.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</label>
                                        <p className="mt-1 text-sm text-slate-900">{targetProfile.updated_at ? new Date(targetProfile.updated_at).toLocaleDateString() : 'Never'}</p>
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
                                        if (targetProfile) {
                                            setFormData({ full_name: targetProfile.full_name || '' });
                                            // Reset phone state
                                            if (targetProfile.phone) {
                                                const foundCode = COUNTRY_CODES.find(c => targetProfile.phone?.startsWith(c.code));
                                                if (foundCode) {
                                                    setCountryCode(foundCode.code);
                                                    setLocalNumber(targetProfile.phone.slice(foundCode.code.length));
                                                } else {
                                                    setLocalNumber(targetProfile.phone);
                                                }
                                            } else {
                                                setLocalNumber('');
                                            }
                                        }
                                    }}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleUpdate}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
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
