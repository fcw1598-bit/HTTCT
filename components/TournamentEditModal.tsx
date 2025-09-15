

import React, { useState } from 'react';
import type { Tournament, Team, Player, TournamentFormat, TournamentType } from '../types';
import Modal from './Modal';
import { TeamIcon, TrophyIcon } from './Icons';

interface TournamentEditModalProps {
    tournament?: Tournament | null;
    onSave: (tournament: Omit<Tournament, 'id' | 'status' | 'rounds' | 'currentRound' | 'standings'> & { id?: string }) => void;
    onClose: () => void;
    allTeams: Team[];
}

const TournamentEditModal: React.FC<TournamentEditModalProps> = ({ tournament, onSave, onClose, allTeams }) => {
    const [name, setName] = useState(tournament?.name || '');
    const [format, setFormat] = useState<TournamentFormat>(tournament?.format || 'T20');
    const [type, setType] = useState<TournamentType>(tournament?.type || 'Round Robin');
    const [selectedTeams, setSelectedTeams] = useState<{ id: string, name: string }[]>(tournament?.teams || []);
    
    const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

    const handleTeamToggle = (team: Team) => {
        const isSelected = selectedTeams.some(t => t.id === team.id);
        if (isSelected) {
            setSelectedTeams(selectedTeams.filter(t => t.id !== team.id));
        } else {
            setSelectedTeams([...selectedTeams, { id: team.id, name: team.name }]);
        }
    };

    const handleSave = () => {
        if (!name.trim()) return alert("Tournament name is required.");
        if (selectedTeams.length < 2) return alert("Select at least 2 teams.");
        if (type === 'Knockout' && !isPowerOfTwo(selectedTeams.length)) {
            return alert(`For Knockout tournaments, please select a power of 2 teams (e.g., 2, 4, 8, 16). You have selected ${selectedTeams.length}.`);
        }
        onSave({
            id: tournament?.id,
            name,
            format,
            type,
            teams: selectedTeams,
        });
    };

    const unselectedTeams = allTeams.filter(t => !selectedTeams.some(st => st.id === t.id));

    return (
        <Modal isVisible={true} onClose={onClose}>
            <div className="space-y-4 max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold text-cricket-green flex items-center gap-2">
                    <TrophyIcon className="w-6 h-6"/>
                    {tournament ? 'Edit Tournament' : 'Create New Tournament'}
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tournament Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                        <select value={type} onChange={e => setType(e.target.value as TournamentType)} className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white">
                            <option value="Round Robin">Round Robin (League)</option>
                            <option value="Knockout">Knockout</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Format</label>
                        <select value={format} onChange={e => setFormat(e.target.value as TournamentFormat)} className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white">
                            <option value="T10">T10 (10 Overs)</option>
                            <option value="T20">T20 (20 Overs)</option>
                            <option value="ODI">ODI (50 Overs)</option>
                            <option value="Test">Test Match</option>
                            <option value="League">League (Custom)</option>
                        </select>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pt-2">
                    <h4 className="text-lg font-semibold mb-2">Select Teams ({selectedTeams.length} selected)</h4>
                     {type === 'Knockout' && <p className="text-xs text-yellow-400 mb-2">Please select a power of 2 teams (2, 4, 8, etc.) for knockout.</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h5 className="font-bold mb-2">Selected</h5>
                            <div className="space-y-2 p-2 rounded-md bg-cricket-dark h-48 overflow-y-auto">
                                {selectedTeams.map(t => <TeamListItem key={t.id} team={allTeams.find(at => at.id === t.id)!} onToggle={handleTeamToggle} isSelected />)}
                            </div>
                        </div>
                        <div>
                            <h5 className="font-bold mb-2">Available</h5>
                            <div className="space-y-2 p-2 rounded-md bg-cricket-dark h-48 overflow-y-auto">
                                {unselectedTeams.map(t => <TeamListItem key={t.id} team={t} onToggle={handleTeamToggle} isSelected={false} />)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-cricket-light-gray">
                    <button onClick={onClose} className="font-semibold py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="font-bold py-2 px-4 rounded-lg bg-cricket-green hover:bg-green-600">Save Tournament</button>
                </div>
            </div>
        </Modal>
    );
};

const TeamListItem: React.FC<{ team: Team, onToggle: (team: Team) => void, isSelected: boolean }> = ({ team, onToggle, isSelected }) => (
    <div onClick={() => onToggle(team)} className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-green-500/20' : 'hover:bg-cricket-light-gray'}`}>
        <div className="flex items-center gap-3">
            {team.logo ? <img src={team.logo} alt={team.name} className="w-8 h-8 rounded-full object-cover" /> : <TeamIcon className="w-8 h-8 text-gray-500" />}
            <p className="font-semibold text-sm">{team.name}</p>
        </div>
        <button className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-lg ${isSelected ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {isSelected ? '−' : '+'}
        </button>
    </div>
);

export default TournamentEditModal;