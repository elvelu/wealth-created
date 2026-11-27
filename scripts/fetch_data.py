#!/usr/bin/env python3
"""
Fetch live S&P 500 + Nasdaq-100 constituents, match against Forbes Real-Time
Billionaires, enrich matched public companies with live Market Cap, Revenue, and
Employees, and write public/data/wealth-index.json.
"""

from __future__ import annotations

import concurrent.futures
import datetime as dt
import html as htmllib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT_DIR / "public" / "data" / "wealth-index.json"

UA_BROWSER = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
UA_APP = "WealthCreatedApp/1.0 (https://github.com/elvelu/wealth-created)"

# Merge dual-class share families into a single primary ticker so market cap is never double-counted.
TICKER_ALIAS = {
    "GOOG": "GOOGL",
    "BRK.A": "BRK.B",
    "BRK-A": "BRK.B",
    "BRK-B": "BRK.B",
    "FOX": "FOXA",
    "NWS": "NWSA",
}

# Curated attributions for high-signal S&P 500 / Nasdaq-100 builders, founders, executives, and heirs.
# Format: (forbes_uri, ticker) -> dict(role, role_detail, divisor, named, note)
CURATED_ATTRIBUTIONS: dict[tuple[str, str], dict[str, Any]] = {
    # Mega-cap Founders & Builders
    ("jeff-bezos", "AMZN"): {
        "role": "Founder",
        "role_detail": "Founder & Executive Chairman",
        "divisor": 1,
        "named": ["Jeff Bezos"],
        "note": None,
    },
    ("mackenzie-scott", "AMZN"): {
        "role": "Family / Heir",
        "role_detail": "Early Stakeholder & Former Spouse",
        "divisor": 1,
        "named": ["MacKenzie Scott"],
        "note": "Received ~4% of Amazon in 2019 divorce settlement after helping build Amazon in its founding decade.",
    },
    ("elon-musk", "TSLA"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO (led Series A 2004)",
        "divisor": 1,
        "named": ["Elon Musk"],
        "note": "Joined in 2004 Series A alongside Martin Eberhard & Marc Tarpenning; only Forbes-listed Tesla co-founder.",
    },
    ("elon-musk", "SPCX"): {
        "role": "Founder",
        "role_detail": "Founder, CEO & Chief Engineer",
        "divisor": 1,
        "named": ["Elon Musk"],
        "note": None,
    },
    ("gwynne-shotwell", "SPCX"): {
        "role": "Executive / Builder",
        "role_detail": "President & COO",
        "divisor": 1,
        "named": ["Gwynne Shotwell"],
        "note": "Joined SpaceX in 2002 as employee #11 and led commercial operations through public listing.",
    },
    ("thomas-mueller", "SPCX"): {
        "role": "Executive / Builder",
        "role_detail": "Founding Propulsion Engineer",
        "divisor": 1,
        "named": ["Thomas Mueller"],
        "note": "SpaceX founding propulsion chief who architected the Merlin and Raptor rocket engines.",
    },
    ("larry-page", "GOOGL"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (Alphabet / Google)",
        "divisor": 2,
        "named": ["Larry Page", "Sergey Brin"],
        "note": "Class A + Class C shares combined.",
    },
    ("sergey-brin", "GOOGL"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (Alphabet / Google)",
        "divisor": 2,
        "named": ["Larry Page", "Sergey Brin"],
        "note": "Class A + Class C shares combined.",
    },
    ("eric-schmidt", "GOOGL"): {
        "role": "Executive / Builder",
        "role_detail": "Former CEO & Executive Chairman (2001–2015)",
        "divisor": 1,
        "named": ["Eric Schmidt"],
        "note": None,
    },
    ("sundar-pichai", "GOOGL"): {
        "role": "Executive / Builder",
        "role_detail": "CEO, Alphabet & Google",
        "divisor": 1,
        "named": ["Sundar Pichai"],
        "note": None,
    },
    ("mark-zuckerberg", "META"): {
        "role": "Founder",
        "role_detail": "Founder, Chairman & CEO",
        "divisor": 3,
        "named": ["Mark Zuckerberg", "Eduardo Saverin", "Dustin Moskovitz"],
        "note": "Co-Founder Split divides outside equity across the 3 Forbes-listed Meta co-founders.",
    },
    ("eduardo-saverin", "META"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (Meta Platforms)",
        "divisor": 3,
        "named": ["Mark Zuckerberg", "Eduardo Saverin", "Dustin Moskovitz"],
        "note": None,
    },
    ("dustin-moskovitz", "META"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (Meta Platforms)",
        "divisor": 3,
        "named": ["Mark Zuckerberg", "Eduardo Saverin", "Dustin Moskovitz"],
        "note": None,
    },
    ("sheryl-sandberg", "META"): {
        "role": "Executive / Builder",
        "role_detail": "Former COO (2008–2022)",
        "divisor": 1,
        "named": ["Sheryl Sandberg"],
        "note": None,
    },
    ("jensen-huang", "NVDA"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, President & CEO",
        "divisor": 3,
        "named": ["Jensen Huang", "Chris Malachowsky", "Curtis Priem"],
        "note": "Co-founded Nvidia in 1993 with Chris Malachowsky and Curtis Priem (Huang is the sole Forbes-listed co-founder).",
    },
    ("larry-ellison", "ORCL"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, Chairman & CTO",
        "divisor": 1,
        "named": ["Larry Ellison", "Bob Miner", "Ed Oates"],
        "note": "Sole living Forbes-listed Oracle co-founder.",
    },
    ("safra-catz", "ORCL"): {
        "role": "Executive / Builder",
        "role_detail": "CEO, Oracle",
        "divisor": 1,
        "named": ["Safra Catz"],
        "note": None,
    },
    ("bill-gates", "MSFT"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (Microsoft)",
        "divisor": 1,
        "named": ["Bill Gates", "Paul Allen"],
        "note": "Gates has donated or sold ~99% of his original ~45% Microsoft stake into the Gates Foundation and Cascade Investment; only his remaining direct MSFT stake is counted as personal stake.",
    },
    ("steve-ballmer", "MSFT"): {
        "role": "Executive / Builder",
        "role_detail": "Early Employee (#30) & Former CEO (2000–2014)",
        "divisor": 1,
        "named": ["Steve Ballmer"],
        "note": None,
    },
    ("satya-nadella", "MSFT"): {
        "role": "Executive / Builder",
        "role_detail": "Chairman & CEO, Microsoft",
        "divisor": 1,
        "named": ["Satya Nadella"],
        "note": None,
    },
    ("michael-dell", "DELL"): {
        "role": "Founder",
        "role_detail": "Founder, Chairman & CEO",
        "divisor": 1,
        "named": ["Michael Dell"],
        "note": None,
    },
    ("warren-buffett", "BRK.B"): {
        "role": "Executive / Builder",
        "role_detail": "Chairman & Chief Capital Allocator (since 1965)",
        "divisor": 1,
        "named": ["Warren Buffett"],
        "note": "Took control of a struggling textile mill in 1965 and built modern Berkshire Hathaway.",
    },
    ("greg-abel", "BRK.B"): {
        "role": "Executive / Builder",
        "role_detail": "Vice Chairman & CEO-Designate",
        "divisor": 1,
        "named": ["Greg Abel"],
        "note": None,
    },
    ("tim-cook", "AAPL"): {
        "role": "Executive / Builder",
        "role_detail": "CEO, Apple Inc.",
        "divisor": 1,
        "named": ["Tim Cook"],
        "note": None,
    },
    ("laurene-powell-jobs", "AAPL"): {
        "role": "Family / Heir",
        "role_detail": "Widow of Co-Founder Steve Jobs",
        "divisor": 1,
        "named": ["Laurene Powell Jobs"],
        "note": None,
    },
    # Prominent Tech, Finance & Consumer Founders
    ("marc-benioff", "CRM"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, Chair & CEO",
        "divisor": 1,
        "named": ["Marc Benioff", "Parker Harris"],
        "note": None,
    },
    ("reed-hastings", "NFLX"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chairman",
        "divisor": 2,
        "named": ["Reed Hastings", "Marc Randolph"],
        "note": None,
    },
    ("tobi-lutke", "SHOP"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO (Shopify)",
        "divisor": 1,
        "named": ["Tobi Lütke"],
        "note": "Featured on the David Senra Founders podcast episode discussing this wealth-created-for-others thesis.",
    },
    ("brian-chesky", "ABNB"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 3,
        "named": ["Brian Chesky", "Joe Gebbia", "Nathan Blecharczyk"],
        "note": None,
    },
    ("joe-gebbia", "ABNB"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 3,
        "named": ["Brian Chesky", "Joe Gebbia", "Nathan Blecharczyk"],
        "note": None,
    },
    ("nathan-blecharczyk", "ABNB"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chief Strategy Officer",
        "divisor": 3,
        "named": ["Brian Chesky", "Joe Gebbia", "Nathan Blecharczyk"],
        "note": None,
    },
    ("alexander-karp", "PLTR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 4,
        "named": ["Alex Karp", "Peter Thiel", "Stephen Cohen", "Joe Lonsdale"],
        "note": None,
    },
    ("peter-thiel", "PLTR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chairman",
        "divisor": 4,
        "named": ["Alex Karp", "Peter Thiel", "Stephen Cohen", "Joe Lonsdale"],
        "note": None,
    },
    ("stephen-cohen", "PLTR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & President",
        "divisor": 4,
        "named": ["Alex Karp", "Peter Thiel", "Stephen Cohen", "Joe Lonsdale"],
        "note": None,
    },
    ("joe-lonsdale", "PLTR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 4,
        "named": ["Alex Karp", "Peter Thiel", "Stephen Cohen", "Joe Lonsdale"],
        "note": None,
    },
    ("henry-samueli", "AVGO"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chairman (Broadcom)",
        "divisor": 2,
        "named": ["Henry Samueli", "Henry Nicholas III"],
        "note": None,
    },
    ("henry-nicholas-iii", "AVGO"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (Broadcom)",
        "divisor": 2,
        "named": ["Henry Samueli", "Henry Nicholas III"],
        "note": None,
    },
    ("andreas-von-bechtolsheim", "ANET"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chief Development Officer",
        "divisor": 1,
        "named": ["Andy Bechtolsheim", "Kenneth Duda", "David Cheriton"],
        "note": None,
    },
    ("david-cheriton", "ANET"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 2,
        "named": ["Andy Bechtolsheim", "David Cheriton"],
        "note": None,
    },
    ("jayshree-ullal", "ANET"): {
        "role": "Executive / Builder",
        "role_detail": "Chairperson & CEO (since 2008)",
        "divisor": 1,
        "named": ["Jayshree Ullal"],
        "note": None,
    },
    ("george-kurtz", "CRWD"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 1,
        "named": ["George Kurtz"],
        "note": None,
    },
    ("ken-xie", "FTNT"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 2,
        "named": ["Ken Xie", "Michael Xie"],
        "note": None,
    },
    ("michael-xie", "FTNT"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CTO",
        "divisor": 2,
        "named": ["Ken Xie", "Michael Xie"],
        "note": None,
    },
    ("adam-foroughi", "APP"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 3,
        "named": ["Adam Foroughi", "John Krystynak", "Andrew Karam"],
        "note": None,
    },
    ("andrew-karam", "APP"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & VP Product",
        "divisor": 3,
        "named": ["Adam Foroughi", "John Krystynak", "Andrew Karam"],
        "note": None,
    },
    ("john-krystynak", "APP"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 3,
        "named": ["Adam Foroughi", "John Krystynak", "Andrew Karam"],
        "note": None,
    },
    ("olivier-pomel", "DDOG"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 2,
        "named": ["Olivier Pomel", "Alexis Lê-Quôc"],
        "note": None,
    },
    ("alexis-le-quoc", "DDOG"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CTO",
        "divisor": 2,
        "named": ["Olivier Pomel", "Alexis Lê-Quôc"],
        "note": None,
    },
    ("david-duffield", "WDAY"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (Workday)",
        "divisor": 2,
        "named": ["David Duffield", "Aneel Bhusri"],
        "note": None,
    },
    ("aneel-bhusri", "WDAY"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Executive Chair",
        "divisor": 2,
        "named": ["David Duffield", "Aneel Bhusri"],
        "note": None,
    },
    ("thomas-peterffy", "IBKR"): {
        "role": "Founder",
        "role_detail": "Founder & Chairman",
        "divisor": 1,
        "named": ["Thomas Peterffy"],
        "note": "Up-C structure: Peterffy holds ~71% economic interest via private IBG LLC units (~$81B); public Class A float (~$34B) is smaller than his combined economic stake, so reported Market Cap reflects public Class A shares.",
    },
    ("charles-simonyi", "MSFT"): {
        "role": "Executive / Builder",
        "role_detail": "Chief Architect of Microsoft Office (joined 1981)",
        "divisor": 1,
        "named": ["Charles Simonyi"],
        "note": None,
    },
    ("marissa-mayer", "GOOGL"): {
        "role": "Executive / Builder",
        "role_detail": "Early Employee (#20) & Former VP, Google",
        "divisor": 1,
        "named": ["Marissa Mayer"],
        "note": None,
    },
    ("larry-culp", "GE"): {
        "role": "Executive / Builder",
        "role_detail": "Chairman & CEO (led GE turnaround & spin-offs)",
        "divisor": 1,
        "named": ["Larry Culp"],
        "note": None,
    },
    ("larry-culp", "GEV"): {
        "role": "Executive / Builder",
        "role_detail": "Former Parent CEO (GE Vernova spin-off)",
        "divisor": 1,
        "named": ["Larry Culp"],
        "note": None,
    },
    ("nikesh-arora", "PANW"): {
        "role": "Executive / Builder",
        "role_detail": "Chairman & CEO (since 2018)",
        "divisor": 1,
        "named": ["Nikesh Arora"],
        "note": None,
    },
    ("hamilton-james", "BX"): {
        "role": "Executive / Builder",
        "role_detail": "Former President & Executive Vice Chair",
        "divisor": 1,
        "named": ["Hamilton James"],
        "note": None,
    },
    ("jeff-skoll", "EBAY"): {
        "role": "Executive / Builder",
        "role_detail": "First President & Employee #2",
        "divisor": 1,
        "named": ["Jeff Skoll"],
        "note": None,
    },
    ("greg-brown", "MSI"): {
        "role": "Executive / Builder",
        "role_detail": "Chairman & CEO, Motorola Solutions",
        "divisor": 1,
        "named": ["Greg Brown"],
        "note": None,
    },
    ("roy-vagelos", "REGN"): {
        "role": "Executive / Builder",
        "role_detail": "Former Chairman (helped scale Regeneron)",
        "divisor": 1,
        "named": ["Roy Vagelos"],
        "note": None,
    },
    ("joseph-bae", "KKR"): {
        "role": "Executive / Builder",
        "role_detail": "Co-CEO, KKR",
        "divisor": 1,
        "named": ["Joseph Bae"],
        "note": None,
    },
    ("scott-nuttall", "KKR"): {
        "role": "Executive / Builder",
        "role_detail": "Co-CEO, KKR",
        "divisor": 1,
        "named": ["Scott Nuttall"],
        "note": None,
    },
    ("michael-intrator", "CRWV"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO (CoreWeave)",
        "divisor": 3,
        "named": ["Michael Intrator", "Brian Venturo", "Brannin McBee"],
        "note": None,
    },
    ("brian-venturo", "CRWV"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chief Strategy Officer",
        "divisor": 3,
        "named": ["Michael Intrator", "Brian Venturo", "Brannin McBee"],
        "note": None,
    },
    ("brannin-mcbee", "CRWV"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chief Development Officer",
        "divisor": 3,
        "named": ["Michael Intrator", "Brian Venturo", "Brannin McBee"],
        "note": None,
    },
    ("charles-schwab", "SCHW"): {
        "role": "Founder",
        "role_detail": "Founder & Co-Chairman",
        "divisor": 1,
        "named": ["Charles Schwab"],
        "note": None,
    },
    ("phil-knight", "NKE"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chairman Emeritus",
        "divisor": 1,
        "named": ["Phil Knight", "Bill Bowerman"],
        "note": None,
    },
    ("howard-schultz", "SBUX"): {
        "role": "Executive / Builder",
        "role_detail": "Builder & Former Chairman / CEO",
        "divisor": 1,
        "named": ["Howard Schultz"],
        "note": "Joined Starbucks in 1982 and scaled it globally after buying it from the original founders in 1987.",
    },
    ("arthur-blank", "HD"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (The Home Depot)",
        "divisor": 2,
        "named": ["Arthur Blank", "Ken Langone"],
        "note": "Bernie Marcus passed in 2024; Arthur Blank and early co-founder/backer Ken Langone appear on the live list.",
    },
    ("ken-langone", "HD"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Lead Backer",
        "divisor": 2,
        "named": ["Arthur Blank", "Ken Langone"],
        "note": None,
    },
    ("stephen-schwarzman", "BX"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, Chairman & CEO",
        "divisor": 1,
        "named": ["Stephen Schwarzman", "Pete Peterson"],
        "note": None,
    },
    ("jonathan-gray", "BX"): {
        "role": "Executive / Builder",
        "role_detail": "President & COO",
        "divisor": 1,
        "named": ["Jonathan Gray"],
        "note": None,
    },
    ("larry-fink", "BLK"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, Chairman & CEO",
        "divisor": 1,
        "named": ["Larry Fink"],
        "note": None,
    },
    ("henry-kravis", "KKR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Co-Executive Chairman",
        "divisor": 2,
        "named": ["Henry Kravis", "George Roberts"],
        "note": None,
    },
    ("george-roberts", "KKR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Co-Executive Chairman",
        "divisor": 2,
        "named": ["Henry Kravis", "George Roberts"],
        "note": None,
    },
    ("leon-black", "APO"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 3,
        "named": ["Leon Black", "Marc Rowan", "Josh Harris"],
        "note": None,
    },
    ("marc-rowan", "APO"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 3,
        "named": ["Leon Black", "Marc Rowan", "Josh Harris"],
        "note": None,
    },
    ("josh-harris", "APO"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 3,
        "named": ["Leon Black", "Marc Rowan", "Josh Harris"],
        "note": None,
    },
    ("jamie-dimon", "JPM"): {
        "role": "Executive / Builder",
        "role_detail": "Chairman & CEO",
        "divisor": 1,
        "named": ["Jamie Dimon"],
        "note": None,
    },
    ("lisa-su", "AMD"): {
        "role": "Executive / Builder",
        "role_detail": "Chair & CEO (turned around AMD since 2014)",
        "divisor": 1,
        "named": ["Lisa Su"],
        "note": None,
    },
    ("brian-armstrong", "COIN"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 2,
        "named": ["Brian Armstrong", "Fred Ehrsam"],
        "note": None,
    },
    ("fred-ehrsam", "COIN"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 2,
        "named": ["Brian Armstrong", "Fred Ehrsam"],
        "note": None,
    },
    ("vlad-tenev", "HOOD"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 2,
        "named": ["Vlad Tenev", "Baiju Bhatt"],
        "note": None,
    },
    ("baiju-bhatt", "HOOD"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 2,
        "named": ["Vlad Tenev", "Baiju Bhatt"],
        "note": None,
    },
    ("tony-xu", "DASH"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 3,
        "named": ["Tony Xu", "Andy Fang", "Stanley Tang"],
        "note": None,
    },
    ("andy-fang", "DASH"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 3,
        "named": ["Tony Xu", "Andy Fang", "Stanley Tang"],
        "note": None,
    },
    ("stanley-tang", "DASH"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 3,
        "named": ["Tony Xu", "Andy Fang", "Stanley Tang"],
        "note": None,
    },
    ("colin-huang", "PDD"): {
        "role": "Founder",
        "role_detail": "Founder",
        "divisor": 1,
        "named": ["Colin Huang"],
        "note": None,
    },
    ("marcos-galperin", "MELI"): {
        "role": "Founder",
        "role_detail": "Founder & Executive Chairman",
        "divisor": 1,
        "named": ["Marcos Galperin"],
        "note": None,
    },
    ("pierre-omidyar", "EBAY"): {
        "role": "Founder",
        "role_detail": "Founder",
        "divisor": 1,
        "named": ["Pierre Omidyar"],
        "note": None,
    },
    ("meg-whitman", "EBAY"): {
        "role": "Executive / Builder",
        "role_detail": "Former CEO (1998–2008)",
        "divisor": 1,
        "named": ["Meg Whitman"],
        "note": None,
    },
    ("jack-dorsey", "XYZ"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Block Head",
        "divisor": 2,
        "named": ["Jack Dorsey", "Jim McKelvey"],
        "note": None,
    },
    ("jim-mckelvey", "XYZ"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 2,
        "named": ["Jack Dorsey", "Jim McKelvey"],
        "note": None,
    },
    ("stephane-bancel", "MRNA"): {
        "role": "Executive / Builder",
        "role_detail": "CEO (led Moderna since 2011)",
        "divisor": 1,
        "named": ["Stéphane Bancel"],
        "note": None,
    },
    ("noubar-afeyan", "MRNA"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chairman",
        "divisor": 2,
        "named": ["Noubar Afeyan", "Robert Langer"],
        "note": None,
    },
    ("robert-langer", "MRNA"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 2,
        "named": ["Noubar Afeyan", "Robert Langer"],
        "note": None,
    },
    ("leonard-schleifer", "REGN"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, President & CEO",
        "divisor": 2,
        "named": ["Leonard Schleifer", "George Yancopoulos"],
        "note": None,
    },
    ("george-yancopoulos", "REGN"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, President & CSO",
        "divisor": 2,
        "named": ["Leonard Schleifer", "George Yancopoulos"],
        "note": None,
    },
    ("charles-liang", "SMCI"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, President & CEO",
        "divisor": 1,
        "named": ["Charles Liang"],
        "note": None,
    },
    ("rick-smith", "AXON"): {
        "role": "Founder",
        "role_detail": "Founder & CEO",
        "divisor": 1,
        "named": ["Rick Smith"],
        "note": None,
    },
    ("richard-fairbank", "COF"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, Chairman & CEO",
        "divisor": 1,
        "named": ["Richard Fairbank"],
        "note": None,
    },
    ("scott-cook", "INTU"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 1,
        "named": ["Scott Cook"],
        "note": None,
    },
    ("tom-golisano", "PAYX"): {
        "role": "Founder",
        "role_detail": "Founder",
        "divisor": 1,
        "named": ["Tom Golisano"],
        "note": None,
    },
    ("richard-kinder", "KMI"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Executive Chairman",
        "divisor": 1,
        "named": ["Richard Kinder"],
        "note": None,
    },
    ("thomas-frist-jr", "HCA"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (HCA Healthcare)",
        "divisor": 1,
        "named": ["Thomas Frist Jr."],
        "note": None,
    },
    ("ralph-lauren", "RL"): {
        "role": "Founder",
        "role_detail": "Founder, Executive Chairman & CCO",
        "divisor": 1,
        "named": ["Ralph Lauren"],
        "note": None,
    },
    ("rodney-sacks", "MNST"): {
        "role": "Co-Founder",
        "role_detail": "Co-Builder & Former Co-CEO",
        "divisor": 2,
        "named": ["Rodney Sacks", "Hilton Schlosberg"],
        "note": None,
    },
    ("hilton-schlosberg", "MNST"): {
        "role": "Co-Founder",
        "role_detail": "Co-Builder & CEO",
        "divisor": 2,
        "named": ["Rodney Sacks", "Hilton Schlosberg"],
        "note": None,
    },
    ("richard-schulze", "BBY"): {
        "role": "Founder",
        "role_detail": "Founder",
        "divisor": 1,
        "named": ["Richard Schulze"],
        "note": None,
    },
    ("johnelle-hunt", "JBHT"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder (J.B. Hunt)",
        "divisor": 1,
        "named": ["Johnelle Hunt"],
        "note": None,
    },
    ("willis-johnson", "CPRT"): {
        "role": "Founder",
        "role_detail": "Founder",
        "divisor": 1,
        "named": ["Willis Johnson"],
        "note": None,
    },
    ("a-jayson-adair", "CPRT"): {
        "role": "Executive / Builder",
        "role_detail": "Executive Chairman & Former CEO",
        "divisor": 1,
        "named": ["Jayson Adair"],
        "note": None,
    },
    ("ernest-garcia-ii", "CVNA"): {
        "role": "Co-Founder",
        "role_detail": "Early Backer & Father of Co-Founder",
        "divisor": 2,
        "named": ["Ernest Garcia II", "Ernest Garcia III"],
        "note": None,
    },
    ("ernest-garcia-iii", "CVNA"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & CEO",
        "divisor": 2,
        "named": ["Ernest Garcia II", "Ernest Garcia III"],
        "note": None,
    },
    ("michael-saylor", "MSTR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Executive Chairman",
        "divisor": 1,
        "named": ["Michael Saylor"],
        "note": None,
    },
    ("steven-rales", "DHR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Chairman",
        "divisor": 2,
        "named": ["Steven Rales", "Mitchell Rales"],
        "note": None,
    },
    ("mitchell-rales", "DHR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder",
        "divisor": 2,
        "named": ["Steven Rales", "Mitchell Rales"],
        "note": None,
    },
    ("min-kao", "GRMN"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder & Executive Chairman",
        "divisor": 1,
        "named": ["Min Kao", "Gary Burrell"],
        "note": None,
    },
    ("michael-hsing", "MPWR"): {
        "role": "Co-Founder",
        "role_detail": "Co-Founder, President & CEO",
        "divisor": 1,
        "named": ["Michael Hsing"],
        "note": None,
    },
    ("alan-miller-1", "UHS"): {
        "role": "Founder",
        "role_detail": "Founder & Executive Chairman",
        "divisor": 1,
        "named": ["Alan Miller"],
        "note": None,
    },
    # Prominent Family / Heirs (included cleanly under "All Index Billionaires")
    ("rob-walton", "WMT"): {
        "role": "Family / Heir",
        "role_detail": "Son of Founder Sam Walton",
        "divisor": 1,
        "named": ["Rob Walton"],
        "note": None,
    },
    ("jim-walton", "WMT"): {
        "role": "Family / Heir",
        "role_detail": "Son of Founder Sam Walton",
        "divisor": 1,
        "named": ["Jim Walton"],
        "note": None,
    },
    ("alice-walton", "WMT"): {
        "role": "Family / Heir",
        "role_detail": "Daughter of Founder Sam Walton",
        "divisor": 1,
        "named": ["Alice Walton"],
        "note": None,
    },
    ("lukas-walton", "WMT"): {
        "role": "Family / Heir",
        "role_detail": "Grandson of Founder Sam Walton",
        "divisor": 1,
        "named": ["Lukas Walton"],
        "note": None,
    },
    ("christy-walton", "WMT"): {
        "role": "Family / Heir",
        "role_detail": "Walton Family Heir",
        "divisor": 1,
        "named": ["Christy Walton"],
        "note": None,
    },
    ("nancy-walton-laurie", "WMT"): {
        "role": "Family / Heir",
        "role_detail": "Niece of Founder Sam Walton",
        "divisor": 1,
        "named": ["Nancy Walton Laurie"],
        "note": None,
    },
    ("ann-walton-kroenke", "WMT"): {
        "role": "Family / Heir",
        "role_detail": "Niece of Founder Sam Walton",
        "divisor": 1,
        "named": ["Ann Walton Kroenke"],
        "note": None,
    },
    ("rupert-murdoch", "FOXA"): {
        "role": "Executive / Builder",
        "role_detail": "Founder-Builder & Chairman Emeritus",
        "divisor": 1,
        "named": ["Rupert Murdoch"],
        "note": None,
    },
    ("rupert-murdoch", "NWSA"): {
        "role": "Executive / Builder",
        "role_detail": "Founder-Builder & Chairman Emeritus",
        "divisor": 1,
        "named": ["Rupert Murdoch"],
        "note": None,
    },
}

