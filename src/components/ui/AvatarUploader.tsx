import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/imageUtils';
import Button from './Button';
import { supabase } from '../../services/supabase';

interface AvatarUploaderProps {
    currentAvatarUrl?: string;
    userId: string;
    onUploadComplete: (newUrl: string) => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ currentAvatarUrl, userId, onUploadComplete }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setIsEditing(true);
        }
    };

    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string), false);
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setLoading(true);

        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            // Upload to Supabase
            const filename = `${userId}-${Date.now()}.jpg`;
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(filename, croppedImageBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filename);

            // Update Profile
            await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            onUploadComplete(publicUrl);
            setIsEditing(false);
            setImageSrc(null);
        } catch (e) {
            console.error(e);
            alert('Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    if (isEditing && imageSrc) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                <div className="bg-slate-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl">
                    <div className="relative h-64 w-full bg-black">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="round"
                            showGrid={false}
                        />
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Zoom</label>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => { setIsEditing(false); setImageSrc(null); }}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Set Profile Picture'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-blue-500 transition-colors bg-slate-800">
                    {currentAvatarUrl ? (
                        <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}

                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-xs font-medium">Change</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={onFileChange}
                        />
                    </label>
                </div>
            </div>
            {/* <p className="text-xs text-slate-500">Click to upload</p> */}
        </div>
    );
};

export default AvatarUploader;
