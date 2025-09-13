import React, { useState, useEffect, useRef } from 'react';
import type { PlayerProfile } from '../types';
import Modal from './Modal';
import { UserCircleIcon } from './Icons';

interface ProfileEditModalProps {
    profile: PlayerProfile | null;
    onSave: (profile: Omit<PlayerProfile, 'id'> & { id?: string }) => void;
    onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ profile, onSave, onClose }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState<'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'>('Batsman');
    const [bio, setBio] = useState('');
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setRole(profile.role);
            setBio(profile.bio || '');
            setPhoto(profile.photo);
            setPhotoPreview(profile.photo || null);
        } else {
            setName('');
            setRole('Batsman');
            setBio('');
            setPhoto(undefined);
            setPhotoPreview(null);
        }
    }, [profile]);

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPhoto(base64String);
                setPhotoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!name) return; // Basic validation
        onSave({
            id: profile?.id,
            name,
            role,
            bio,
            photo,
        });
    };

    return (
        <Modal isVisible={true} onClose={onClose}>
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-cricket-green">{profile ? 'Edit Player Profile' : 'Add New Player Profile'}</h3>
                
                <div className="flex items-center gap-4">
                    {photoPreview ? (
                        <img src={photoPreview} alt="Player" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-20 h-20 text-gray-500" />
                    )}
                    <div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-cricket-light-gray hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition"
                        >
                            Upload Photo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                        />
                        <p className="text-xs text-gray-400 mt-2">Recommended: Square image (e.g., 200x200px)</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Player Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Primary Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white"
                    >
                        <option value="Batsman">Batsman</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-Rounder">All-Rounder</option>
                        <option value="Wicket-Keeper">Wicket-Keeper</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Bio (Optional)</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        placeholder="e.g., Right-hand batsman, occasional spinner"
                        className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white"
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="font-semibold py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-500">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="font-bold py-2 px-4 rounded-lg bg-cricket-green hover:bg-green-600">
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ProfileEditModal;