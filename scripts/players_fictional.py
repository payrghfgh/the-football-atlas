"""Fictional entries.

These are NOT real footballers. They exist so the atlas owner can see their own
record flow through every page, and every one of them is flagged `fictional` in
the dataset so the UI can label it. Nothing here is a claim about a real player.
"""

FICTIONAL = [
    dict(
        id="gurman-singh-bindra",
        name="Gurman Singh Bindra",
        full="Gurman Singh Bindra",
        nat="England", cc="GB", conf="UEFA", pos="RW", sec=["CAM", "ST"],
        dob="2004-04-18", h=180, foot="Right", shirt=7,
        clubs=["Manchester United"],
        goals=108, assists=None, caps=None, intg=None,
        wcg=None, wca=None,
        honours=[],
        attrs=(97, 96, 95, 99, 45, 82), ovr=99, pot=99, sm=5, wf=5,
        wr="High/Medium", styles=["Technical Dribbler", "Speed Dribbler", "Incisive Pass"],
        era="2020s",
        bio=(
            "Gurman Singh Bindra is a fictional footballer, written into the atlas for its owner "
            "rather than drawn from any record. He plays for Manchester United and England, and the "
            "entry exists to show how one record flows through every page: the index, the filters, "
            "the radar, the comparison tool and the rating card. The 99 overall, the 108 career goals "
            "and the ten elasticos are owner-supplied figures for this fictional profile. Nothing on "
            "this page is a claim about a real player."
        ),
        fictional=True,
        signatureSkill={"name": "Elastico", "count": 10},
        ratingSource="Owner-supplied (fictional)",
        ratingEdition="Owner-supplied · fictional",
    ),
]
