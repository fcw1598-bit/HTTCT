import React from 'react';
import type { Team, FallOfWicket } from '../types';
import { formatOvers, calculateStrikeRate, calculateEconomy } from '../utils/cricket';
import { UserCircleIcon, BatIcon, BallIcon } from './Icons';

interface FullScorecardProps {
  team: Team;
  fallOfWickets?: FallOfWicket[];
}

const FullScorecard: React.FC<FullScorecardProps> = ({ team, fallOfWickets }) => {
  const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{children}</th>
  );
  
  const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <td className={`px-2 py-2 whitespace-nowrap text-sm ${className}`}>{children}</td>
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-2 text-cricket-green flex items-center gap-2">
            <BatIcon className="w-6 h-6" /> Batting
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cricket-light-gray">
            <thead className="bg-cricket-light-gray/50">
              <tr>
                <TableHeader>Batsman</TableHeader>
                <TableHeader>R</TableHeader>
                <TableHeader>B</TableHeader>
                <TableHeader>4s</TableHeader>
                <TableHeader>6s</TableHeader>
                <TableHeader>SR</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-cricket-light-gray">
              {team.players.map((player, index) => {
                const stats = team.battingStats[player.id];
                if (!stats || (stats.balls === 0 && !stats.isOut)) return null;
                return (
                  <tr key={player.id} className="hover:bg-cricket-light-gray/50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`}}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {player.photo ? (
                          <img src={player.photo} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <UserCircleIcon className="w-10 h-10 text-gray-500" />
                        )}
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <p className="text-xs text-gray-400">{player.role}</p>
                          {stats.isOut && <p className="text-xs text-red-400">{stats.outBy || 'out'}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{stats.runs}</TableCell>
                    <TableCell>{stats.balls}</TableCell>
                    <TableCell>{stats.fours}</TableCell>
                    <TableCell>{stats.sixes}</TableCell>
                    <TableCell>{calculateStrikeRate(stats.runs, stats.balls)}</TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {fallOfWickets && fallOfWickets.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-2 text-cricket-green">Fall of Wickets</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {fallOfWickets.map((fow, index) => {
              const player = team.players.find(p => p.id === fow.playerOutId);
              return `${fow.score}-${index + 1} (${player?.name || 'Unknown'}, ${fow.overs} ov)`;
            }).join(', ')}
          </p>
        </div>
      )}

      <div>
        <h4 className="text-lg font-semibold mb-2 text-cricket-green flex items-center gap-2">
            <BallIcon className="w-6 h-6" /> Bowling
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cricket-light-gray">
            <thead className="bg-cricket-light-gray/50">
              <tr>
                <TableHeader>Bowler</TableHeader>
                <TableHeader>O</TableHeader>
                <TableHeader>M</TableHeader>
                <TableHeader>R</TableHeader>
                <TableHeader>W</TableHeader>
                <TableHeader>Econ</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-cricket-light-gray">
              {team.players.map((player, index) => {
                const stats = team.bowlingStats[player.id];
                if (!stats || (stats.overs === 0 && stats.balls === 0)) return null;
                return (
                  <tr key={player.id} className="hover:bg-cricket-light-gray/50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`}}>
                    <TableCell>
                       <div className="flex items-center gap-3">
                        {player.photo ? (
                          <img src={player.photo} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <UserCircleIcon className="w-10 h-10 text-gray-500" />
                        )}
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <p className="text-xs text-gray-400">{player.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatOvers(stats.overs, stats.balls)}</TableCell>
                    <TableCell>{stats.maidens}</TableCell>
                    <TableCell>{stats.runs}</TableCell>
                    <TableCell className="font-bold">{stats.wickets}</TableCell>
                    <TableCell>{calculateEconomy(stats.runs, stats.overs, stats.balls)}</TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FullScorecard;