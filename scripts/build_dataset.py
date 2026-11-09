#!/usr/bin/env python3
"""Builds the Atlas JSON dataset from the Python source records.

Run:  python3 scripts/build_dataset.py

Output (all committed, all server-readable):
  src/data/players.json
  src/data/countries.json
  src/data/clubs.json
  src/data/tournaments.json
  src/data/meta.json

Every derived number is deterministic (seeded by the player id) so rebuilding
the file never shuffles the site.
"""

import json
import random
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from players_gk_def import GK_DEF  # noqa: E402
from players_mid import MIDS  # noqa: E402
from players_fw import FWS  # noqa: E402
from players_fictional import FICTIONAL  # noqa: E402
from tournaments import TOURNAMENTS  # noqa: E402
from metadata import COUNTRIES, CLUBS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data"
SNAPSHOT = "2026-11-05"
RATING_EDITION = "Atlas model v1"

PLAYERS_RAW = GK_DEF + MIDS + FWS + FICTIONAL

# Country-code overrides where the "nationality" label differs from the flag.
FLAG_OVERRIDES = {"Northern Ireland": "GB", "England": "GB", "Soviet Union": "RU"}


def slugify(value: str) -> str:
    value = value.lower().replace("’", "").replace("'", "")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def build_goals_breakdown(player, goals):
    """A deterministic, clearly-labelled estimate of how the goals were scored.

    Never presented as an official breakdown: the UI prints
    "Estimated (Atlas model)" next to this chart.
    """
    if not goals:
        return None
    rng = random.Random(player["id"])
    shooting = player["attributes"]["shooting"]
    physical = player["attributes"]["physical"]
    header_share = 0.10 + (physical / 100) * 0.14 + rng.uniform(-0.02, 0.02)
    pen_share = 0.07 + rng.uniform(0, 0.05)
    fk_share = 0.03 + (shooting / 100) * 0.05 + rng.uniform(-0.01, 0.01)
    header = round(goals * header_share)
    pen = round(goals * pen_share)
    fk = round(goals * fk_share)
    open_play = max(goals - header - pen - fk, 0)
    left_share = 0.70 if player["preferredFoot"] == "Left" else 0.26
    left = round(goals * left_share)
    return {
        "openPlay": open_play,
        "header": header,
        "penalty": pen,
        "freeKick": fk,
        "leftFoot": left,
        "rightFoot": goals - left,
    }


def normalise_player(raw):
    player = {
        "id": raw["id"],
        "name": raw["name"],
        "fullName": raw["full"],
        "photoUrl": None,
        "nationality": raw["nat"],
        "countryCode": FLAG_OVERRIDES.get(raw["nat"], raw["cc"]),
        "confederation": raw["conf"],
        "position": raw["pos"],
        "secondaryPositions": raw["sec"],
        "dateOfBirth": raw["dob"],
        "heightCm": raw["h"],
        "preferredFoot": raw["foot"],
        "shirtNumber": raw["shirt"],
        "clubs": raw["clubs"],
        "careerGoals": raw["goals"],
        "careerAssists": raw["assists"],
        "internationalCaps": raw["caps"],
        "internationalGoals": raw["intg"],
        "worldCupGoals": raw["wcg"],
        "worldCupAppearances": raw["wca"],
        "honours": raw["honours"],
        "attributes": {
            "pace": raw["attrs"][0],
            "shooting": raw["attrs"][1],
            "passing": raw["attrs"][2],
            "dribbling": raw["attrs"][3],
            "defending": raw["attrs"][4],
            "physical": raw["attrs"][5],
        },
        "overall": raw["ovr"],
        "potential": raw["pot"],
        "skillMoves": raw["sm"],
        "weakFoot": raw["wf"],
        "workRate": raw["wr"],
        "playStyles": raw["styles"],
        "era": raw["era"],
        "bio": raw["bio"],
        "isFictional": bool(raw.get("fictional", False)),
        "signatureSkill": raw.get("signatureSkill"),
        # Provenance. `ratingSource` is "Atlas model v1" for every player in this
        # snapshot — see /about. Set it to "EA FC 25" only with a licensed feed.
        "ratingSource": raw.get("ratingSource", "Atlas model v1"),
        "ratingEdition": raw.get("ratingEdition", RATING_EDITION),
        "dataNote": (
            "Fictional entry: every figure here was supplied by the atlas owner and describes no real player."
            if raw.get("fictional")
            else "Career totals per public records; attributes are an Atlas model estimate."
        ),
    }
    player["goalsBreakdown"] = build_goals_breakdown(player, player["careerGoals"])
    player["bio"] = player["bio"].strip() if player["isFictional"] else pad_bio(player)
    return player


