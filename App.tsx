import React, { useState } from 'react';
import type { Match, Team } from './types';
import MatchSetup from './components/MatchSetup';
import ScoringInterface from './components/ScoringInterface';
import TeamStatsDashboard from './components/TeamStatsDashboard';
import TeamRegistrationDashboard from './components/TeamRegistrationDashboard';
import PlayerProfilesDashboard from './components/PlayerProfilesDashboard';
import MatchHistoryDashboard from './components/MatchHistoryDashboard';
import TournamentDashboard from './components/TournamentDashboard';
import { TrophyIcon } from './components/Icons';

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

  const handleMatchSetupComplete = (match: Match) => {
    setCurrentMatch(match);
    setMatchToSetup(null); // Clear the pre-setup
    setActiveView('scoring');
  };
  
  const handleStartTournamentMatch = (matchup: Matchup) => {
    setMatchToSetup(matchup);
    setActiveView('setup');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'scoring':
        return currentMatch ? <ScoringInterface match={currentMatch} setMatch={setCurrentMatch} /> : <p>Error: No match data available. Please set up a new match.</p>;
      case 'stats':
        return <TeamStatsDashboard />;
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
  
  const NavButton: React.FC<{ view: View, label: string, children?: React.ReactNode }> = ({ view, label, children }) => (
     <button
        onClick={() => {
            if (view === 'scoring' && !currentMatch) return; // Don't switch to scoring without a match
            setActiveView(view)
        }}
        disabled={view === 'scoring' && !currentMatch}
        className={`px-4 py-2 font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${
            activeView === view
            ? 'bg-cricket-green text-white'
            : 'text-gray-300 hover:bg-cricket-light-gray disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
        >
        {children}
        {label}
    </button>
  );

  return (
    <div className="bg-cricket-gray-dark min-h-screen text-white font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-cricket-green tracking-tight">Cricket Scorer Pro</h1>
            <p className="text-gray-400 mt-2">The ultimate tool for tracking your cricket matches, with AI-powered commentary.</p>
        </header>

        <nav className="flex justify-center flex-wrap gap-2 md:gap-4 mb-8 bg-cricket-gray p-2 rounded-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <NavButton view="setup" label="New Match" />
            {currentMatch && <NavButton view="scoring" label="Live Match" />}
            <NavButton view="tournaments" label="Tournaments"><TrophyIcon className="w-5 h-5" /></NavButton>
            <NavButton view="history" label="Match History" />
            <NavButton view="teams" label="Manage Teams" />
            <NavButton view="players" label="Player Profiles" />
            <NavButton view="stats" label="Team Statistics" />
        </nav>

        <main className="animate-fade-in" key={activeView}>
          {renderActiveView()}
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm animate-fade-in" style={{ animationDelay: '400ms' }}>
            <p>&copy; {new Date().getFullYear()} Cricket Scorer Pro. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
