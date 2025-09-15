
import React, { useState, useEffect, useCallback, useTransition, Dispatch, SetStateAction } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Match, Commentary, CommentaryStyle, Player, Team } from '../types';
import { MatchStatus } from '../types';
import { updateMatchState } from '../utils/cricket';
import { saveMatch } from '../utils/storage';
import { generateMatchSummaryText } from '../utils/export';
import Scoreboard from './Scoreboard';
import ScoringControls from './ScoringControls';
import FullScorecard from './FullScorecard';
import Modal from './Modal';
import PlayerSelectionModal from './PlayerSelectionModal';
import Toss from './Toss';
import LiveCommentary from './Commentary';
import { EnthusiasticLogo, HumorousLogo, TechnicalLogo, AnalyticalLogo } from './TeamLogos';
import { SettingsIcon, RewindIcon, FastForwardIcon, DownloadIcon, ListBulletIcon, ChatBubbleIcon, ColorSwatchIcon, KeyIcon } from './Icons';
import MatchSettingsModal from './MatchSettingsModal';

// Safely initialize the GoogleGenAI client to prevent crashes in browser environments.
const getApiKey = (): string | null => {
  try {
    // This will throw a ReferenceError in a browser if 'process' is not defined.
    if (process && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("`process.env.API_KEY` not found. AI features will be disabled. This is expected in browser environments without a build process.");
  }
  return null;
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates simple, template-based commentary when the Gemini API is not available.
 * This provides a graceful fallback for deployed environments.
 */
const generateBasicCommentary = (lastBall: any, currentMatchState: Match): string => {
    const innings = currentMatchState.innings === 1 ? currentMatchState.firstInnings : currentMatchState.secondInnings!;
    const battingTeam = innings.battingTeam === currentMatchState.teamA.name ? currentMatchState.teamA : currentMatchState.teamB;
    const striker = battingTeam.players.find(p => p.id === currentMatchState.striker);

    switch (lastBall.type) {
        case 'run':
            if (lastBall.runs === 0) return `A dot ball. No run.`;
            if (lastBall.runs === 1) return `${striker?.name || 'Batsman'} takes a single.`;
            if (lastBall.runs === 2) return `Good running, they come back for two.`;
            if (lastBall.runs === 3) return `Three runs taken.`;
            if (lastBall.runs === 4) return `FOUR! A great shot to the boundary.`;
            if (lastBall.runs === 6) return `SIX! That's out of the park!`;
            return `${lastBall.runs} runs scored.`;
        case 'wicket':
            return `WICKET! A huge blow for the batting side.`;
        case 'wide':
            return `A wide ball. Extra run to the batting side.`;
        case 'noball':
            return `No ball! It's a free hit.`;
        case 'bye':
            return `${lastBall.runs} bye${lastBall.runs > 1 ? 's' : ''} taken.`;
        case 'legbye':
            return `${lastBall.runs} leg bye${lastBall.runs > 1 ? 's' : ''} taken.`;
        default:
            return `Ball delivered. Score is ${innings.score}/${innings.wickets}.`;
    }
}

interface ScoringInterfaceProps {
  match: Match;
  setMatch: Dispatch<SetStateAction<Match | null>>;
}

const ScoringInterface: React.FC<ScoringInterfaceProps> = ({ match: initialMatch, setMatch: setAppMatch }) => {
  const [matchHistory, setMatchHistory] = useState([initialMatch]);
  const [commentaryHistory, setCommentaryHistory] = useState<Commentary[][]>([[{ id: 0, text: 'Match setup complete. Waiting for toss.', type: 'system' }]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const match = matchHistory[historyIndex];
  const commentary = commentaryHistory[historyIndex];
  
  const [isPending, startTransition] = useTransition();
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [modalState, setModalState] = useState<{ type: string; data?: any } | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scorecard' | 'commentary'>('commentary');
  const [commentaryStyle, setCommentaryStyle] = useState<CommentaryStyle>('Enthusiastic');
  const [customKeywords, setCustomKeywords] = useState('');

  // Effect to handle saving match result
  useEffect(() => {
    if (match.status === MatchStatus.FINISHED && match.winner) {
      saveMatch(match);
    }
  }, [match]);

  const updateHistory = (newMatch: Match, newCommentary: Commentary[]) => {
      const newMatchHistory = matchHistory.slice(0, historyIndex + 1);
      const newCommentaryHistory = commentaryHistory.slice(0, historyIndex + 1);

      setMatchHistory([...newMatchHistory, newMatch]);
      setCommentaryHistory([...newCommentaryHistory, newCommentary]);
      setHistoryIndex(newMatchHistory.length);
  }

  const generateCommentary = useCallback(async (lastBall: any, currentMatchState: Match): Promise<string> => {
    if (!ai) {
      return generateBasicCommentary(lastBall, currentMatchState);
    }
    const { battingTeam, bowlingTeam, score, wickets, overs, balls } = currentMatchState.innings === 1 ? currentMatchState.firstInnings : currentMatchState.secondInnings!;
    const prompt = `
      You are a ${commentaryStyle} cricket commentator.
      The match is between ${currentMatchState.teamA.name} and ${currentMatchState.teamB.name}.
      The current score is ${score}/${wickets} in ${overs}.${balls} overs.
      The last event was: ${JSON.stringify(lastBall)}.
      ${customKeywords ? `Incorporate these keywords if possible: ${customKeywords}.` : ''}
      Provide a short, engaging commentary for this ball.
    `;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error("Error generating commentary:", error);
      if (error instanceof Error && error.message.includes('API key not valid')) {
        return "AI commentary failed: The provided API Key is not valid.";
      }
      return "An error occurred while generating commentary.";
    }
  }, [commentaryStyle, customKeywords]);
  
  const handleScore = useCallback(async (type: string, runs?: number) => {
    if (!match) return;
    
    startTransition(async () => {
      const currentCommentary = commentaryHistory[historyIndex];
      const { nextState, modal } = updateMatchState(match, { type, runs });
      let nextCommentary = [...currentCommentary];

      const lastBall = nextState.innings === 1 ? nextState.firstInnings.timeline.slice(-1)[0] : nextState.secondInnings?.timeline.slice(-1)[0];
      if (lastBall) {
        setIsAiThinking(true);
        const loadingCommentary: Commentary = { id: Date.now(), text: 'Generating commentary...', type: 'loading' };
        nextCommentary = [loadingCommentary, ...nextCommentary];
        updateHistory(nextState, nextCommentary);

        const geminiText = await generateCommentary(lastBall, nextState);
        const finalCommentary: Commentary = { ...loadingCommentary, text: geminiText, type: 'gemini' };
        
        // Use a functional update to get the latest history state
        setCommentaryHistory(prev => {
            const latestHistory = [...prev];
            const latestCommentaryForUpdate = [...latestHistory[latestHistory.length - 1]];
            const loadingIndex = latestCommentaryForUpdate.findIndex(c => c.id === loadingCommentary.id);
            if (loadingIndex > -1) {
                latestCommentaryForUpdate[loadingIndex] = finalCommentary;
            }
            latestHistory[latestHistory.length - 1] = latestCommentaryForUpdate;
            return latestHistory;
        });

        setIsAiThinking(false);
      } else {
         updateHistory(nextState, nextCommentary);
      }

      if (modal) {
        setModalState(modal);
      }
    });
  }, [match, generateCommentary, historyIndex, commentaryHistory]);

  const handleTossComplete = (wonBy: string, decision: 'bat' | 'bowl') => {
    const battingTeam = (decision === 'bat') ? wonBy : (wonBy === match.teamA.name ? match.teamB.name : match.teamA.name);
    const bowlingTeam = (battingTeam === match.teamA.name) ? match.teamB.name : match.teamA.name;
    
    const nextState = {
      ...match,
      status: MatchStatus.IN_PROGRESS,
      toss: { wonBy, decision },
      firstInnings: {
        ...match.firstInnings,
        battingTeam,
        bowlingTeam,
      },
    };
    updateHistory(nextState, [{ id: Date.now(), text: `${wonBy} won the toss and elected to ${decision}.`, type: 'system' }]);
    setModalState({ type: 'select_openers' });
  };
  
  const handleModalConfirm = (...args: any[]) => {
    let nextState: Match;
    let newSystemCommentary: string | null = null;
    if (modalState?.type === 'select_openers') {
        const [strikerId, nonStrikerId, bowlerId] = args;
        nextState = { ...match, striker: strikerId, nonStriker: nonStrikerId, bowler: bowlerId };
        newSystemCommentary = `Openers and first bowler selected. Let the match begin!`;
    } else if (modalState?.type === 'select_next_batsman') {
        const [nextBatsmanId] = args;
        const { nextState: updatedMatch } = updateMatchState(match, { type: 'wicket_confirm', outPlayerId: modalState.data.outPlayerId, nextBatsmanId });
        nextState = updatedMatch;
        newSystemCommentary = `Next batsman is in.`;
    } else if (modalState?.type === 'select_new_bowler') {
        const [newBowlerId] = args;
        const { nextState: updatedMatch } = updateMatchState(match, { type: 'new_over', newBowlerId });
        nextState = updatedMatch;
        newSystemCommentary = `New bowler selected for the over.`;
    } else {
        nextState = match;
    }
    
    const newCommentary: Commentary[] = newSystemCommentary ? [{ id: Date.now(), text: newSystemCommentary, type: 'system'}, ...commentary] : commentary;
    updateHistory(nextState, newCommentary);
    setModalState(null);
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < matchHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleExportMatchData = useCallback(() => {
    if (!match) return;

    try {
      const matchDataJson = JSON.stringify(match, null, 2);
      const blob = new Blob([matchDataJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `cricket_match_${match.teamA.name.replace(/\s+/g, '_')}_vs_${match.teamB.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export match data:", error);
    }
  }, [match]);

  const handleExportSummary = useCallback(() => {
    if (!match) return;

    try {
      const summaryText = generateMatchSummaryText(match);
      const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `match_summary_${match.teamA.name.replace(/\s+/g, '_')}_vs_${match.teamB.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export match summary:", error);
    }
  }, [match]);

  const handleSaveSettings = useCallback(({ newOvers, newTarget }: { newOvers: number; newTarget?: number }) => {
    if (!match) return;

    let commentaryText = 'Match settings updated: ';
    const changes = [];

    const nextState = { ...match };

    if (newOvers !== match.overs) {
        nextState.overs = newOvers;
        changes.push(`Total overs changed to ${newOvers}`);
    }

    if (match.innings === 2 && newTarget !== undefined && nextState.secondInnings) {
        const currentTarget = nextState.secondInnings.targetScore || match.firstInnings.score + 1;
        if (newTarget !== currentTarget) {
            nextState.secondInnings = { ...nextState.secondInnings, targetScore: newTarget };
            changes.push(`Target score adjusted to ${newTarget}`);
        }
    }

    if (changes.length > 0) {
        commentaryText += changes.join(', ');
        const newCommentary: Commentary[] = [{ id: Date.now(), text: commentaryText, type: 'system' }, ...commentary];
        updateHistory(nextState, newCommentary);
    }
    
    setIsSettingsModalOpen(false);
  }, [match, commentary, historyIndex, matchHistory, commentaryHistory]);

  if (!match) return null;

  if (match.status === MatchStatus.TOSS) {
    return <Toss teamA={match.teamA.name} teamB={match.teamB.name} onTossComplete={handleTossComplete} />;
  }

  const battingTeamObj = (match.innings === 1 ? match.firstInnings.battingTeam : match.secondInnings?.battingTeam) === match.teamA.name ? match.teamA : match.teamB;
  const bowlingTeamObj = (match.innings === 1 ? match.firstInnings.bowlingTeam : match.secondInnings?.bowlingTeam) === match.teamA.name ? match.teamA : match.teamB;
  const innings = match.innings === 1 ? match.firstInnings : match.secondInnings;

  const ActionButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string }> = ({ onClick, disabled = false, children, className = 'bg-gray-700 hover:bg-gray-600' }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 flex items-center gap-2 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <Scoreboard match={match} />
      
      {match.status === MatchStatus.IN_PROGRESS && (
          <div className="flex justify-center items-center space-x-2 md:space-x-4 mb-4">
            <ActionButton onClick={handleUndo} disabled={historyIndex === 0}><RewindIcon className="w-5 h-5"/>Undo</ActionButton>
            <ActionButton onClick={handleRedo} disabled={historyIndex >= matchHistory.length - 1}><FastForwardIcon className="w-5 h-5"/>Redo</ActionButton>
            <ActionButton onClick={handleExportMatchData} className="bg-blue-600 hover:bg-blue-500"><DownloadIcon className="w-5 h-5"/>Export Data</ActionButton>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              aria-label="Match Settings"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex space-x-1 bg-cricket-gray p-1 rounded-lg">
            <button onClick={() => setActiveTab('scorecard')} className={`w-full p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'scorecard' ? 'bg-cricket-green text-white' : 'text-gray-300 hover:bg-cricket-light-gray'}`}>
                <ListBulletIcon className="w-5 h-5" /> Scorecard
            </button>
            <button onClick={() => setActiveTab('commentary')} className={`w-full p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'commentary' ? 'bg-cricket-green text-white' : 'text-gray-300 hover:bg-cricket-light-gray'}`}>
                <ChatBubbleIcon className="w-5 h-5" /> Commentary
            </button>
          </div>

          <div className="bg-cricket-gray p-4 rounded-lg shadow-inner min-h-[300px]">
            {activeTab === 'scorecard' && (
              <FullScorecard 
                team={battingTeamObj} 
                fallOfWickets={innings?.fallOfWickets} 
              />
            )}
            {activeTab === 'commentary' && (
              <div>
                 <div className="bg-cricket-dark p-4 rounded-lg mb-4">
                    <h4 className="text-lg font-semibold mb-3 text-cricket-green flex items-center gap-2">
                        <ColorSwatchIcon className="w-6 h-6" />
                        AI Commentary Style
                    </h4>
                    {!ai && (
                        <div className="bg-blue-900/50 border border-blue-700 text-blue-300 text-xs rounded-md p-2 mb-4 text-center">
                            Basic commentary is active. For advanced AI styles, a Gemini API key must be configured in the environment.
                        </div>
                    )}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 ${!ai ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {(['Enthusiastic', 'Humorous', 'Technical', 'Analytical'] as CommentaryStyle[]).map(style => {
                        const Logo = { Enthusiastic: EnthusiasticLogo, Humorous: HumorousLogo, Technical: TechnicalLogo, Analytical: AnalyticalLogo }[style];
                        return (
                          <button key={style} onClick={() => setCommentaryStyle(style)} disabled={!ai} className={`p-2 rounded-lg transition-all transform hover:scale-105 ${commentaryStyle === style ? 'bg-cricket-green ring-2 ring-white' : 'bg-cricket-light-gray'}`}>
                            <Logo className="w-12 h-12 mx-auto" />
                            <p className="text-xs mt-2 font-semibold">{style}</p>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Custom keywords (e.g., tense moment, great shot)"
                            value={customKeywords}
                            onChange={(e) => setCustomKeywords(e.target.value)}
                            disabled={!ai}
                            className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 pl-10 focus:ring-1 focus:ring-cricket-green text-sm disabled:opacity-50"
                        />
                    </div>
                </div>
                <LiveCommentary commentary={commentary} />
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <ScoringControls onScore={handleScore} disabled={isPending || isAiThinking || match.status !== MatchStatus.IN_PROGRESS} />
        </div>
      </div>
      
      <Modal isVisible={!!modalState} onClose={() => setModalState(null)}>
        {modalState?.type === 'select_openers' && (
          <PlayerSelectionModal
            title="Select Openers & First Bowler"
            onConfirm={handleModalConfirm}
            battingTeam={battingTeamObj}
            bowlingTeam={bowlingTeamObj}
            needsBowler={true}
          />
        )}
        {modalState?.type === 'select_next_batsman' && (
          <PlayerSelectionModal
            title="Select Next Batsman"
            onConfirm={handleModalConfirm}
            battingTeam={battingTeamObj}
            needsBowler={false}
            nonStriker={match.nonStriker}
            excludeIds={modalState.data?.excludeIds || []}
          />
        )}
        {modalState?.type === 'select_new_bowler' && (
          <PlayerSelectionModal
            title="Select New Bowler"
            onConfirm={handleModalConfirm}
            bowlingTeam={bowlingTeamObj}
            needsBowler={true}
            currentBowler={match.bowler}
          />
        )}
        {modalState?.type === 'innings_break' && (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Innings Break</h3>
            <p className="mb-4">Target for {match.firstInnings.bowlingTeam} is {match.firstInnings.score + 1}.</p>
            <button onClick={() => {
                const { nextState, modal } = updateMatchState(match, { type: 'start_second_innings' });
                updateHistory(nextState, [{ id: Date.now(), text: 'Second innings is about to start.', type: 'system' }]);
                setModalState(modal!);
            }} className="bg-cricket-green text-white font-bold py-2 px-4 rounded-lg">Start 2nd Innings</button>
          </div>
        )}
        {modalState?.type === 'match_finished' && (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 text-cricket-green">Match Finished</h3>
            <p className="text-lg font-semibold mb-6">{match.resultText}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => setAppMatch(null)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition">Start New Match</button>
              <button onClick={handleExportSummary} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition">Export Summary</button>
            </div>
          </div>
        )}
      </Modal>

      <MatchSettingsModal 
        isVisible={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        match={match}
      />
    </div>
  );
};

export default ScoringInterface;