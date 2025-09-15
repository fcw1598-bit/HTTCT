import React, { useState, useEffect } from 'react';
import type { PlayerProfile } from '../types';
import { getPlayerProfiles, savePlayerProfiles } from '../utils/storage';
import ProfileEditModal from './ProfileEditModal';
import { UserCircleIcon, UsersIcon, UserAddIcon } from './Icons';

const PlayerProfilesDashboard: React.FC = () => {
    const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<PlayerProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setProfiles(getPlayerProfiles());
    }, []);

    const handleEdit = (profile: PlayerProfile) => {
        setSelectedProfile(profile);
        setIsModalOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedProfile(null);
        setIsModalOpen(true);
    }

    const handleSave = (profileToSave: Omit<PlayerProfile, 'id'> & { id?: string }) => {
        let updatedProfiles;
        if (profileToSave.id) { // Editing existing
            updatedProfiles = profiles.map(p => p.id === profileToSave.id ? { ...p, ...profileToSave } : p);
        } else { // Adding new
            const newProfile = { ...profileToSave, id: `profile_${Date.now()}` };
            updatedProfiles = [...profiles, newProfile];
        }
        setProfiles(updatedProfiles);
        savePlayerProfiles(updatedProfiles);
        setIsModalOpen(false);
    };

    const handleDelete = (profileId: string) => {
        if (window.confirm("Are you sure you want to delete this player profile?")) {
            const updatedProfiles = profiles.filter(p => p.id !== profileId);
            setProfiles(updatedProfiles);
            savePlayerProfiles(updatedProfiles);
        }
    };

    return (
        <div className="bg-cricket-gray p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-cricket-green flex items-center gap-3">
                    <UsersIcon className="w-8 h-8" />
                    Player Profiles
                </h2>
                <button
                    onClick={handleAddNew}
                    className="bg-cricket-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                >
                    <UserAddIcon className="w-5 h-5"/>
                    Add New Player
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cricket-light-gray">
                    <thead className="bg-cricket-light-gray/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player Info</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cricket-light-gray">
                        {profiles.map((profile, index) => (
                            <tr key={profile.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                                <td className="px-4 py-4 whitespace-normal text-sm font-medium">
                                    <div className="flex items-center gap-4">
                                        {profile.photo ? (
                                            <img src={profile.photo} alt={profile.name} className="w-12 h-12 rounded-full object-cover"/>
                                        ) : (
                                            <UserCircleIcon className="w-12 h-12 text-gray-500"/>
                                        )}
                                        <div>
                                            <p className="font-bold">{profile.name}</p>
                                            {profile.bio && <p className="text-xs text-gray-400 mt-1 max-w-xs">{profile.bio}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{profile.role}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right space-x-4">
                                    <button
                                        onClick={() => handleEdit(profile)}
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Edit
                                    </button>
                                     <button
                                        onClick={() => handleDelete(profile.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <ProfileEditModal
                    profile={selectedProfile}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default PlayerProfilesDashboard;