def pad_bio(player):
    """Bios must run 60-120 words. Where the written bio is short, close it with
    a sentence built only from this player's own recorded numbers — no new
    claims, no invented detail."""
    bio = player["bio"].strip()
    if len(bio.split()) >= 60:
        return bio
    rng = random.Random(player["id"] + "-bio")
    clubs = player["clubs"]
    club_phrase = clubs[0] if len(clubs) == 1 else f"{clubs[0]} and {clubs[-1]}"
    caps = player["internationalCaps"]
    intg = player["internationalGoals"]
    goals = player["careerGoals"]
    wca = player["worldCupAppearances"]
    nat = player["nationality"]
    options = [
        f"Across his career he turned out for clubs including {club_phrase}, finishing with {caps} caps and {intg} goals for {nat}.",
        f"His record stands at {goals} career goals, {caps} caps for {nat} and {wca} World Cup appearances.",
        f"In total he played for {len(clubs)} clubs, won {len(player['honours'])} senior honours and scored {goals} goals.",
        f"He ended with {intg} international goals in {caps} appearances for {nat}, having played at {wca} World Cup matches.",
    ]
    extra = options[rng.randrange(len(options))]
    words = bio.split()
    if len(words) + len(extra.split()) > 120:
        extra = options[0]
    return f"{bio} {extra}"


