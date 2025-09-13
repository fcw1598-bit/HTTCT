import React, { useState, useEffect } from 'react';
import type { Team } from '../types';
import { getRegisteredTeams, saveRegisteredTeams } from '../utils/storage';
import TeamEditModal from './TeamEditModal';
import { TeamIcon } from './Icons';

const TeamRegistrationDashboard: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setTeams(getRegisteredTeams());
    }, []);

    const handleEdit = (team: Team) => {
        setSelectedTeam(team);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedTeam(null);
        setIsModalOpen(true);
    };

    const handleSave = (teamToSave: Omit<Team, 'id' | 'battingStats' | 'bowlingStats'> & { id?: string, logo?: string, players: Team['players'] }) => {
        let updatedTeams;
        if (teamToSave.id) { // Editing existing
            updatedTeams = teams.map(t => t.id === teamToSave.id ? { ...t, name: teamToSave.name, logo: teamToSave.logo, players: teamToSave.players } : t);
        } else { // Adding new
            const newTeam: Team = { 
                name: teamToSave.name,
                logo: teamToSave.logo,
                players: teamToSave.players,
                id: `team_${Date.now()}`,
                battingStats: {},
                bowlingStats: {}
            };
            updatedTeams = [...teams, newTeam];
        }
        setTeams(updatedTeams);
        saveRegisteredTeams(updatedTeams);
        setIsModalOpen(false);
    };

    const handleDelete = (teamId: string) => {
        if (window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
            const updatedTeams = teams.filter(t => t.id !== teamId);
            setTeams(updatedTeams);
            saveRegisteredTeams(updatedTeams);
        }
    };

    return (
        <div className="bg-cricket-gray p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-cricket-green">Manage Teams</h2>
                <button
                    onClick={handleAddNew}
                    className="bg-cricket-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition"
                >
                    Register New Team
                </button>
            </div>
            <div className="space-y-4">
                {teams.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No teams registered yet. Click "Register New Team" to get started.</p>
                ) : (
                    teams.map((team, index) => (
                        <div key={team.id} className="bg-cricket-light-gray p-4 rounded-lg flex justify-between items-center flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="flex items-center gap-4">
                                {team.logo ? (
                                    <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-full object-cover"/>
                                ) : (
                                    <TeamIcon className="w-12 h-12 text-gray-500"/>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold">{team.name}</h3>
                                    <p className="text-sm text-gray-400">{team.players.length} player{team.players.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="space-x-4">
                                <button onClick={() => handleEdit(team)} className="text-blue-400 hover:text-blue-300 transition font-semibold">Edit</button>
                                <button onClick={() => handleDelete(team.id)} className="text-red-400 hover:text-red-300 transition font-semibold">Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {isModalOpen && (
                <TeamEditModal
                    team={selectedTeam}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default TeamRegistrationDashboard;