import type { Match, PlayerProfile, Team, Tournament } from '../types';

const MATCH_HISTORY_KEY = 'cricket_match_history';
const TEAMS_KEY = 'cricket_teams';
const PLAYER_PROFILES_KEY = 'cricket_player_profiles';
const TOURNAMENTS_KEY = 'cricket_tournaments';

// Match History
export const getMatchHistory = (): Match[] => {
    try {
        const historyJson = localStorage.getItem(MATCH_HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error("Failed to parse match history:", error);
        localStorage.removeItem(MATCH_HISTORY_KEY);
        return [];
    }
};

export const saveMatch = (match: Match): void => {
    const history = getMatchHistory();
    const existingIndex = history.findIndex(m => m.id === match.id);
    if (existingIndex > -1) {
        history[existingIndex] = match;
    } else {
        history.push(match);
    }
    localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(history));
};

export const saveMatchHistory = (matches: Match[]): void => {
    try {
        localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(matches));
    } catch (error) {
        console.error("Failed to save match history:", error);
    }
};

// Teams
export const getRegisteredTeams = (): Team[] => {
    try {
        const teamsJson = localStorage.getItem(TEAMS_KEY);
        return teamsJson ? JSON.parse(teamsJson) : [];
    } catch (error) {
        console.error("Failed to parse teams:", error);
        localStorage.removeItem(TEAMS_KEY);
        return [];
    }
};

export const saveRegisteredTeams = (teams: Team[]): void => {
    try {
        localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
    } catch (error) {
        console.error("Failed to save teams:", error);
    }
};

// Player Profiles
export const getPlayerProfiles = (): PlayerProfile[] => {
    try {
        const profilesJson = localStorage.getItem(PLAYER_PROFILES_KEY);
        return profilesJson ? JSON.parse(profilesJson) : [];
    } catch (error) {
        console.error("Failed to parse player profiles:", error);
        localStorage.removeItem(PLAYER_PROFILES_KEY);
        return [];
    }
};

export const savePlayerProfiles = (profiles: PlayerProfile[]): void => {
    try {
        localStorage.setItem(PLAYER_PROFILES_KEY, JSON.stringify(profiles));
    } catch (error) {
        console.error("Failed to save player profiles:", error);
    }
};

// Tournaments
export const getTournaments = (): Tournament[] => {
    try {
        const tournamentsJson = localStorage.getItem(TOURNAMENTS_KEY);
        return tournamentsJson ? JSON.parse(tournamentsJson) : [];
    } catch (error) {
        console.error("Failed to parse tournaments:", error);
        localStorage.removeItem(TOURNAMENTS_KEY);
        return [];
    }
};

export const saveTournaments = (tournaments: Tournament[]): void => {
    try {
        localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
    } catch (error) {
        console.error("Failed to save tournaments:", error);
    }
};