# Explicit exclusions where Forbes links a ticker via M&A rollover, passive portfolio, or data quirk.
EXPLICIT_EXCLUSIONS: dict[tuple[str, str], str] = {
    ("aman-sanger", "SPCX"): "Forbes API data artifact; Cursor AI co-founder (not SpaceX).",
    ("arvid-lunnemark", "SPCX"): "Forbes API data artifact; Cursor AI co-founder (not SpaceX).",
    ("michael-truell", "SPCX"): "Forbes API data artifact; Cursor AI co-founder (not SpaceX).",
    ("sualeh-asif", "SPCX"): "Forbes API data artifact; Cursor AI co-founder (not SpaceX).",
    ("michael-dell", "AVGO"): "Shares received from Broadcom's 2023 acquisition of VMware; passive/rollover equity.",
    ("larry-ellison", "TSLA"): "Early board member & investor stake, not a founder/operator of Tesla.",
    ("larry-ellison", "SPCX"): "Passive minority investment in SpaceX.",
    ("peter-thiel", "SPCX"): "Founders Fund venture investment in SpaceX.",
    ("luke-nosek", "SPCX"): "Founders Fund venture investment in SpaceX.",
    ("ron-baron", "SPCX"): "Asset management / fund holding in SpaceX.",
    ("ron-baron", "TSLA"): "Asset management / fund holding in Tesla.",
    ("jack-dorsey", "SPCX"): "Minority investor stake in SpaceX.",
    ("andreas-von-bechtolsheim", "GOOGL"): "Early angel check ($100K in 1998) — not a Google founder/operator.",
    ("nicole-shanahan", "GOOGL"): "Divorce settlement stake; not an Alphabet founder or executive.",
    ("john-doerr", "GOOGL"): "Venture capital investment (Kleiner Perkins).",
    ("john-doerr", "AMZN"): "Venture capital investment (Kleiner Perkins).",
    ("vinod-khosla", "GOOGL"): "Venture capital investment.",
    ("kavitark-ram-shriram", "GOOGL"): "Early angel/board investor stake.",
    ("bill-gates", "BRK.B"): "Cascade Investment / personal portfolio holding.",
    ("bill-gates", "DE"): "Cascade Investment portfolio holding.",
    ("bill-gates", "ECL"): "Cascade Investment portfolio holding.",
    ("bill-gates", "RSG"): "Cascade Investment portfolio holding.",
    ("bill-gates", "WM"): "Cascade Investment portfolio holding.",
    ("melinda-french-gates", "DE"): "Portfolio holding.",
    ("melinda-french-gates", "WM"): "Portfolio holding.",
    ("rupert-murdoch", "DIS"): "Equity received from Disney's 2019 acquisition of 21st Century Fox.",
    ("rupert-murdoch", "TSLA"): "Minority portfolio holding.",
    ("laurene-powell-jobs", "DIS"): "Shares inherited from Steve Jobs's 2006 sale of Pixar to Disney.",
    ("george-lucas", "DIS"): "Shares received from Disney's 2012 acquisition of Lucasfilm.",
    ("chris-wanstrath", "MSFT"): "Shares received from Microsoft's 2018 acquisition of GitHub.",
    ("reid-hoffman", "MSFT"): "Shares received from Microsoft's 2016 acquisition of LinkedIn.",
    ("christopher-stolte", "CRM"): "Shares received from Salesforce's 2019 acquisition of Tableau.",
    ("christian-chabot", "CRM"): "Shares received from Salesforce's 2019 acquisition of Tableau.",
    ("patrick-hanrahan", "CRM"): "Shares received from Salesforce's 2019 acquisition of Tableau.",
    ("stewart-butterfield", "CRM"): "Shares received from Salesforce's 2021 acquisition of Slack.",
    ("dan-kurzius", "INTU"): "Shares received from Intuit's 2021 acquisition of Mailchimp.",
    ("ben-chestnut", "INTU"): "Shares received from Intuit's 2021 acquisition of Mailchimp.",
    ("ty-warner", "AAPL"): "Passive personal investment portfolio holding.",
    ("ryan-cohen", "AAPL"): "Passive personal investment portfolio holding.",
    ("karen-pritzker", "AAPL"): "Passive personal investment portfolio holding.",
    ("mark-stevens", "NVDA"): "Venture capital / early board investor (Sequoia).",
    ("tench-coxe", "NVDA"): "Venture capital / early board investor (Sutter Hill).",
    ("harvey-jones", "NVDA"): "Early board investor stake.",
    ("j-joe-ricketts", "SCHW"): "Shares received from Charles Schwab's 2020 acquisition of TD Ameritrade.",
    ("keith-dunleavy", "SPCX"): "Inovalon founder; SpaceX stake is a minority/artifact holding.",
    ("leo-koguan", "TSLA"): "Individual public market investor in Tesla, not a founder or executive.",
    ("herbert-wertheim", "GE"): "Passive personal investment portfolio holding.",
    ("james-clark", "AAPL"): "Passive personal investment portfolio holding (Netscape/SGI founder).",
    ("james-clark", "PLTR"): "Early venture/angel investor stake, not a Palantir founder.",
    ("jan-koum", "META"): "Shares received from Meta's 2014 acquisition of WhatsApp.",
    ("david-zalik", "GS"): "Shares received from Goldman Sachs's 2021 acquisition of GreenSky.",
    ("scot-french", "BLK"): "Shares received from BlackRock's acquisition of HPS Investment Partners.",
    ("adebayo-ogunlesi", "BLK"): "Shares received from BlackRock's 2024 acquisition of Global Infrastructure Partners.",
    ("scott-kapnick", "BLK"): "Shares received from BlackRock's acquisition of HPS Investment Partners.",
    ("marcelo-claure", "TMUS"): "Shares received from T-Mobile's 2020 merger with Sprint.",
    ("larry-ellison", "SKYD"): "Father of Skydance founder David Ellison; investor stake.",
    ("david-geffen", "T"): "Passive investment portfolio holding.",
    ("jay-z", "UBER"): "Minority investor stake.",
    ("steven-udvar-hazy", "SO"): "Passive investment portfolio holding.",
    ("john-doerr", "DASH"): "Venture capital investment (Kleiner Perkins).",
    ("vinod-khosla", "DASH"): "Venture capital investment.",
    ("leonid-boguslavsky", "DDOG"): "Venture capital investment (RTP Global).",
    ("tench-coxe", "P"): "Venture capital investment (Sutter Hill).",
    ("mark-pincus", "TTWO"): "Shares received from Take-Two's 2022 acquisition of Zynga.",
    ("pierre-omidyar", "PYPL"): "Spinoff/early stake via eBay's 2002 acquisition of PayPal.",
    ("timothy-springer", "MRNA"): "Early angel investor & Harvard professor, not a Moderna founder.",
    ("jack-cogen", "CRWV"): "Early investor/advisor stake in CoreWeave.",
    ("art-levinson", "AAPL"): "Independent board chair (since 2011) & early investor; not an Apple founder or operating executive.",
    ("art-levinson", "GOOGL"): "Board director / early investor stake, not an Alphabet founder or executive.",
}

