import React, { useState, useEffect } from 'react';
import type { Match, Team, PlayerRole, Player } from '../types';
import { MatchStatus } from '../types';
import { getRegisteredTeams } from '../utils/storage';
// FIX: Import 'PlayIcon' from './Icons' to resolve the 'Cannot find name' error.
import { TeamIcon, ClipboardListIcon, BallIcon, UserAddIcon, PlayIcon } from './Icons';
import { CustomSelect, type CustomSelectOption } from './Modal';

interface Matchup {
  teamAId: string;
  teamBId: string;
  overs: number;
  tournamentId: string;
  matchId: string;
}

interface MatchSetupProps {
  onMatchSetupComplete: (match: Match) => void;
  prefilledMatchup?: Matchup | null;
}

const PLAYER_ROLES: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
interface CustomPlayer { name: string; role: PlayerRole; }
const createDefaultPlayer = (): CustomPlayer => ({ name: '', role: 'Batsman' });
const createInitialCustomTeam = () => ({ name: '', players: Array(6).fill(null).map(createDefaultPlayer) });

// Sub-component for custom team input form
const CustomTeamForm: React.FC<{
  teamData: { name: string; players: CustomPlayer[] };
  onTeamNameChange: (name: string) => void;
  onPlayerChange: (index: number, player: CustomPlayer) => void;
  onAddPlayer: () => void;
  onRemovePlayer: () => void;
}> = ({ teamData, onTeamNameChange, onPlayerChange, onAddPlayer, onRemovePlayer }) => (
    <div className="mt-4 p-4 border border-cricket-light-gray rounded-lg space-y-4 bg-cricket-dark/30 animate-fade-in">
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Custom Team Name</label>
            <input
                type="text"
                value={teamData.name}
                onChange={(e) => onTeamNameChange(e.target.value)}
                placeholder="Enter team name"
                className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white"
            />
        </div>
        <h4 className="text-md font-semibold text-gray-300 pt-2 flex items-center gap-2">
            <UserAddIcon className="w-5 h-5" />
            Enter {teamData.players.length} Player Details
        </h4>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {teamData.players.map((player, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                    <input
                        type="text"
                        value={player.name}
                        onChange={(e) => onPlayerChange(index, { ...player, name: e.target.value })}
                        placeholder={`Player ${index + 1} Name`}
                        className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white text-sm"
                    />
                    <select
                        value={player.role}
                        onChange={(e) => onPlayerChange(index, { ...player, role: e.target.value as PlayerRole })}
                        className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 text-white text-sm"
                    >
                        {PLAYER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
            ))}
        </div>
        <div className="flex justify-end gap-2 mt-2">
            <button
                onClick={onRemovePlayer}
                disabled={teamData.players.length <= 6}
                className="text-sm bg-red-600 text-white font-semibold py-1 px-3 rounded-md hover:bg-red-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
            >
                - Remove Player
            </button>
            <button
                onClick={onAddPlayer}
                disabled={teamData.players.length >= 15}
                className="text-sm bg-green-600 text-white font-semibold py-1 px-3 rounded-md hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
            >
                + Add Player
            </button>
        </div>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in { animation: fade-in 0.3s ease-out; }
        `}</style>
    </div>
);


const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchSetupComplete, prefilledMatchup }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [overs, setOvers] = useState(20);
  const [error, setError] = useState('');
  const isTournamentMatch = !!prefilledMatchup;

  // State for custom teams
  const [customTeamA, setCustomTeamA] = useState(createInitialCustomTeam);
  const [customTeamB, setCustomTeamB] = useState(createInitialCustomTeam);

  useEffect(() => {
    const registeredTeams = getRegisteredTeams();
    setTeams(registeredTeams);
    if (prefilledMatchup) {
      setTeamAId(prefilledMatchup.teamAId);
      setTeamBId(prefilledMatchup.teamBId);
      setOvers(prefilledMatchup.overs);
    }
  }, [prefilledMatchup]);
  
  const handleAddPlayer = (teamSetter: React.Dispatch<React.SetStateAction<{ name: string; players: CustomPlayer[]; }>>) => {
      teamSetter(prev => ({
          ...prev,
          players: [...prev.players, createDefaultPlayer()]
      }));
  };

  const handleRemovePlayer = (teamSetter: React.Dispatch<React.SetStateAction<{ name: string; players: CustomPlayer[]; }>>) => {
      teamSetter(prev => ({
          ...prev,
          players: prev.players.slice(0, -1)
      }));
  };

  const handleStartMatch = () => {
    setError('');

    let teamA: Team | undefined;
    let teamB: Team | undefined;

    const createCustomTeamObject = (customData: { name: string; players: CustomPlayer[] }): Team => {
        const teamPlayers: Player[] = customData.players.map((p, i) => ({
            id: `custom_${customData.name.replace(/\s+/g, '_')}_p${i}`,
            name: p.name,
            role: p.role,
        }));

        const newTeam: Team = {
            id: `custom_team_${customData.name.replace(/\s+/g, '_')}_${Date.now()}`,
            name: customData.name,
            players: teamPlayers,
            battingStats: {},
            bowlingStats: {},
        };

        teamPlayers.forEach(p => {
            newTeam.battingStats[p.id] = { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
            newTeam.bowlingStats[p.id] = { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
        });
        return newTeam;
    };

    // Process Team A
    if (teamAId === 'custom') {
        if (!customTeamA.name.trim()) return setError('Custom Team A needs a name.');
        if (customTeamA.players.length < 6) return setError('Custom Team A must have at least 6 players.');
        if (customTeamA.players.length > 15) return setError('Custom Team A cannot have more than 15 players.');
        if (customTeamA.players.some(p => !p.name.trim())) return setError(`All ${customTeamA.players.length} players for Custom Team A must have a name.`);
        teamA = createCustomTeamObject(customTeamA);
    } else {
        teamA = teams.find(t => t.id === teamAId);
        if (teamA && (teamA.players.length < 6 || teamA.players.length > 15)) {
            return setError(`Registered team "${teamA.name}" has ${teamA.players.length} players. Teams must have between 6 and 15 players.`);
        }
    }

    // Process Team B
    if (teamBId === 'custom') {
        if (!customTeamB.name.trim()) return setError('Custom Team B needs a name.');
        if (customTeamB.players.length < 6) return setError('Custom Team B must have at least 6 players.');
        if (customTeamB.players.length > 15) return setError('Custom Team B cannot have more than 15 players.');
        if (customTeamB.players.some(p => !p.name.trim())) return setError(`All ${customTeamB.players.length} players for Custom Team B must have a name.`);
        teamB = createCustomTeamObject(customTeamB);
    } else {
        teamB = teams.find(t => t.id === teamBId);
        if (teamB && (teamB.players.length < 6 || teamB.players.length > 15)) {
            return setError(`Registered team "${teamB.name}" has ${teamB.players.length} players. Teams must have between 6 and 15 players.`);
        }
    }

    // Final Validation
    if (!teamA || !teamB) return setError('Please select both teams.');
    if (teamAId !== 'custom' && teamAId === teamBId) return setError('Please select two different registered teams.');
    if (teamA.name === teamB.name) return setError('Team names must be unique, even for custom teams.');
    if (teamA.players.length !== teamB.players.length) return setError(`Teams must have the same number of players. ${teamA.name} has ${teamA.players.length}, and ${teamB.name} has ${teamB.players.length}.`);
    if (overs < 6) return setError('Number of overs must be at least 6.');

    const initialMatch: Match = {
      id: prefilledMatchup?.matchId || `match_${new Date().toISOString()}`,
      status: MatchStatus.TOSS,
      teamA: JSON.parse(JSON.stringify(teamA)),
      teamB: JSON.parse(JSON.stringify(teamB)),
      overs: overs,
      innings: 1,
      toss: { wonBy: '', decision: 'bat' },
      firstInnings: {
        battingTeam: '', bowlingTeam: '', score: 0, wickets: 0, overs: 0, balls: 0,
        timeline: [], extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 }, fallOfWickets: [],
      },
      striker: null, nonStriker: null, bowler: null, winner: null, resultText: null,
      tournamentId: prefilledMatchup?.tournamentId,
    };
    onMatchSetupComplete(initialMatch);
  };
  
  const selectedTeamA = teams.find(t => t.id === teamAId);
  const selectedTeamB = teams.find(t => t.id === teamBId);
  
  const teamOptions: CustomSelectOption[] = [
    { id: 'custom', name: '-- Custom Team --' },
    ...teams.map(team => ({
        id: team.id,
        name: team.name,
        image: team.logo,
        description: `${team.players.length} player${team.players.length !== 1 ? 's' : ''}${(team.players.length < 6 || team.players.length > 15) ? ' ⚠️' : ''}`
    }))
  ];

  return (
    <div className="bg-cricket-gray p-6 md:p-8 rounded-lg shadow-xl max-w-4xl mx-auto animate-fade-in-up">
      <h2 className="text-3xl font-bold mb-2 text-center text-cricket-green flex items-center justify-center gap-3">
        <ClipboardListIcon className="w-8 h-8"/>
        Setup New Match
      </h2>
      {isTournamentMatch && <p className="text-center text-yellow-400 mb-6 font-semibold">This is a tournament match.</p>}
      
      <div className="flex justify-around items-center my-6 bg-cricket-dark/30 p-4 rounded-lg">
          <TeamDisplay team={selectedTeamA} customName={teamAId === 'custom' ? customTeamA.name : undefined} />
          <span className="text-2xl font-bold text-gray-500">VS</span>
          <TeamDisplay team={selectedTeamB} customName={teamBId === 'custom' ? customTeamB.name : undefined} />
      </div>

      {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-center">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team A Selection */}
        <div>
          <label htmlFor="teamA" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
            <TeamIcon className="w-5 h-5"/>
            Team A
          </label>
           <CustomSelect
            placeholder="Select Team A"
            options={teamOptions.filter(t => t.id !== teamBId || t.id === 'custom')}
            value={teamAId}
            onChange={setTeamAId}
            type="team"
          />
          {teamAId === 'custom' && (
              <CustomTeamForm
                  teamData={customTeamA}
                  onTeamNameChange={name => setCustomTeamA(prev => ({ ...prev, name }))}
                  onPlayerChange={(index, player) => {
                      const newPlayers = [...customTeamA.players];
                      newPlayers[index] = player;
                      setCustomTeamA(prev => ({ ...prev, players: newPlayers }));
                  }}
                  onAddPlayer={() => handleAddPlayer(setCustomTeamA)}
                  onRemovePlayer={() => handleRemovePlayer(setCustomTeamA)}
              />
          )}
        </div>
        
        {/* Team B Selection */}
        <div>
          <label htmlFor="teamB" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
            <TeamIcon className="w-5 h-5"/>
            Team B
          </label>
          <CustomSelect
            placeholder="Select Team B"
            options={teamOptions.filter(t => t.id !== teamAId || t.id === 'custom')}
            value={teamBId}
            onChange={setTeamBId}
            type="team"
          />
           {teamBId === 'custom' && (
              <CustomTeamForm
                  teamData={customTeamB}
                  onTeamNameChange={name => setCustomTeamB(prev => ({ ...prev, name }))}
                  onPlayerChange={(index, player) => {
                      const newPlayers = [...customTeamB.players];
                      newPlayers[index] = player;
                      setCustomTeamB(prev => ({ ...prev, players: newPlayers }));
                  }}
                  onAddPlayer={() => handleAddPlayer(setCustomTeamB)}
                  onRemovePlayer={() => handleRemovePlayer(setCustomTeamB)}
              />
          )}
        </div>

        {/* Overs Input */}
        <div className="md:col-span-2">
          <label htmlFor="overs" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
            <BallIcon className="w-5 h-5"/>
            Overs
          </label>
          <input
            type="number" id="overs" value={overs} onChange={(e) => setOvers(parseInt(e.target.value, 10))} min="6"
            className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-3 text-white focus:ring-1 focus:ring-cricket-green"
            disabled={isTournamentMatch}
          />
        </div>

        <div className="md:col-span-2">
          <button
            onClick={handleStartMatch}
            className="w-full bg-cricket-green text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <PlayIcon className="w-6 h-6"/>
            Start Match & Proceed to Toss
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamDisplay: React.FC<{ team?: Team, customName?: string }> = ({ team, customName }) => (
    <div className="flex flex-col items-center gap-2 text-center w-32">
        {team?.logo ? (
            <img src={team.logo} alt={team.name} className="w-20 h-20 rounded-full object-cover bg-cricket-light-gray" />
        ) : (
            <TeamIcon className="w-20 h-20 text-gray-500 bg-cricket-light-gray p-4 rounded-full" />
        )}
        <p className="font-semibold truncate w-full">{team?.name || customName || 'Team ?'}</p>
    </div>
);


export default MatchSetup;