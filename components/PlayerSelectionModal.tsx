import React, { useState, useMemo } from 'react';
import type { Team, Player } from '../types';
import { CustomSelect, type CustomSelectOption } from './Modal';

interface PlayerSelectionModalProps {
    title: string;
    onConfirm: (...args: any[]) => void;
    battingTeam?: Team;
    bowlingTeam?: Team;
    needsBowler: boolean;
    striker?: string | null;
    nonStriker?: string | null;
    currentBowler?: string | null;
    excludeIds?: string[];
};

const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
    title,
    onConfirm,
    battingTeam,
    bowlingTeam,
    needsBowler,
    striker,
    nonStriker,
    currentBowler,
    excludeIds = []
}) => {
    const [selectedStriker, setSelectedStriker] = useState(striker || '');
    const [selectedNonStriker, setSelectedNonStriker] = useState(nonStriker || '');
    const [selectedBowler, setSelectedBowler] = useState('');

    const availableBatsmen = useMemo(() => {
        return battingTeam?.players.filter((p: Player) => !battingTeam.battingStats[p.id]?.isOut && !excludeIds.includes(p.id)) || [];
    }, [battingTeam, excludeIds]);
    
    const availableBowlers = useMemo(() => {
        return bowlingTeam?.players.filter((p: Player) => p.id !== currentBowler) || [];
    }, [bowlingTeam, currentBowler]);
    
    const isConfirmDisabled = () => {
        if (needsBowler && !selectedBowler) return true;
        if (battingTeam) {
            if (!selectedStriker) return true;
            // Case for openers where non-striker also needs to be selected
            if (!nonStriker && !selectedNonStriker) return true;
            if (selectedStriker === selectedNonStriker && selectedNonStriker) return true;
        }
        return false;
    }

    const confirmSelection = () => {
        if (title.includes("Openers")) {
            onConfirm(selectedStriker, selectedNonStriker, selectedBowler);
        } else if (title.includes("Batsman")) {
             onConfirm(selectedStriker);
        } else if (title.includes("Bowler")) {
            onConfirm(selectedBowler);
        }
    };
    
    const mapPlayersToOptions = (players: Player[]): CustomSelectOption[] => {
        return players.map(p => ({
            id: p.id,
            name: p.name,
            image: p.photo,
            description: p.role,
        }));
    };

    const batsmenOptions = useMemo(() => mapPlayersToOptions(availableBatsmen), [availableBatsmen]);
    const bowlerOptions = useMemo(() => mapPlayersToOptions(availableBowlers), [availableBowlers]);

    const renderLabel = (defaultText: string) => (
        <label className="block text-sm font-medium text-gray-300 mb-1">{defaultText}</label>
    );

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <div className="space-y-4">
                {battingTeam && (
                    <>
                         <div>
                            {renderLabel(nonStriker ? "New Batsman" : "Striker")}
                            <CustomSelect
                                placeholder={nonStriker ? "Select New Batsman" : "Select Striker"}
                                options={batsmenOptions.filter(p => p.id !== selectedNonStriker)}
                                value={selectedStriker}
                                onChange={setSelectedStriker}
                                type="player"
                            />
                        </div>
                        {!nonStriker && (
                            <div>
                                {renderLabel("Non-Striker")}
                                <CustomSelect
                                    placeholder="Select Non-Striker"
                                    options={batsmenOptions.filter(p => p.id !== selectedStriker)}
                                    value={selectedNonStriker}
                                    onChange={setSelectedNonStriker}
                                    type="player"
                                />
                            </div>
                        )}
                    </>
                )}
                {needsBowler && bowlingTeam && (
                    <div>
                        {renderLabel("Bowler")}
                        <CustomSelect
                            placeholder="Select Bowler"
                            options={bowlerOptions}
                            value={selectedBowler}
                            onChange={setSelectedBowler}
                            type="player"
                        />
                    </div>
                )}
            </div>
            <div className="mt-6 text-right">
                <button onClick={confirmSelection} disabled={isConfirmDisabled()} className="bg-cricket-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition">Confirm</button>
            </div>
        </div>
    );
};

export default PlayerSelectionModal;