# Known VC/PE/passive investor words in Forbes `source` that shouldn't auto-attribute unrelated S&P 500 companies.
PASSIVE_SOURCE_HINTS = (
    "investments",
    "venture capital",
    "money management",
    "hedge fund",
    "private equity",
    "real estate",
    "liquor",
    "beer",
    "wedding dresses",
    "plush toys",
    "star wars",
    "music",
)


def fetch_text(url: str, ua: str = UA_BROWSER, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "ignore")


def normalize_ticker(sym: str) -> str:
    s = sym.upper().strip()
    if s.endswith("-US"):
        s = s[:-3]
    return TICKER_ALIAS.get(s, s)


def parse_compact_number(raw: str) -> float | None:
    if not raw:
        return None
    s = raw.strip().replace(",", "").replace("$", "")
    if s in ("-", "—", "N/A", "n/a", ""):
        return None
    mult = 1.0
    if s.endswith("T"):
        mult = 1e12
        s = s[:-1]
    elif s.endswith("B"):
        mult = 1e9
        s = s[:-1]
    elif s.endswith("M"):
        mult = 1e6
        s = s[:-1]
    elif s.endswith("K"):
        mult = 1e3
        s = s[:-1]
    try:
        return float(s) * mult
    except ValueError:
        return None


def fetch_index_universe() -> tuple[dict[str, dict[str, Any]], dict[str, int]]:
    """Fetch S&P 500 and Nasdaq-100 lists and Wikipedia company metadata."""
    print("[1/5] Fetching S&P 500 & Nasdaq-100 constituents...")

    def parse_sa_list(url: str) -> dict[str, dict[str, Any]]:
        page = fetch_text(url)
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", page, re.S)
        out: dict[str, dict[str, Any]] = {}
        for row in rows[1:]:
            cells = [
                re.sub(r"<[^>]+>", "", htmllib.unescape(c)).strip()
                for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
            ]
            if len(cells) >= 7:
                raw_sym = cells[1].strip().upper()
                norm = normalize_ticker(raw_sym)
                mcap = parse_compact_number(cells[6])
                try:
                    price = float(cells[4].replace(",", ""))
                except ValueError:
                    price = None
                if norm not in out or raw_sym == norm:
                    out[norm] = {
                        "ticker": norm,
                        "name": cells[2].strip(),
                        "price": price,
                        "market_cap": mcap,
                    }
        return out

    sp_map = parse_sa_list("https://stockanalysis.com/list/sp-500-stocks/")
    ndx_map = parse_sa_list("https://stockanalysis.com/list/nasdaq-100-stocks/")

    # Enrich with Wikipedia S&P 500 metadata (Sector, Sub-Industry, HQ, Founded)
    wiki_meta: dict[str, dict[str, Any]] = {}
    try:
        wiki_html = fetch_text(
            "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies", ua=UA_APP
        )
        m = re.search(r'<table[^>]*id="constituents"[^>]*>(.*?)</table>', wiki_html, re.S)
        if m:
            for row in re.findall(r"<tr[^>]*>(.*?)</tr>", m.group(1), re.S)[1:]:
                cells = [
                    re.sub(r"<[^>]+>", "", htmllib.unescape(c)).strip()
                    for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.S)
                ]
                if len(cells) >= 8:
                    nt = normalize_ticker(cells[0])
                    founded_match = re.search(r"(1[789]\d{2}|20[0-2]\d)", cells[7])
                    wiki_meta[nt] = {
                        "name": cells[1],
                        "sector": cells[2],
                        "sub_industry": cells[3],
                        "headquarters": cells[4],
                        "cik": cells[6],
                        "founded_year": int(founded_match.group(1)) if founded_match else None,
                    }
    except Exception as exc:
        print(f"  Warning: Wikipedia metadata fetch failed ({exc}); continuing with StockAnalysis.")

    universe: dict[str, dict[str, Any]] = {}
    all_tickers = sorted(set(sp_map.keys()) | set(ndx_map.keys()))
    for t in all_tickers:
        in_sp = t in sp_map
        in_ndx = t in ndx_map
        indices: list[str] = []
        if in_sp:
            indices.append("S&P 500")
        if in_ndx:
            indices.append("Nasdaq-100")
        base = sp_map.get(t) or ndx_map.get(t) or {}
        wm = wiki_meta.get(t, {})
        universe[t] = {
            "ticker": t,
            "name": wm.get("name") or base.get("name") or t,
            "indices": indices,
            "in_both": in_sp and in_ndx,
            "price": base.get("price"),
            "market_cap": base.get("market_cap"),
            "sector": wm.get("sector") or "",
            "sub_industry": wm.get("sub_industry") or "",
            "headquarters": wm.get("headquarters") or "",
            "cik": wm.get("cik") or "",
            "founded_year": wm.get("founded_year"),
        }

    counts = {
        "sp500Count": len(sp_map),
        "nasdaq100Count": len(ndx_map),
        "overlapCount": len(set(sp_map.keys()) & set(ndx_map.keys())),
        "uniqueCompaniesCount": len(universe),
    }
    print(
        f"  -> S&P 500: {counts['sp500Count']}, Nasdaq-100: {counts['nasdaq100Count']}, "
        f"Overlap: {counts['overlapCount']}, Unique Union: {counts['uniqueCompaniesCount']}"
    )
    return universe, counts


