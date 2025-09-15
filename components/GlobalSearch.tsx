import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { PlayerProfile, Team, Match } from '../types';
import { SearchIcon, UserCircleIcon, TeamIcon, CalendarIcon } from './Icons';

interface GlobalSearchProps {
  players: PlayerProfile[];
  teams: Team[];
  matches: Match[];
  onPlayerSelect: (player: PlayerProfile) => void;
  onTeamSelect: (team: Team) => void;
  onMatchSelect: (match: Match) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ players, teams, matches, onPlayerSelect, onTeamSelect, onMatchSelect }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    if (query.length < 2) {
      return { foundPlayers: [], foundTeams: [], foundMatches: [] };
    }

    const lowerCaseQuery = query.toLowerCase();

    const foundPlayers = players.filter(p => p.name.toLowerCase().includes(lowerCaseQuery));
    const foundTeams = teams.filter(t => t.name.toLowerCase().includes(lowerCaseQuery));
    const foundMatches = matches.filter(m => 
        m.teamA.name.toLowerCase().includes(lowerCaseQuery) || 
        m.teamB.name.toLowerCase().includes(lowerCaseQuery) ||
        new Date(m.id).toLocaleDateString().includes(lowerCaseQuery)
    );

    return { foundPlayers, foundTeams, foundMatches };
  }, [query, players, teams, matches]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    setQuery('');
    setIsFocused(false);
  };

  const hasResults = searchResults.foundPlayers.length > 0 || searchResults.foundTeams.length > 0 || searchResults.foundMatches.length > 0;

  return (
    <div className="relative w-full max-w-sm" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search for players, teams, matches..."
          className="w-full bg-cricket-light-gray border border-gray-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:ring-1 focus:ring-cricket-green focus:border-cricket-green transition"
        />
      </div>
      
      {isFocused && query.length >= 2 && (
        <div className="absolute z-30 w-full mt-2 bg-cricket-gray border border-cricket-light-gray rounded-lg shadow-xl max-h-96 overflow-y-auto animate-fade-in">
          {hasResults ? (
            <div className="p-2">
              {searchResults.foundTeams.length > 0 && (
                <SearchResultCategory title="Teams">
                  {searchResults.foundTeams.map(team => (
                    <SearchResultItem
                      key={team.id}
                      icon={<TeamIcon className="w-6 h-6 text-gray-400" />}
                      name={team.name}
                      onClick={() => { onTeamSelect(team); handleReset(); }}
                    />
                  ))}
                </SearchResultCategory>
              )}
              {searchResults.foundPlayers.length > 0 && (
                <SearchResultCategory title="Players">
                  {searchResults.foundPlayers.map(player => (
                    <SearchResultItem
                      key={player.id}
                      icon={<UserCircleIcon className="w-6 h-6 text-gray-400" />}
                      name={player.name}
                      description={player.role}
                      onClick={() => { onPlayerSelect(player); handleReset(); }}
                    />
                  ))}
                </SearchResultCategory>
              )}
              {searchResults.foundMatches.length > 0 && (
                <SearchResultCategory title="Matches">
                  {searchResults.foundMatches.map(match => (
                    <SearchResultItem
                      key={match.id}
                      icon={<CalendarIcon className="w-6 h-6 text-gray-400" />}
                      name={`${match.teamA.name} vs ${match.teamB.name}`}
                      description={new Date(match.id).toLocaleDateString()}
                      onClick={() => { onMatchSelect(match); handleReset(); }}
                    />
                  ))}
                </SearchResultCategory>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              No results found for "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SearchResultCategory: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-2">
    <h4 className="px-3 py-1 text-xs font-bold text-cricket-green uppercase tracking-wider">{title}</h4>
    <ul>{children}</ul>
  </div>
);

const SearchResultItem: React.FC<{ icon: React.ReactNode; name: string; description?: string; onClick: () => void; }> = ({ icon, name, description, onClick }) => (
  <li>
    <button onClick={onClick} className="w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-cricket-light-gray transition-colors">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="font-semibold text-white">{name}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </button>
  </li>
);

export default GlobalSearch;