

import React, { useState, useEffect, useRef } from 'react';
import type { Team, Player, PlayerProfile, PlayerRole } from '../types';
import Modal from './Modal';
import { getPlayerProfiles } from '../utils/storage';
import { TeamIcon, UserCircleIcon, UserAddIcon } from './Icons';

interface TeamEditModalProps {
    team: Team | null;
    onSave: (team: Omit<Team, 'id' | 'battingStats' | 'bowlingStats'> & { id?: string, logo?: string, players: Team['players'] }) => void;
    onClose: () => void;
}

const PLAYER_ROLES: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

const TeamEditModal: React.FC<TeamEditModalProps> = ({ team, onSave, onClose }) => {
    const [teamName, setTeamName] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [logo, setLogo] = useState<string | undefined>(undefined);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [availableProfiles, setAvailableProfiles] = useState<PlayerProfile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for custom player input
    const [customPlayerName, setCustomPlayerName] = useState('');
    const [customPlayerRole, setCustomPlayerRole] = useState<PlayerRole>('Batsman');

    useEffect(() => {
        const profiles = getPlayerProfiles();
        setAvailableProfiles(profiles);
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
    
    const handleAddProfilePlayer = (profile: PlayerProfile) => {
        const isSelected = players.some(p => p.id === profile.id);
        if (isSelected) return; // Already selected

        if (players.length < 15) {
            setPlayers([...players, { id: profile.id, name: profile.name, role: profile.role, photo: profile.photo }]);
        } else {
            alert("A team can have a maximum of 15 players.");
        }
    };

    const handleAddCustomPlayer = () => {
        if (!customPlayerName.trim()) {
            alert('Custom player name cannot be empty.');
            return;
        }
        if (players.length >= 15) {
            alert('A team can have a maximum of 15 players.');
            return;
        }
        const newPlayer: Player = {
            id: `custom_${customPlayerName.trim().replace(/\s+/g, '_')}_${Date.now()}`,
            name: customPlayerName.trim(),
            role: customPlayerRole,
        };
        setPlayers([...players, newPlayer]);
        setCustomPlayerName('');
        setCustomPlayerRole('Batsman');
    };
    
    const handleRemovePlayer = (playerId: string) => {
        setPlayers(players.filter(p => p.id !== playerId));
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
        if (players.length < 6) {
            alert('A team must have at least 6 players.');
            return;
        }
        if (players.length > 15) {
            alert('A team cannot have more than 15 players.');
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
    const isPlayerCountValid = players.length >= 6 && players.length <= 15;

    return (
        <Modal isVisible={true} onClose={onClose}>
            <div className="space-y-4 max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold text-cricket-green flex items-center gap-2">
                    <TeamIcon className="w-6 h-6" />
                    {team ? 'Edit Team' : 'Register New Team'}
                </h3>
                
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
                
                {/* Custom Player Form */}
                <div className="bg-cricket-dark p-3 rounded-lg">
                    <h4 className="text-md font-semibold mb-2 flex items-center gap-2 text-gray-300">
                        <UserAddIcon className="w-5 h-5"/>
                        Add Custom Player
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                         <input
                            type="text"
                            placeholder="Player Name"
                            value={customPlayerName}
                            onChange={(e) => setCustomPlayerName(e.target.value)}
                            className="sm:col-span-2 w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white"
                        />
                         <select
                            value={customPlayerRole}
                            onChange={(e) => setCustomPlayerRole(e.target.value as PlayerRole)}
                            className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white"
                        >
                            {PLAYER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <button onClick={handleAddCustomPlayer} className="sm:col-span-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-md transition">
                            Add Player to Team
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pt-2">
                     <h4 className="text-lg font-semibold mb-2">Build Your Team ({players.length} / 15)</h4>
                     {!isPlayerCountValid && <p className="text-xs text-yellow-400 mb-4">A team must have between 6 and 15 players.</p>}
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <h5 className="font-bold mb-2">Selected Players</h5>
                             <div className="space-y-2 p-2 rounded-md bg-cricket-dark h-64 overflow-y-auto">
                                {players.map(p => (
                                    <SelectedPlayerItem key={p.id} player={p} onRemove={handleRemovePlayer} />
                                ))}
                                {players.length === 0 && <p className="text-gray-500 text-sm p-4 text-center">No players selected.</p>}
                             </div>
                        </div>
                         <div>
                             <h5 className="font-bold mb-2">Available Profiles</h5>
                             <div className="space-y-2 p-2 rounded-md bg-cricket-dark h-64 overflow-y-auto">
                                {unselectedProfiles.map(p => (
                                    <PlayerListItem key={p.id} profile={p} onAdd={handleAddProfilePlayer} />
                                ))}
                                {availableProfiles.length === 0 && <p className="text-gray-500 text-sm p-4 text-center">No player profiles found. Go to "Player Profiles" to create some.</p>}
                                {unselectedProfiles.length === 0 && availableProfiles.length > 0 && <p className="text-gray-500 text-sm p-4 text-center">All available players selected.</p>}
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

const SelectedPlayerItem: React.FC<{player: Player, onRemove: (playerId: string) => void}> = ({ player, onRemove }) => (
    <div className="flex justify-between items-center p-2 rounded-md bg-cricket-light-gray/50">
        <div className="flex items-center gap-3">
             {player.photo ? (
                <img src={player.photo} alt={player.name} className="w-8 h-8 rounded-full object-cover"/>
            ) : (
                <UserCircleIcon className="w-8 h-8 text-gray-500"/>
            )}
            <div>
                <p className="font-semibold text-sm">{player.name}</p>
                <p className="text-xs text-gray-400">{player.role}</p>
            </div>
        </div>
        <button 
            onClick={() => onRemove(player.id)}
            aria-label={`Remove ${player.name}`}
            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
        >
            −
        </button>
    </div>
);


const PlayerListItem: React.FC<{profile: PlayerProfile, onAdd: (profile: PlayerProfile) => void}> = ({ profile, onAdd}) => (
    <div className="flex justify-between items-center p-2 rounded-md transition-colors hover:bg-cricket-light-gray">
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
        <button
            onClick={() => onAdd(profile)}
            aria-label={`Add ${profile.name}`}
            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
        >
            +
        </button>
    </div>
);


export default TeamEditModal;