def fetch_forbes_rtb() -> tuple[list[dict[str, Any]], str | None]:
    """Fetch full Forbes Real-Time Billionaires list via paginated calls."""
    print("[2/5] Fetching live Forbes Real-Time Billionaires...")
    persons: list[dict[str, Any]] = []
    forbes_ts: str | None = None
    for start in range(0, 4000, 500):
        url = f"https://www.forbes.com/forbesapi/person/rtb/0/position/true.json?limit=500&start={start}"
        for attempt in range(3):
            try:
                data = json.loads(fetch_text(url, ua=UA_BROWSER, timeout=25))
                plist = data.get("personList", {})
                if not forbes_ts and plist.get("personsLists"):
                    ts_ms = plist["personsLists"][0].get("timestamp")
                    if ts_ms:
                        forbes_ts = dt.datetime.fromtimestamp(
                            ts_ms / 1000, tz=dt.timezone.utc
                        ).isoformat()
                chunk = plist.get("personsLists", [])
                if not chunk:
                    print(f"  -> Reached end at {len(persons)} billionaires.")
                    return persons, forbes_ts
                persons.extend(chunk)
                break
            except Exception as exc:
                if attempt == 2:
                    print(f"  Warning: Forbes page start={start} failed ({exc}); stopping pagination.")
                    return persons, forbes_ts
                time.sleep(1.0 * (attempt + 1))
    return persons, forbes_ts