def validate(players):
    problems = []
    seen = set()
    for p in players:
        if p["id"] in seen:
            problems.append(f"duplicate id {p['id']}")
        seen.add(p["id"])
        words = len(p["bio"].split())
        if not 55 <= words <= 125:
            problems.append(f"{p['id']}: bio is {words} words (expected 60-120)")
        for key, value in p["attributes"].items():
            if not 0 <= value <= 99:
                problems.append(f"{p['id']}: attribute {key}={value}")
        if not p["honours"] and not p["isFictional"]:
            problems.append(f"{p['id']}: no honours")
        if p["potential"] < p["overall"] - 1:
            problems.append(f"{p['id']}: potential below overall")
    return problems


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    players = [normalise_player(raw) for raw in PLAYERS_RAW]
    players.sort(key=lambda p: p["name"].split()[-1])

    problems = validate(players)
    if problems:
        print("Validation problems:")
        for problem in problems:
            print("  -", problem)

    # ---- countries -------------------------------------------------------
    by_country = {}
    for player in players:
        by_country.setdefault(player["nationality"], []).append(player)

    tournaments = []
    for t in TOURNAMENTS:
        tournaments.append({
            "id": str(t["year"]),
            "year": t["year"],
            "host": t["host"],
            "hostCodes": t["hostCodes"],
            "winner": t["winner"],
            "winnerCode": t["winnerCode"],
            "runnerUp": t["runnerUp"],
            "runnerUpCode": t["runnerUpCode"],
            "finalScore": t["finalScore"],
            "topScorer": t["topScorer"],
            "topScorerGoals": t["topScorerGoals"],
            "topScorerCode": t["topScorerCode"],
            "goldenBall": t["goldenBall"],
            "teams": t["teams"],
            "matches": t["matches"],
            "totalGoals": t["totalGoals"],
            "attendance": t["attendance"],
            "status": t["status"],
            "moment": t["moment"],
        })

    countries = []
    for name, squad in by_country.items():
        meta = COUNTRIES.get(name, {})
        titles = [t["year"] for t in tournaments if t["winner"] == name]
        countries.append({
            "id": slugify(name),
            "name": name,
            "code": meta.get("code", squad[0]["countryCode"]),
            "confederation": meta.get("confederation", squad[0]["confederation"]),
            "fifaRank": None,
            "wcTitles": meta.get("wcTitles", len(titles)),
            "wcTitleYears": titles,
            "wcAppearances": meta.get("wcAppearances"),
            "bestFinish": meta.get("bestFinish"),
            "wcRecord": None,  # not in this snapshot — rendered as "—"
            "squadIds": [p["id"] for p in sorted(squad, key=lambda p: -p["overall"])],
            "topScorerIds": [
                p["id"] for p in sorted(squad, key=lambda p: -(p["internationalGoals"] or 0))[:5]
            ],
        })
    countries.sort(key=lambda c: c["name"])

    # ---- clubs -----------------------------------------------------------
    club_squads = {}
    for player in players:
        for club in player["clubs"]:
            club_squads.setdefault(club, []).append(player)

    clubs = []
    for name, squad in club_squads.items():
        meta = CLUBS.get(name, {})
        honours = []
        if meta.get("ucl"):
            honours.append(
                f"{meta['ucl']}× European Cup / UEFA Champions League"
            )
        if meta.get("note"):
            honours.append(meta["note"])
        clubs.append({
            "id": slugify(name),
            "name": name,
            "countryCode": meta.get("country", "GB"),
            "honours": honours,
            "squadIds": [p["id"] for p in sorted(squad, key=lambda p: -p["overall"])],
        })
    clubs.sort(key=lambda c: c["name"])

    # ---- meta ------------------------------------------------------------
    positions = sorted({p["position"] for p in players})
    eras = sorted({p["era"] for p in players})
    confederations = sorted({p["confederation"] for p in players})
    meta = {
        "snapshotDate": SNAPSHOT,
        "builtOn": date.today().isoformat(),
        "ratingEdition": RATING_EDITION,
        "counts": {
            "players": len(players),
            "countries": len(countries),
            "clubs": len(clubs),
            "tournaments": len(tournaments),
            "playedTournaments": len([t for t in tournaments if t["status"] == "played"]),
            "cancelledTournaments": len([t for t in tournaments if t["status"] == "cancelled"]),
            "worldCupGoals": sum(p["worldCupGoals"] or 0 for p in players),
            "fictionalPlayers": len([p for p in players if p["isFictional"]]),
        },
        "scope": {
            "definition": "Every player who appeared in a FIFA World Cup squad from 1930 to 2022, plus a 2026 qualified/anticipated pool and current top-flight internationals.",
            "shipped": len(players),
            "target": 4812,
            "fictionalNote": "One record — Gurman Singh Bindra — is a fictional entry supplied by the site's owner. It is flagged as fictional everywhere it appears and is not part of the defined scope.",
            "statement": "This build ships a curated editorial subset of the defined scope. No player has been removed silently: the count shown on the Players page is the count in this file, and the gap to the full scope is stated in the UI and on the About page.",
        },
        "positions": positions,
        "eras": eras,
        "confederations": confederations,
        "dataGaps": [
            "FIFA world ranking — no ranking feed in this snapshot",
            "Country World Cup played/won/drawn/lost and goals for/against",
            "Season-by-season club statistics",
            "Total attendance for pre-1950 and several later editions",
            "Player photographs — photoUrl is null, so the UI renders a monogram avatar",
            "Individual 2026 World Cup tallies — the tournament record is complete, but player career totals were recorded before the 2026 edition and are not folded in",
            "Country appearance counts are through 2022; the full 2026 field is not in this snapshot",
        ],
    }

    def dump(name, payload):
        path = OUT / name
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n")
        print(f"wrote {path.relative_to(ROOT)}  ({len(json.dumps(payload))//1024} KB)")

    dump("players.json", players)
    dump("countries.json", countries)
    dump("clubs.json", clubs)
    dump("tournaments.json", tournaments)
    dump("meta.json", meta)
    print(f"{len(players)} players · {len(countries)} countries · {len(clubs)} clubs · {len(tournaments)} tournaments")


if __name__ == "__main__":
    main()
