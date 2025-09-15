import React, { useState, useEffect } from 'react';
import type { Match, PlayerProfile, Team } from './types';
import MatchSetup from './components/MatchSetup';
import ScoringInterface from './components/ScoringInterface';
import TeamStatsDashboard from './components/TeamStatsDashboard';
import TeamRegistrationDashboard from './components/TeamRegistrationDashboard';
import PlayerProfilesDashboard from './components/PlayerProfilesDashboard';
import MatchHistoryDashboard from './components/MatchHistoryDashboard';
import TournamentDashboard from './components/TournamentDashboard';
import SmartMenu from './components/SmartMenu';
import GlobalSearch from './components/GlobalSearch';
import MatchDetailModal from './components/MatchDetailModal';
import { getRegisteredTeams, getPlayerProfiles, getMatchHistory } from './utils/storage';
import { TrophyIcon, BatIcon, DocumentAddIcon, PlayIcon, ArchiveIcon, ShieldCheckIcon, UsersIcon, ChartBarIcon } from './components/Icons';

type View = 'setup' | 'scoring' | 'stats' | 'teams' | 'players' | 'history' | 'tournaments';

interface Matchup {
  teamAId: string;
  teamBId: string;
  overs: number;
  tournamentId: string;
  matchId: string;
}

const App: React.FC = () => {
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [activeView, setActiveView] = useState<View>('setup');
  const [matchToSetup, setMatchToSetup] = useState<Matchup | null>(null);

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerProfile[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teamForStats, setTeamForStats] = useState<string | null>(null);
  const [selectedMatchFromSearch, setSelectedMatchFromSearch] = useState<Match | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    // This effect ensures our search data is always fresh.
    setAllTeams(getRegisteredTeams());
    setAllPlayers(getPlayerProfiles());
    setAllMatches(getMatchHistory());
  }, [activeView]); // Re-fetch when view changes to catch updates.

  const handleMatchSetupComplete = (match: Match) => {
    setCurrentMatch(match);
    setMatchToSetup(null); // Clear the pre-setup
    setActiveView('scoring');
  };
  
  const handleStartTournamentMatch = (matchup: Matchup) => {
    setMatchToSetup(matchup);
    setActiveView('setup');
  };

  const handlePlayerSelect = (player: PlayerProfile) => {
    setActiveView('players');
  };

  const handleTeamSelect = (team: Team) => {
      setTeamForStats(team.name);
      setActiveView('stats');
  };

  const handleMatchSelect = (match: Match) => {
      setSelectedMatchFromSearch(match);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'scoring':
        return currentMatch ? <ScoringInterface match={currentMatch} setMatch={setCurrentMatch} /> : <p>Error: No match data available. Please set up a new match.</p>;
      case 'stats':
        return <TeamStatsDashboard initialSelectedTeam={teamForStats} />;
      case 'teams':
        return <TeamRegistrationDashboard />;
      case 'players':
        return <PlayerProfilesDashboard />;
      case 'history':
        return <MatchHistoryDashboard />;
      case 'tournaments':
        return <TournamentDashboard onStartMatch={handleStartTournamentMatch} />;
      case 'setup':
      default:
        return <MatchSetup onMatchSetupComplete={handleMatchSetupComplete} prefilledMatchup={matchToSetup} />;
    }
  };
  
  const viewDetails: { [key in View]: { label: string; title: string; subtitle: string; icon: React.FC<React.SVGProps<SVGSVGElement>> } } = {
    setup: { label: 'New Match', title: 'New Match Setup', subtitle: 'Configure teams and settings to get started.', icon: DocumentAddIcon },
    scoring: { label: 'Live Match', title: 'Live Match', subtitle: 'Follow the ball-by-ball action as it happens.', icon: PlayIcon },
    tournaments: { label: 'Tournaments', title: 'Tournaments', subtitle: 'Create and manage cricket championships.', icon: TrophyIcon },
    history: { label: 'Match History', title: 'Match History', subtitle: 'Review past matches and detailed scorecards.', icon: ArchiveIcon },
    teams: { label: 'Manage Teams', title: 'Team Management', subtitle: 'Register and manage your cricket squads.', icon: ShieldCheckIcon },
    players: { label: 'Player Profiles', title: 'Player Profiles', subtitle: 'Create and edit profiles for all your players.', icon: UsersIcon },
    stats: { label: 'Team Statistics', title: 'Team Statistics', subtitle: 'Analyze team performance and track progress.', icon: ChartBarIcon },
  };

  const { icon: Icon, title, subtitle } = viewDetails[activeView];

  return (
    <div className="bg-cricket-dark min-h-screen text-white">
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-cricket-dark/90 backdrop-blur-sm shadow-lg border-b border-cricket-light-gray/20' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="py-4">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center gap-3">
                        <BatIcon className="w-8 h-8 text-cricket-green transform -rotate-45" />
                        <h1 className="text-3xl font-bold text-cricket-green tracking-tight">Cricket Scorer Pro</h1>
                    </div>
                     <GlobalSearch 
                        players={allPlayers}
                        teams={allTeams}
                        matches={allMatches}
                        onPlayerSelect={handlePlayerSelect}
                        onTeamSelect={handleTeamSelect}
                        onMatchSelect={handleMatchSelect}
                    />
                </div>
                 <SmartMenu
                    activeView={activeView}
                    setActiveView={(view) => {
                        setTeamForStats(null);
                        setActiveView(view);
                    }}
                    currentMatch={currentMatch}
                    viewDetails={viewDetails}
                 />
              </div>
          </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Dynamic View Title Card */}
        <div key={activeView} className="bg-cricket-gray w-full mx-auto p-4 rounded-xl flex items-center gap-4 shadow-lg animate-fade-in mb-8">
           <div className="bg-cricket-dark p-3 rounded-full">
                <Icon className="w-8 h-8 text-cricket-green" />
            </div>
            <div className="text-left">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                     {activeView === 'scoring' && currentMatch ? `${currentMatch.teamA.name} vs ${currentMatch.teamB.name}` : title}
                </h2>
                <p className="text-gray-400 text-sm">{subtitle}</p>
            </div>
        </div>

        <main className="animate-fade-in" key={activeView}>
          {renderActiveView()}
        </main>
        
        {selectedMatchFromSearch && (
           <MatchDetailModal 
               match={selectedMatchFromSearch}
               onClose={() => setSelectedMatchFromSearch(null)}
           />
        )}

        <footer className="text-center mt-12 text-gray-500 text-sm animate-fade-in" style={{ animationDelay: '400ms' }}>
            <p>&copy; {new Date().getFullYear()} Cricket Scorer Pro. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;