def clean_company_tokens(name: str) -> list[str]:
    cleaned = re.sub(
        r"\b(inc|corp|corporation|company|co|holdings|group|technologies|technology|platforms|systems|international|limited|ltd|plc|sa|nv|class [abc])\b",
        " ",
        name.lower(),
    )
    tokens = [t for t in re.findall(r"[a-z0-9]{4,}", cleaned)]
    return tokens


def classify_match(
    person: dict[str, Any],
    ticker: str,
    company_name: str,
    stake_usd: float,
) -> tuple[bool, str, str, int, list[str], str | None, str | None]:
    """
    Decide whether (person, ticker) is a true builder/founder/heir attribution or should be excluded.
    Returns: (include, role, role_detail, divisor, named, note, exclude_reason)
    """
    uri = person.get("uri") or ""
    if (uri, ticker) in EXPLICIT_EXCLUSIONS:
        return (False, "", "", 1, [], None, "passive_investment")

    if (uri, ticker) in CURATED_ATTRIBUTIONS:
        c = CURATED_ATTRIBUTIONS[(uri, ticker)]
        return (
            True,
            c["role"],
            c["role_detail"],
            c["divisor"],
            c["named"],
            c["note"],
            None,
        )

    worth_usd = (person.get("finalWorth") or 0) * 1e6
    source_str = (person.get("source") or "").lower()
    bio_text = " ".join(
        [source_str]
        + [b.lower() for b in (person.get("bios") or [])]
        + [a.lower() for a in (person.get("abouts") or [])]
    )

    tokens = clean_company_tokens(company_name)
    name_mentioned = any(tok in bio_text for tok in tokens) or (ticker.lower() in bio_text)
    stake_ratio = (stake_usd / worth_usd) if worth_usd > 0 else 0.0

    # Filter out passive investors / M&A / minor portfolio holdings
    is_passive_source = any(hint in source_str for hint in PASSIVE_SOURCE_HINTS)
    if not name_mentioned and (is_passive_source or stake_ratio < 0.35):
        return (False, "", "", 1, [], None, "passive_investment")

    # Also filter tiny incidental stakes (<$100M or <5% of net worth) if not clearly linked
    if stake_usd < 50e6 or (stake_ratio < 0.05 and not name_mentioned):
        return (False, "", "", 1, [], None, "passive_investment")

    self_made = person.get("selfMade") is True
    sm_rank = person.get("selfMadeRank")
    is_heir_text = any(
        kw in bio_text
        for kw in (
            "inherited",
            "heir",
            "son of",
            "daughter of",
            "grandson",
            "granddaughter",
            "widow",
            "widower",
            "founded by his father",
            "founded by her father",
            "founded by his grandfather",
            "late husband",
            "divorce",
        )
    )

    if not self_made or is_heir_text or (sm_rank is not None and sm_rank <= 5):
        return (True, "Family / Heir", "Family Stakeholder / Heir", 1, [person.get("personName", "")], None, None)

    # Require same-sentence co-occurrence of company token (or ticker) + founding verb so founders of
    # OTHER companies (e.g. WhatsApp/Netscape/Tableau) are never mislabeled as founders of AAPL/META/CRM.
    sentences = re.split(r"[.;\n]+", bio_text)
    is_cofounder = False
    is_founder = False
    for sent in sentences:
        has_company = any(tok in sent for tok in tokens) or bool(re.search(rf"\b{re.escape(ticker.lower())}\b", sent))
        if not has_company:
            continue
        if any(kw in sent for kw in ("cofound", "co-found", "co-created", "cofounder")):
            is_cofounder = True
        elif any(kw in sent for kw in ("founded", "founder", "started", "launched")):
            is_founder = True

    if is_cofounder:
        return (True, "Co-Founder", "Co-Founder", 1, [person.get("personName", "")], None, None)
    if is_founder:
        return (True, "Founder", "Founder", 1, [person.get("personName", "")], None, None)

    return (
        True,
        "Executive / Builder",
        "Executive / Significant Builder",
        1,
        [person.get("personName", "")],
        None,
        None,
    )


