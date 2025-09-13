import React, { useState, useEffect, useRef } from 'react';
import type { Team, Player, PlayerProfile } from '../types';
import Modal from './Modal';
import { getPlayerProfiles } from '../utils/storage';
import { TeamIcon, UserCircleIcon } from './Icons';

interface TeamEditModalProps {
    team: Team | null;
    onSave: (team: Omit<Team, 'id' | 'battingStats' | 'bowlingStats'> & { id?: string, logo?: string, players: Team['players'] }) => void;
    onClose: () => void;
}

const TeamEditModal: React.FC<TeamEditModalProps> = ({ team, onSave, onClose }) => {
    const [teamName, setTeamName] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [logo, setLogo] = useState<string | undefined>(undefined);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [availableProfiles, setAvailableProfiles] = useState<PlayerProfile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const profiles = getPlayerProfiles();
        // Add photo to available profiles for player list items
        const profilesWithPhotos = profiles.map(p => ({
            ...p,
            photo: p.photo, 
        }));
        setAvailableProfiles(profilesWithPhotos);
        if (team) {
            setTeamName(team.name);
            setPlayers(team.players);
            setLogo(team.logo);
            setLogoPreview(team.logo || null);
        } else {
            setTeamName('');
            setPlayers([]);
            setLogo(undefined);
            setLogoPreview(null);
        }
    }, [team]);
    
    const handlePlayerToggle = (profile: PlayerProfile) => {
        const isSelected = players.some(p => p.id === profile.id);
        if (isSelected) {
            setPlayers(players.filter(p => p.id !== profile.id));
        } else {
            // Add player with their photo to the team
            setPlayers([...players, { id: profile.id, name: profile.name, role: profile.role, photo: profile.photo }]);
        }
    };
    
    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogo(base64String);
                setLogoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!teamName.trim()) {
            alert('Team name is required.');
            return;
        }
        onSave({
            id: team?.id,
            name: teamName.trim(),
            players: players,
            logo: logo
        });
    };

    const unselectedProfiles = availableProfiles.filter(p => !players.some(player => player.id === p.id));

    return (
        <Modal isVisible={true} onClose={onClose}>
            <div className="space-y-4 max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold text-cricket-green">{team ? 'Edit Team' : 'Register New Team'}</h3>
                
                <div className="flex items-center gap-4">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Team Logo" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                        <TeamIcon className="w-20 h-20 text-gray-500 bg-cricket-light-gray p-4 rounded-full" />
                    )}
                    <div>
                         <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-cricket-light-gray hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition"
                        >
                            Upload Logo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLogoChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
                    <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white"
                        required
                    />
                </div>
                
                <div className="flex-grow overflow-y-auto pt-2">
                     <h4 className="text-lg font-semibold mb-2">Select Players ({players.length} selected)</h4>
                     <p className="text-xs text-gray-400 mb-4">You can manage player profiles from the "Player Profiles" tab.</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <h5 className="font-bold mb-2">Selected Players</h5>
                             <div className="space-y-2 p-2 rounded-md bg-cricket-gray-dark h-64 overflow-y-auto">
                                {players.map(p => (
                                    <PlayerListItem key={p.id} profile={p} onToggle={handlePlayerToggle} isSelected={true} />
                                ))}
                                {players.length === 0 && <p className="text-gray-500 text-sm p-4 text-center">No players selected.</p>}
                             </div>
                        </div>
                         <div>
                             <h5 className="font-bold mb-2">Available Players</h5>
                             <div className="space-y-2 p-2 rounded-md bg-cricket-gray-dark h-64 overflow-y-auto">
                                {unselectedProfiles.map(p => (
                                    <PlayerListItem key={p.id} profile={p} onToggle={handlePlayerToggle} isSelected={false} />
                                ))}
                                {unselectedProfiles.length === 0 && <p className="text-gray-500 text-sm p-4 text-center">No more players available.</p>}
                             </div>
                        </div>
                     </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-cricket-light-gray">
                    <button onClick={onClose} className="font-semibold py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-500">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="font-bold py-2 px-4 rounded-lg bg-cricket-green hover:bg-green-600">
                        Save Team
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const PlayerListItem: React.FC<{profile: Player | PlayerProfile, onToggle: (profile: PlayerProfile) => void, isSelected: boolean}> = ({ profile, onToggle, isSelected}) => (
    <div 
        onClick={() => onToggle(profile as PlayerProfile)}
        className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-green-500/20' : 'hover:bg-cricket-light-gray'}`}
    >
        <div className="flex items-center gap-3">
             {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="w-8 h-8 rounded-full object-cover"/>
            ) : (
                <UserCircleIcon className="w-8 h-8 text-gray-500"/>
            )}
            <div>
                <p className="font-semibold text-sm">{profile.name}</p>
                <p className="text-xs text-gray-400">{profile.role}</p>
            </div>
        </div>
        <button className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-lg ${isSelected ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {isSelected ? '−' : '+'}
        </button>
    </div>
);


export default TeamEditModal;