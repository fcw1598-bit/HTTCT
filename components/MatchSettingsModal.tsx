import React, { useState, useEffect } from 'react';
import type { Match } from '../types';
import Modal from './Modal';

interface MatchSettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (settings: { newOvers: number; newTarget?: number }) => void;
  match: Match;
}

const MatchSettingsModal: React.FC<MatchSettingsModalProps> = ({ isVisible, onClose, onSave, match }) => {
  const [overs, setOvers] = useState(match.overs);
  const [target, setTarget] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setOvers(match.overs);
      // Initialize target score state when modal becomes visible
      const currentTarget = match.secondInnings?.targetScore ?? (match.innings === 2 ? match.firstInnings.score + 1 : 0);
      setTarget(currentTarget);
    }
  }, [isVisible, match]);

  const handleSave = () => {
    onSave({
      newOvers: overs,
      newTarget: match.innings === 2 ? target : undefined,
    });
  };

  const InputField: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; min?: number; }> = ({ label, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-2 focus:ring-1 focus:ring-cricket-green focus:border-cricket-green transition"
        {...props}
      />
    </div>
  );

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-cricket-green">Match Settings</h3>
            <InputField 
                label="Total Match Overs" 
                type="number" 
                min={1} 
                value={overs} 
                onChange={(e) => setOvers(parseInt(e.target.value, 10))} 
            />
            {match.innings === 2 && (
                 <InputField 
                    label="Target Score (DLS)" 
                    type="number" 
                    min={1} 
                    value={target} 
                    onChange={(e) => setTarget(parseInt(e.target.value, 10))} 
                />
            )}
            <div className="flex justify-end items-center gap-4 pt-4">
                <button 
                    onClick={onClose}
                    className="font-semibold py-2 px-4 rounded-lg transition-colors bg-gray-600 hover:bg-gray-500"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="font-bold py-2 px-4 rounded-lg transition-colors bg-cricket-green hover:bg-green-600"
                >
                    Save Changes
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default MatchSettingsModal;