import players from "@/data/players.json";
import countries from "@/data/countries.json";
import clubs from "@/data/clubs.json";
import tournaments from "@/data/tournaments.json";
import metaJson from "@/data/meta.json";

export type Attributes = {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

export type Player = {
  id: string;
  name: string;
  fullName: string;
  photoUrl: string | null;
  nationality: string;
  countryCode: string;
  confederation: string;
  position: string;
  secondaryPositions: string[];
  dateOfBirth: string;
  heightCm: number;
  preferredFoot: string;
  shirtNumber: number;
  clubs: string[];
  careerGoals: number | null;
  careerAssists: number | null;
  internationalCaps: number | null;
  internationalGoals: number | null;
  worldCupGoals: number | null;
  worldCupAppearances: number | null;
  honours: string[];
  attributes: Attributes;
  overall: number;
  potential: number;
  skillMoves: number;
  weakFoot: number;
  workRate: string;
  playStyles: string[];
  era: string;
  bio: string;
  ratingSource: string;
  ratingEdition: string;
  dataNote: string;
  isFictional: boolean;
  signatureSkill: { name: string; count: number } | null;
  goalsBreakdown: {
    openPlay: number;
    header: number;
    penalty: number;
    freeKick: number;
    leftFoot: number;
    rightFoot: number;
  } | null;
};

export type Country = {
  id: string;
  name: string;
  code: string;
  confederation: string;
  fifaRank: number | null;
  wcTitles: number;
  wcTitleYears: number[];
  wcAppearances: number | null;
  bestFinish: string | null;
  wcRecord: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  } | null;
  squadIds: string[];
  topScorerIds: string[];
};

export type Club = {
  id: string;
  name: string;
  countryCode: string;
  honours: string[];
  squadIds: string[];
};

export type Tournament = {
  id: string;
  year: number;
  host: string;
  hostCodes: string[];
  winner: string | null;
  winnerCode: string | null;
  runnerUp: string | null;
  runnerUpCode: string | null;
  finalScore: string | null;
  topScorer: string | null;
  topScorerGoals: number | null;
  topScorerCode: string | null;
  goldenBall: string | null;
  teams: number | null;
  matches: number | null;
  totalGoals: number | null;
  attendance: number | null;
  status: "played" | "cancelled" | "upcoming";
  moment: string;
};

export type Meta = typeof metaJson;

export const allPlayers = players as Player[];
export const allCountries = countries as Country[];
export const allClubs = clubs as Club[];
export const allTournaments = (tournaments as Tournament[]).slice().sort((a, b) => a.year - b.year);
export const meta = metaJson as Meta;

export const playerById = new Map(allPlayers.map((p) => [p.id, p]));
export const countryById = new Map(allCountries.map((c) => [c.id, c]));
export const clubById = new Map(allClubs.map((c) => [c.id, c]));
export const tournamentByYear = new Map(allTournaments.map((t) => [t.year, t]));

export function getPlayer(id: string): Player | undefined {
  return playerById.get(id);
}

export function getCountry(id: string): Country | undefined {
  return countryById.get(id);
}

export function getClub(id: string): Club | undefined {
  return clubById.get(id);
}

export function playersOf(ids: string[]): Player[] {
  return ids.map((id) => playerById.get(id)).filter((p): p is Player => Boolean(p));
}

export function similarPlayers(player: Player, limit = 4): Player[] {
  const keys: (keyof Attributes)[] = [
    "pace",
    "shooting",
    "passing",
    "dribbling",
    "defending",
    "physical",
  ];
  return allPlayers
    .filter((other) => other.id !== player.id)
    .map((other) => {
      const distance = keys.reduce(
        (sum, key) => sum + Math.abs(other.attributes[key] - player.attributes[key]),
        0
      );
      const positionBonus =
        other.position === player.position
          ? 0
          : other.secondaryPositions.includes(player.position) ||
            player.secondaryPositions.includes(other.position)
          ? 8
          : 20;
      return { other, score: distance + positionBonus + Math.abs(other.overall - player.overall) };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((entry) => entry.other);
}

export type SearchEntry = {
  id: string;
  kind: "player" | "country" | "club" | "tournament";
  title: string;
  subtitle: string;
  href: string;
  code?: string;
  rank?: number;
};

export function searchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const player of allPlayers) {
    entries.push({
      id: `player-${player.id}`,
      kind: "player",
      title: player.name,
      subtitle: `${player.position} · ${player.nationality} · ${player.era}${
        player.isFictional ? " · fictional" : ""
      }`,
      href: `/players/${player.id}`,
      code: player.countryCode,
      rank: player.overall,
    });
  }
  for (const country of allCountries) {
    entries.push({
      id: `country-${country.id}`,
      kind: "country",
      title: country.name,
      subtitle: `${country.confederation} · ${country.wcTitles} World Cup${country.wcTitles === 1 ? "" : "s"}`,
      href: `/countries/${country.id}`,
      code: country.code,
    });
  }
  for (const club of allClubs) {
    entries.push({
      id: `club-${club.id}`,
      kind: "club",
      title: club.name,
      subtitle: `${club.squadIds.length} player${club.squadIds.length === 1 ? "" : "s"} in the atlas`,
      href: `/clubs/${club.id}`,
      code: club.countryCode,
    });
  }
  for (const tournament of allTournaments) {
    entries.push({
      id: `tournament-${tournament.id}`,
      kind: "tournament",
      title: `${tournament.year} World Cup`,
      subtitle:
        tournament.status === "cancelled"
          ? "Cancelled"
          : tournament.status === "upcoming"
          ? `${tournament.host} · upcoming`
          : `${tournament.host} · ${tournament.winner}`,
      href: `/timeline?year=${tournament.year}`,
    });
  }
  return entries;
}
