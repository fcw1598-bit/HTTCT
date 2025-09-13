import React from 'react';
import type { Match } from '../types';
import Modal from './Modal';
import FullScorecard from './FullScorecard';

interface MatchDetailModalProps {
  match: Match;
  onClose: () => void;
}

const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, onClose }) => {
  const { teamA, teamB, firstInnings, secondInnings, resultText } = match;

  const firstInningsBattingTeam = teamA.name === firstInnings.battingTeam ? teamA : teamB;
  const secondInningsBattingTeam = secondInnings ? (teamA.name === secondInnings.battingTeam ? teamA : teamB) : null;

  return (
    <Modal isVisible={true} onClose={onClose}>
      <div className="space-y-4 max-h-[85vh] overflow-y-auto p-2">
        <h2 className="text-2xl font-bold text-center text-cricket-green">Match Details</h2>
        <p className="text-lg font-semibold text-center pb-4 border-b border-cricket-light-gray">{resultText}</p>

        <div className="space-y-6">
          {/* First Innings */}
          <div>
            <h3 className="text-xl font-bold mb-3 bg-cricket-light-gray p-2 rounded-md">
              Innings 1: {firstInningsBattingTeam.name}
            </h3>
            <FullScorecard 
              team={firstInningsBattingTeam} 
              fallOfWickets={firstInnings.fallOfWickets} 
            />
          </div>

          {/* Second Innings */}
          {secondInnings && secondInningsBattingTeam && (
            <div>
              <h3 className="text-xl font-bold mb-3 bg-cricket-light-gray p-2 rounded-md">
                Innings 2: {secondInningsBattingTeam.name}
              </h3>
              <FullScorecard 
                team={secondInningsBattingTeam} 
                fallOfWickets={secondInnings.fallOfWickets} 
              />
            </div>
          )}
        </div>
        <div className="text-right mt-6">
            <button
                onClick={onClose}
                className="font-semibold py-2 px-4 rounded-lg transition-colors bg-gray-600 hover:bg-gray-500"
            >
                Close
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default MatchDetailModal;