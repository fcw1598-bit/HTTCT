import React, { useState, useEffect, useRef } from 'react';
import type { Match, Player, Team } from '../types';
import { formatOvers, calculateRunRate, calculateRequiredRunRate } from '../utils/cricket';
import { BallIcon, BatIcon, TeamIcon } from './Icons';

interface ScoreboardProps {
  match: Match;
}

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const Scoreboard: React.FC<ScoreboardProps> = ({ match }) => {
  const currentInningsData = match.innings === 1 ? match.firstInnings : match.secondInnings;

  if (!currentInningsData) return null;

  const { score, wickets, overs, balls, battingTeam, bowlingTeam } = currentInningsData;
  const battingTeamObj = match.teamA.name === battingTeam ? match.teamA : match.teamB;
  const bowlingTeamObj = match.teamA.name === bowlingTeam ? match.teamA : match.teamB;

  const striker = battingTeamObj.players.find(p => p.id === match.striker);
  const nonStriker = battingTeamObj.players.find(p => p.id === match.nonStriker);
  const bowler = bowlingTeamObj.players.find(p => p.id === match.bowler);

  const strikerStats = match.striker ? battingTeamObj.battingStats[match.striker] : { runs: 0, balls: 0 };
  const nonStrikerStats = match.nonStriker ? battingTeamObj.battingStats[match.nonStriker] : { runs: 0, balls: 0 };
  const bowlerStats = match.bowler ? bowlingTeamObj.bowlingStats[match.bowler] : { overs: 0, balls: 0, runs: 0, wickets: 0 };

  const prevScore = usePrevious(score);
  const prevWickets = usePrevious(wickets);

  const [scoreAnimation, setScoreAnimation] = useState('');
  const [wicketAnimation, setWicketAnimation] = useState('');
  
  useEffect(() => {
      if (prevScore !== undefined && score > prevScore) {
          setScoreAnimation('animate-pulse-green');
          const timer = setTimeout(() => setScoreAnimation(''), 700);
          return () => clearTimeout(timer);
      }
  }, [score, prevScore]);

  useEffect(() => {
      if (prevWickets !== undefined && wickets > prevWickets) {
          setWicketAnimation('animate-pulse-red');
          const timer = setTimeout(() => setWicketAnimation(''), 700);
          return () => clearTimeout(timer);
      }
  }, [wickets, prevWickets]);

  const currentRunRate = calculateRunRate(score, overs, balls);

  const targetScore = match.innings === 2 ? (match.secondInnings?.targetScore || match.firstInnings.score + 1) : null;
  const runsNeeded = targetScore ? targetScore - score : 0;
  const requiredRunRate = match.innings === 2 ? calculateRequiredRunRate(runsNeeded, match.overs, overs, balls) : null;
  
  const thisOver = currentInningsData.timeline.filter(b => b.overNumber === overs);

  return (
    <div className="bg-cricket-gray p-4 md:p-6 rounded-xl shadow-2xl border border-cricket-light-gray text-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Team Score */}
        <div className="flex items-center gap-4">
            {battingTeamObj.logo ? (
                <img src={battingTeamObj.logo} alt={battingTeam} className="w-20 h-20 rounded-full object-cover bg-cricket-light-gray flex-shrink-0" />
            ) : (
                <TeamIcon className="w-20 h-20 text-gray-500 bg-cricket-light-gray p-4 rounded-full flex-shrink-0" />
            )}
            <div>
                <p className="text-xl font-semibold">{battingTeam}</p>
                <p className="text-5xl font-bold tracking-tighter">
                    <span className={scoreAnimation}>{score}</span>
                    <span className="text-4xl">/</span>
                    <span className={`text-4xl ${wicketAnimation}`}>{wickets}</span>
                </p>
                <p className="text-xl font-semibold">({formatOvers(overs, balls)} ov)</p>
            </div>
        </div>

        {/* Batsmen and Bowler */}
        <div className="text-center space-y-3">
          <div className="flex justify-around items-center">
            <PlayerDisplay player={striker} stats={strikerStats} icon={<BatIcon className="w-5 h-5 text-cricket-green" />} />
            <PlayerDisplay player={nonStriker} stats={nonStrikerStats} />
          </div>
          <div className="border-t border-cricket-light-gray my-2"></div>
          <PlayerDisplay player={bowler} stats={bowlerStats} icon={<BallIcon className="w-5 h-5 text-red-500" />} isBowler />
        </div>

        {/* Match Stats */}
        <div className="text-right space-y-2">
          <p>CRR: <span className="font-bold text-xl">{currentRunRate}</span></p>
          {match.innings === 2 && targetScore && (
            <>
              <p>Target: <span className="font-bold text-2xl text-cricket-green">{targetScore}</span></p>
              <p>Need <span className="font-bold">{runsNeeded}</span> runs to win</p>
              <p>RRR: <span className="font-bold text-xl">{requiredRunRate}</span></p>
            </>
          )}
          <div className="flex justify-end items-center gap-1.5 pt-2">
            <span className="text-xs text-gray-400 mr-2">This Over:</span>
            {thisOver.map((ball, index) => (
                <OverBall key={index} ball={ball} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDisplay: React.FC<{ player?: Player; stats: any; icon?: React.ReactNode; isBowler?: boolean }> = ({ player, stats, icon, isBowler }) => (
  <div className="flex items-center gap-2">
    {icon}
    <div className="text-left">
      <p className="font-semibold">{player?.name || 'N/A'}</p>
      <p className="text-sm text-gray-300">
        {isBowler
          ? `${stats.runs}/${stats.wickets} (${formatOvers(stats.overs, stats.balls)})`
          : `${stats.runs} (${stats.balls})`}
      </p>
    </div>
  </div>
);

const OverBall: React.FC<{ball: any}> = ({ ball }) => {
    let content: React.ReactNode = ball.runs;
    let className = "bg-gray-600";
    if (ball.type === 'wicket') {
        content = "W";
        className = "bg-red-600";
    } else if (ball.runs === 4) {
        className = "bg-blue-600";
    } else if (ball.runs === 6) {
        className = "bg-green-600";
    } else if (ball.type === 'wide') {
        content = "Wd";
    } else if (ball.type === 'noball') {
        content = "Nb";
    } else if (ball.type === 'legbye' || ball.type === 'bye') {
        content = `${ball.runs}${ball.type.slice(0, 1)}`;
    }
    
    return (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${className} animate-pop-in`}>
            {content}
        </div>
    )
}

export default Scoreboard;