def enrich_company_stockanalysis(ticker: str, fallback: dict[str, Any]) -> dict[str, Any]:
    """Fetch Market Cap, Revenue (ttm), Employees, Sector, Industry, Founded from StockAnalysis."""
    slug = ticker.lower().replace(".", "-")
    # StockAnalysis uses brk.b -> brk.b directly for some dots, check both
    candidates = [ticker.lower()]
    if "." in ticker:
        candidates.append(slug)

    html = ""
    for cand in candidates:
        try:
            html = fetch_text(f"https://stockanalysis.com/stocks/{cand}/", ua=UA_BROWSER, timeout=15)
            if "Market Cap" in html:
                break
        except Exception:
            continue

    mcap = fallback.get("market_cap")
    revenue = None
    employees = None
    founded = fallback.get("founded_year")
    sector = fallback.get("sector") or ""
    sub_industry = fallback.get("sub_industry") or ""

    if html:
        m_mcap = re.search(
            r"Market Cap</a>.*?<td[^>]*>\s*([0-9.,]+[TBMK]?)", html, re.S
        )
        if m_mcap:
            parsed = parse_compact_number(m_mcap.group(1))
            if parsed and parsed > 1e8:
                mcap = parsed

        m_rev = re.search(
            r"Revenue \(ttm\)</a>.*?<td[^>]*>\s*([0-9.,]+[TBMK]?)", html, re.S
        )
        if m_rev:
            revenue = parse_compact_number(m_rev.group(1))

        m_emp = re.search(
            r'Employees</span>.*?<a[^>]*>([0-9,]+)</a>', html, re.S
        )
        if not m_emp:
            m_emp = re.search(r"Employees</td><td[^>]*>\s*([0-9,]+)", html, re.S)
        if m_emp:
            try:
                employees = int(m_emp.group(1).replace(",", ""))
            except ValueError:
                pass

    # Fetch /company/ only if missing sector or founded year or employees
    if (not sector or not founded or not employees) and candidates:
        for cand in candidates:
            try:
                chtml = fetch_text(
                    f"https://stockanalysis.com/stocks/{cand}/company/", ua=UA_BROWSER, timeout=12
                )
                if not founded:
                    mf = re.search(r"Founded</td><td[^>]*>\s*(\d{4})", chtml)
                    if mf:
                        founded = int(mf.group(1))
                if not sector:
                    ms = re.search(r"Sector</td><td[^>]*>.*?<a[^>]*>([^<]+)</a>", chtml, re.S)
                    if ms:
                        sector = htmllib.unescape(ms.group(1)).strip()
                if not sub_industry:
                    mi = re.search(r"Industry</td><td[^>]*>.*?<a[^>]*>([^<]+)</a>", chtml, re.S)
                    if mi:
                        sub_industry = htmllib.unescape(mi.group(1)).strip()
                if not employees:
                    me = re.search(r"Employees</td><td[^>]*>\s*([0-9,]+)", chtml)
                    if me:
                        employees = int(me.group(1).replace(",", ""))
                break
            except Exception:
                continue

    return {
        "market_cap": mcap,
        "revenue": revenue,
        "employees": employees,
        "founded_year": founded,
        "sector": sector or "Public Equity",
        "sub_industry": sub_industry or sector or "Public Company",
    }


def fetch_wikimedia_portrait(name: str) -> str | None:
    """Fallback portrait lookup via Wikipedia REST summary API when Forbes lacks an image."""
    clean_name = re.sub(r"\s*&\s*family$", "", name, flags=re.I).strip()
    slug = urllib.parse.quote(clean_name.replace(" ", "_"))
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{slug}"
    try:
        data = json.loads(fetch_text(url, ua=UA_APP, timeout=8))
        thumb = (data.get("thumbnail") or {}).get("source")
        if thumb and not any(bad in thumb.lower() for bad in ("flag", "logo", "icon")):
            return thumb
    except Exception:
        pass
    return None


def main() -> int:
    universe, counts = fetch_index_universe()
    persons, forbes_ts = fetch_forbes_rtb()

    print("[3/5] Matching Forbes billionaires to S&P 500 & Nasdaq-100 companies...")
    preliminary_people: list[dict[str, Any]] = []
    matched_tickers: set[str] = set()

    for p in persons:
        uri = p.get("uri") or ""
        name = p.get("personName") or p.get("name") or ""
        if not uri or not name:
            continue

        # Aggregate public index holdings and track non-index / private / excluded holdings
        by_ticker: dict[str, dict[str, Any]] = {}
        excluded: list[dict[str, Any]] = []

        for asset in p.get("financialAssets") or []:
            raw_t = (asset.get("ticker") or "").strip()
            comp_name = (asset.get("companyName") or raw_t or "Private Holding").strip()
            shares = asset.get("numberOfShares") or 0.0
            price = asset.get("sharePrice") or asset.get("currentPrice") or 0.0
            exch_rate = asset.get("exchangeRate") or 1.0
            val_usd = float(shares) * float(price) / (float(exch_rate) if exch_rate else 1.0)

            norm_t = normalize_ticker(raw_t) if raw_t.endswith("-US") else ""
            if norm_t and norm_t in universe:
                entry = by_ticker.setdefault(
                    norm_t,
                    {
                        "shares": 0.0,
                        "stake_usd": 0.0,
                        "share_price": float(price) if price else None,
                    },
                )
                entry["shares"] += float(shares)
                entry["stake_usd"] += val_usd
                if not entry["share_price"] and price:
                    entry["share_price"] = float(price)
            else:
                if val_usd >= 250e6:
                    is_private = (asset.get("exchange") is None) or (not raw_t)
                    excluded.append(
                        {
                            "companyName": comp_name,
                            "ticker": raw_t[:-3] if raw_t.endswith("-US") else (raw_t or None),
                            "estimatedValueUsd": round(val_usd),
                            "reason": "private_company" if is_private else "non_index_public",
                            "explanation": (
                                "Private or non-U.S. index holding excluded from S&P 500 / Nasdaq-100 calculation."
                            ),
                        }
                    )

        if not by_ticker:
            continue

        kept_assets: list[dict[str, Any]] = []
        for t, agg in by_ticker.items():
            comp = universe[t]
            include, role, role_detail, divisor, named, note, excl_reason = classify_match(
                p, t, comp["name"], agg["stake_usd"]
            )
            if include:
                kept_assets.append(
                    {
                        "ticker": t,
                        "shares": agg["shares"],
                        "stake_usd": agg["stake_usd"],
                        "share_price": agg["share_price"],
                        "role": role,
                        "role_detail": role_detail,
                        "divisor": divisor,
                        "named": named,
                        "note": note,
                    }
                )
                matched_tickers.add(t)
            else:
                if agg["stake_usd"] >= 100e6:
                    excluded.append(
                        {
                            "companyName": comp["name"],
                            "ticker": t,
                            "estimatedValueUsd": round(agg["stake_usd"]),
                            "reason": excl_reason or "passive_investment",
                            "explanation": EXPLICIT_EXCLUSIONS.get(
                                (uri, t),
                                "Passive portfolio or M&A rollover stake; not attributed as founding wealth creation.",
                            ),
                        }
                    )

        if kept_assets:
            preliminary_people.append(
                {
                    "person": p,
                    "kept_assets": kept_assets,
                    "excluded": sorted(excluded, key=lambda x: x["estimatedValueUsd"], reverse=True)[:8],
                }
            )

    print(
        f"  -> Matched {len(preliminary_people)} builders/stakeholders across {len(matched_tickers)} unique companies."
    )

    print(f"[4/5] Enriching {len(matched_tickers)} matched companies with live fundamentals...")
    enriched_companies: dict[str, dict[str, Any]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        future_map = {
            pool.submit(enrich_company_stockanalysis, t, universe[t]): t
            for t in sorted(matched_tickers)
        }
        for fut in concurrent.futures.as_completed(future_map):
            t = future_map[fut]
            try:
                enriched_companies[t] = fut.result()
            except Exception as exc:
                print(f"  Warning: failed enriching {t}: {exc}")
                enriched_companies[t] = {
                    "market_cap": universe[t].get("market_cap"),
                    "revenue": None,
                    "employees": None,
                    "founded_year": universe[t].get("founded_year"),
                    "sector": universe[t].get("sector") or "Public Equity",
                    "sub_industry": universe[t].get("sub_industry") or "Public Company",
                }

    # Build final PersonEntry records & resolve missing portraits for top founders via Wikipedia
    print("[5/5] Computing Wealth Created for Others, rankings, and portraits...")
    people_records: list[dict[str, Any]] = []

    # Pre-compute combined founders stake per company so co-founder split subtracts combined stakes cleanly
    company_founder_stakes: dict[str, float] = {}
    for item in preliminary_people:
        for ka in item["kept_assets"]:
            if ka["role"] in ("Founder", "Co-Founder"):
                t = ka["ticker"]
                company_founder_stakes[t] = company_founder_stakes.get(t, 0.0) + ka["stake_usd"]

    for item in preliminary_people:
        p = item["person"]
        uri = p.get("uri")
        name = p.get("personName") or p.get("name")
        sq_img = p.get("squareImage") or ""
        has_forbes_img = bool(p.get("imageExists")) and bool(sq_img) and ("no-pic" not in sq_img.lower())
        if has_forbes_img and sq_img.startswith("//"):
            sq_img = "https:" + sq_img
        portrait_url = sq_img if has_forbes_img else None
        portrait_source = "forbes" if has_forbes_img else None

        attributions: list[dict[str, Any]] = []
        for ka in item["kept_assets"]:
            t = ka["ticker"]
            u = universe[t]
            e = enriched_companies[t]
            mcap = e.get("market_cap") or u.get("market_cap")
            if not mcap or mcap <= 0:
                continue

            personal_stake = min(ka["stake_usd"], mcap)
            wealth_others = max(0.0, mcap - personal_stake)
            ownership_pct = (personal_stake / mcap) * 100.0 if mcap > 0 else 0.0
            divisor = max(1, int(ka["divisor"]))

            if divisor > 1 and ka["role"] in ("Founder", "Co-Founder"):
                combined_stake = min(company_founder_stakes.get(t, personal_stake), mcap)
                split_wealth = max(0.0, (mcap - combined_stake) / divisor)
                split_stake = personal_stake
            else:
                split_wealth = wealth_others
                split_stake = personal_stake

            multiplier = (wealth_others / personal_stake) if personal_stake > 0 else 0.0

            attributions.append(
                {
                    "ticker": t,
                    "companyName": u["name"],
                    "indices": u["indices"],
                    "inBoth": u["in_both"],
                    "sector": e.get("sector") or "Public Equity",
                    "subIndustry": e.get("sub_industry") or "Public Company",
                    "headquarters": u.get("headquarters") or "",
                    "foundedYear": e.get("founded_year"),
                    "role": ka["role"],
                    "roleDetail": ka["role_detail"],
                    "coFounderDivisor": divisor,
                    "coFoundersNamed": ka["named"],
                    "marketCapUsd": round(mcap),
                    "revenueUsd": round(e["revenue"]) if e.get("revenue") else None,
                    "employees": e.get("employees"),
                    "sharePriceUsd": round(ka["share_price"], 2) if ka.get("share_price") else u.get("price"),
                    "personalShares": round(ka["shares"]) if ka.get("shares") else None,
                    "personalStakeUsd": round(personal_stake),
                    "ownershipPct": round(ownership_pct, 2),
                    "wealthCreatedForOthersUsd": round(wealth_others),
                    "coFounderSplitWealthUsd": round(split_wealth),
                    "coFounderSplitStakeUsd": round(split_stake),
                    "wealthMultiplier": round(multiplier, 2),
                    "dataSources": ["Forbes RTB", "StockAnalysis", "Wikipedia"],
                    "note": ka["note"],
                }
            )

        if not attributions:
            continue

        attributions.sort(key=lambda a: a["wealthCreatedForOthersUsd"], reverse=True)
        primary_role = attributions[0]["role"]
        # Prefer Founder/Co-Founder as primaryRole if any attribution is Founder/Co-Founder
        for a in attributions:
            if a["role"] in ("Founder", "Co-Founder"):
                primary_role = a["role"]
                break

        total_mcap = sum(a["marketCapUsd"] for a in attributions)
        total_stake = sum(a["personalStakeUsd"] for a in attributions)
        total_created_full = sum(a["wealthCreatedForOthersUsd"] for a in attributions)
        total_created_split = sum(a["coFounderSplitWealthUsd"] for a in attributions)
        total_employees = sum((a["employees"] or 0) for a in attributions)
        total_revenue = sum((a["revenueUsd"] or 0) for a in attributions)

        people_records.append(
            {
                "uri": uri,
                "name": name,
                "forbesRank": int(p.get("rank") or 9999),
                "wealthRankFull": 0,
                "wealthRankSplit": 0,
                "rankDeltaFull": 0,
                "rankDeltaSplit": 0,
                "forbesNetWorthUsd": round((p.get("finalWorth") or 0) * 1e6),
                "portraitUrl": portrait_url,
                "portraitSource": portrait_source,
                "country": p.get("countryOfCitizenship") or "",
                "city": p.get("city") or "",
                "sourceLabel": p.get("source") or "",
                "industries": p.get("industries") or [],
                "selfMade": p.get("selfMade"),
                "selfMadeRank": p.get("selfMadeRank"),
                "philanthropyScore": p.get("philanthropyScore"),
                "bios": p.get("bios") or [],
                "abouts": p.get("abouts") or [],
                "primaryRole": primary_role,
                "isFounder": primary_role in ("Founder", "Co-Founder"),
                "isBuilder": primary_role in ("Founder", "Co-Founder", "Executive / Builder"),
                "attributions": attributions,
                "totalMarketCapAttributedUsd": total_mcap,
                "totalPersonalStakeUsd": total_stake,
                "totalWealthCreatedFullUsd": total_created_full,
                "totalWealthCreatedSplitUsd": total_created_split,
                "aggregateMultiplierFull": round(total_created_full / total_stake, 2) if total_stake > 0 else 0.0,
                "aggregateMultiplierSplit": round(total_created_split / total_stake, 2) if total_stake > 0 else 0.0,
                "totalEmployees": total_employees,
                "totalRevenueUsd": total_revenue,
                "excludedHoldings": item["excluded"],
            }
        )

    # Sort & assign ranks (full and split)
    people_records.sort(key=lambda r: r["totalWealthCreatedFullUsd"], reverse=True)
    for idx, rec in enumerate(people_records, start=1):
        rec["wealthRankFull"] = idx
        rec["rankDeltaFull"] = rec["forbesRank"] - idx

    split_sorted = sorted(people_records, key=lambda r: r["totalWealthCreatedSplitUsd"], reverse=True)
    for idx, rec in enumerate(split_sorted, start=1):
        rec["wealthRankSplit"] = idx
        rec["rankDeltaSplit"] = rec["forbesRank"] - idx

    # Wikimedia portrait enrichment for top 35 builders missing a Forbes portrait (e.g. Jensen Huang, Tobi Lutke)
    missing_portrait_targets = [
        r for r in people_records[:45] if not r["portraitUrl"]
    ][:30]
    if missing_portrait_targets:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            fmap = {pool.submit(fetch_wikimedia_portrait, r["name"]): r for r in missing_portrait_targets}
            for fut in concurrent.futures.as_completed(fmap):
                rec = fmap[fut]
                url = fut.result()
                if url:
                    rec["portraitUrl"] = url
                    rec["portraitSource"] = "wikimedia"

    # Compute unique matched company totals
    seen_company_mcap: dict[str, int] = {}
    seen_company_emp: dict[str, int] = {}
    for r in people_records:
        for a in r["attributions"]:
            seen_company_mcap[a["ticker"]] = a["marketCapUsd"]
            if a["employees"]:
                seen_company_emp[a["ticker"]] = a["employees"]

    payload = {
        "summary": {
            **counts,
            "forbesBillionairesScanned": len(persons),
            "matchedPeopleCount": len(people_records),
            "foundersCount": sum(1 for r in people_records if r["isFounder"]),
            "buildersCount": sum(1 for r in people_records if r["isBuilder"]),
            "matchedCompaniesCount": len(seen_company_mcap),
            "totalUniqueMarketCapUsd": sum(seen_company_mcap.values()),
            "totalUniqueEmployees": sum(seen_company_emp.values()),
            "generatedAt": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
            "forbesTimestamp": forbes_ts,
        },
        "people": people_records,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size // 1024} KB)")
    print(
        f"Summary: {payload['summary']['matchedPeopleCount']} people "
        f"({payload['summary']['foundersCount']} founders, {payload['summary']['buildersCount']} builders), "
        f"{payload['summary']['matchedCompaniesCount']} unique companies"
    )
    print("\nTop 15 Founders by Public Wealth Created for Others:")
    founders_only = [r for r in people_records if r["isFounder"]]
    for i, r in enumerate(founders_only[:15], start=1):
        tickers = ",".join(a["ticker"] for a in r["attributions"])
        print(
            f"  {i:2d}. {r['name']:24s} | {tickers:10s} | Created=${r['totalWealthCreatedFullUsd']/1e12:5.2f}T "
            f"| Kept=${r['totalPersonalStakeUsd']/1e9:6.1f}B | {r['aggregateMultiplierFull']:5.1f}x "
            f"| Jobs={r['totalEmployees']:,} | img={r['portraitSource']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
