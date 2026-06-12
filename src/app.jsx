import { useState, useEffect, useRef } from "react";

// localStorage-backed storage (web build)
const appStorage = {
  async get(key) {
    const v = localStorage.getItem(key);
    if (v == null) throw new Error("not found");
    return { key, value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
};


// ——— QUEST DATA ———————————————————————————
const LEVELS = [
  {
    id: "sprint",
    name: "LEVEL 1 · THIS WEEK",
    sub: "JUN 12–19",
    tasks: [
      { id: "nicolo", label: "Nicolo project — find Pamana materials + SEND (ask Japs)", xp: 20, due: "TONIGHT" },
      { id: "ardp", label: "Find & send ARDP files — reply Nel, Bianca, Jana", xp: 20, due: "TONIGHT" },
      { id: "allan", label: "Message Allan Nazareno (Broadway tix)", xp: 10 },
      { id: "wil", label: "Message Wil from Disguise", xp: 10 },
      { id: "pinkfang", label: "Watch The Table by Pinkfang", xp: 10, due: "FRI" },
      { id: "daniel", label: "Ofc hrs w/ Daniel (Mon 4PM per calendar)", xp: 10, due: "JUN 15" },
      { id: "billy", label: "CultureHub visit w/ Billy (1PM — delete dupe 9AM entry)", xp: 10, due: "JUN 16" },
      { id: "benben", label: "Ben&Ben concept presentation", xp: 20, due: "JUN 19" },
      { id: "r-mio", label: "Reply: Mio Infante", xp: 5 },
      { id: "r-peachy", label: "Reply: Tita Peachy", xp: 5 },
      { id: "r-kaye", label: "Reply: Kaye R.", xp: 5 },
      { id: "r-malou", label: "Reply: Tita Malou", xp: 5 },
      { id: "r-gene", label: "Reply: Gene", xp: 5 },
      { id: "r-chevy", label: "Reply: Chevy", xp: 5 },
      { id: "inbox", label: "Inbox sweep — Messenger / WhatsApp / iMessage / Viber / Telegram / GChat / Email", xp: 15 },
    ],
  },
  {
    id: "decisions",
    name: "LEVEL 2 · DECISIONS",
    sub: "UNLOCKS THE MAP",
    tasks: [
      { id: "housing", label: "Book Jul 1–11 NYC stay (I-House ends Jun 30)", xp: 25, due: "ASAP" },
      { id: "rebook", label: "Rebook Dubai→MNL leg (insert Chiang Mai / Vietnam)", xp: 25 },
      { id: "mads", label: "Send Mads the Jul 16–20 window proposal", xp: 20 },
      { id: "gawad", label: "Decide: Gawad Buhay RSVP", xp: 15, due: "JUL 28" },
      { id: "nyu", label: "Check NYU BOE course dates", xp: 10 },
    ],
  },
  {
    id: "finale",
    name: "LEVEL 3 · NYC FINALE",
    sub: "THRU JUL 11",
    tasks: [
      { id: "bonsai", label: "Meet Bonsai", xp: 15 },
      { id: "justin", label: "Meet Justin Stasiw", xp: 15 },
      { id: "hana", label: "Meet / email Hana Kim", xp: 10 },
      { id: "mit", label: "MIT / Boston overnight", xp: 20 },
      { id: "frank", label: "Watch: Can I Be Frank", xp: 10 },
      { id: "ph", label: "Watch: a Playwrights Horizons show", xp: 10 },
      { id: "hdl", label: "Visit: Hall des Lumières", xp: 10 },
      { id: "bway", label: "Broadway — Lost Boys / Cats / HP / Salesman / Giant", xp: 15 },
      { id: "moma", label: "Go back: MoMA", xp: 10 },
      { id: "met", label: "Go back: The Met", xp: 10 },
      { id: "guggen", label: "Go back: Guggenheim", xp: 10 },
      { id: "pride", label: "Pride month party", xp: 10 },
      { id: "pasalubong", label: "Buy pasalubongs & stuff", xp: 10 },
      { id: "pasabuy", label: "Pasabuy: Mark D / Lia", xp: 10 },
      { id: "tech", label: "Buy tech equipment", xp: 10 },
      { id: "box", label: "Ship the balikbayan box", xp: 20 },
    ],
  },
  {
    id: "synthesis",
    name: "LEVEL 4 · SYNTHESIS",
    sub: "QUIET HOURS / FLIGHTS",
    tasks: [
      { id: "socmed", label: "Post fellowship on socmed + ACC IG highlights", xp: 20, due: "JUN 30" },
      { id: "synth", label: "Synthesize the fellowship", xp: 25 },
      { id: "guild", label: "Guild — first written notes", xp: 15 },
      { id: "solo", label: "Solo show — first written notes", xp: 15 },
      { id: "cuecraft", label: "CueCraft plans", xp: 15 },
      { id: "augdec", label: "Plan Aug–Dec 2026 schedule", xp: 20 },
      { id: "catdb", label: "Categorize past projects (CLIENTS tab)", xp: 20 },
    ],
  },
];

const ALL_TASKS = LEVELS.flatMap((l) => l.tasks);
const TOTAL_XP = ALL_TASKS.reduce((s, t) => s + t.xp, 0);
const STORAGE_KEY = "saranggola-quest-v1";
const DB_KEY = "jag-clientdb-v1";

// ——— CALENDAR EVENTS ———————————————————————
const EVENTS = {
  "2026-06-01": [{ t: "3PM", title: "vanderbilt summit", cat: "event" }],
  "2026-06-03": [{ t: "11AM", title: "Zoo", cat: "event" }],
  "2026-06-04": [{ t: "8PM", title: "Onassis", cat: "event" }],
  "2026-06-05": [{ t: "4PM", title: "Theater Mitu", cat: "event" }],
  "2026-06-06": [{ t: "4PM", title: "Laia and Isabelle", cat: "event" }],
  "2026-06-08": [{ t: "11AM", title: "Return Plan Draft — Philippines", cat: "work" }],
  "2026-06-09": [{ t: "7PM", title: "Reh", cat: "work" }],
  "2026-06-12": [
    { t: "—", title: "DUE TONIGHT: Nicolo files", cat: "due" },
    { t: "—", title: "DUE TONIGHT: ARDP files", cat: "due" },
    { t: "1PM", title: "Mtg Zach Li", cat: "work" },
    { t: "1PM", title: "Zoom — Gustavo Blaauw (Periaktos)", cat: "work" },
    { t: "6PM", title: "Reh", cat: "work" },
    { t: "7:30PM", title: "TRANSLATION — The Culture Club, 530 W 27th", cat: "event" },
  ],
  "2026-06-13": [
    { t: "3AM", title: "HARANA briefing — 3PM PH @ Valle Verde (Zoom? confirm w/ Tita Peachy)", cat: "due" },
    { t: "1AM", title: "Syd", cat: "event" },
    { t: "6PM", title: "16th Annual Interactive Show: Machine Yearning — 87 Third Ave, BK", cat: "event" },
  ],
  "2026-06-15": [{ t: "4PM", title: "Ofc hrs with Daniel", cat: "work" }],
  "2026-06-16": [
    { t: "1PM", title: "Billy Clark — CultureHub, 66 E 4th St", cat: "event" },
    { t: "11PM", title: "Meeting Ben & Ben w/ Mads, Max & Loraine", cat: "work" },
  ],
  "2026-06-17": [{ t: "10:30AM", title: "Vibecon — CMACC (thru Jun 18)", cat: "event" }],
  "2026-06-18": [
    { t: "11AM", title: "How Immersive Tech Shapes Business — XR & Innovation", cat: "event" },
    { t: "→7PM", title: "Vibecon cont.", cat: "event" },
  ],
  "2026-06-19": [{ t: "11PM", title: "Ben & Ben initial concept presentation w/ creatives", cat: "work" }],
  "2026-06-20": [{ t: "4PM", title: "Dia Beacon", cat: "event" }],
  "2026-06-23": [{ t: "1PM", title: "Josie", cat: "event" }],
  "2026-06-30": [{ t: "—", title: "I-House housing ends — MOVE OUT", cat: "travel" }],
  "2026-07-04": [{ t: "—", title: "Independence Day", cat: "hol" }],
  "2026-07-12": [{ t: "—", title: "FLIGHT: NYC → Dubai", cat: "travel" }],
  "2026-07-14": [{ t: "—", title: "FLIGHT: Dubai → MNL (TO REBOOK)", cat: "due" }],
  "2026-07-28": [{ t: "EVE", title: "Gawad Buhay — Aliw Theater, MNL (RSVP?)", cat: "travel" }],
  "2026-09-11": [{ t: "—", title: "HARANA — bday event, Alabang (Tita Peachy, TBC)", cat: "event" }],
  "2026-09-14": [{ t: "—", title: "Kenkoy / ARDP — tentative week, thru Sep 19", cat: "work" }],
  "2026-09-19": [{ t: "—", title: "Kenkoy closes (tent.) · Labyrinth ingress Sep 18–21 if taken", cat: "due" }],
  "2026-09-22": [{ t: "12PM", title: "Labyrinth Black Box tech starts (IF taken) — thru Sep 30", cat: "due" }],
  "2026-10-01": [
    { t: "—", title: "SARANGGOLA — Araneta prep / final rehearsals (tent.)", cat: "work" },
    { t: "8PM", title: "Labyrinth Gala Preview (CONFLICT if taken)", cat: "due" },
  ],
  "2026-10-02": [
    { t: "8PM", title: "🪁 SHOW: BEN&BEN SARANGGOLA — Smart Araneta Coliseum", cat: "work" },
    { t: "8PM", title: "Labyrinth OPENING — CONFLICT, operator handoff needed", cat: "due" },
  ],
  "2026-10-15": [{ t: "—", title: "Noli Me Tangere — tentative, date TBC (placed mid-month)", cat: "due" }],
};

// ——— CLIENT DATABASE (from 2023–2025 Collectibles · no amounts) ———
// CATS: TH Theater · DA Dance/Ballet · CO Concert/Music · BR Brand/Corporate ·
//        GO Govt/Public · IN Installation/Immersive · AV AVP/Edit · WS Workshop/Talk · OT Other
const CATS = {
  TH: "Theater",
  DA: "Dance/Ballet",
  CO: "Concert/Music",
  BR: "Brand/Corporate",
  GO: "Govt/Public",
  IN: "Installation/Immersive",
  AV: "AVP/Edit",
  WS: "Workshop/Talk",
  OT: "Other",
};

// rows: [month(1-12), client, project, defaultCat]
const DB_2023 = [
  [1, "BBX", "Sunlife", "AV"],
  [1, "Bench", "Stray Kids", "BR"],
  [1, "AdCentral", "ONE Unilab Opening & Battlecry", "BR"],
  [1, "AdCentral", "ONE Unilab Westmont", "AV"],
  [1, "AdCentral", "ONE Unilab postprod edit", "AV"],
  [1, "BBX (Mon)", "PS Caravan — Nestlé Innovations", "AV"],
  [1, "BSE", "WNCAA", "CO"],
  [1, "Stages", "BPI BB CNY", "BR"],
  [2, "Stages", "BPI 9-11", "BR"],
  [2, "BOOM / GA", "Ice Concert Cebu", "CO"],
  [2, "AdCentral", "DOST", "GO"],
  [2, "AdCentral", "SC&D", "AV"],
  [3, "Ching D", "Anilag Festival", "GO"],
  [3, "RISE", "Ever Bilena", "BR"],
  [3, "Dreamteam", "Micecon", "GO"],
  [3, "AdCentral", "DOST 6th iMake", "GO"],
  [3, "Raf", "Rotary", "OT"],
  [3, "GA", "GCash", "BR"],
  [4, "TP", "Nekropolis", "TH"],
  [4, "Bench", "Itzy", "BR"],
  [4, "Guang Ming", "Guang Ming", "OT"],
  [4, "BBX (Harly)", "NTO Bida Berde", "AV"],
  [4, "AdCentral", "Bio-ONCO Pamorelin/Bicapros AVP", "AV"],
  [4, "BOOM / GA", "Ice Concert Davao", "CO"],
  [5, "MET", "Larawan", "TH"],
  [5, "GA", "Sarah G", "CO"],
  [5, "Ballet Manila", "Don Quixote", "DA"],
  [5, "AdCentral", "UAP", "AV"],
  [5, "Bench", "WHJ", "BR"],
  [6, "BBX (Mon)", "NTO — editing & playback", "AV"],
  [6, "Peachy", "June 23 event", "OT"],
  [6, "BSE", "SB19", "CO"],
  [6, "BBX (Mon)", "NAN", "AV"],
  [7, "BBX", "Sunlife Repeat", "AV"],
  [7, "BSE", "PPOPCon", "CO"],
  [7, "BSE", "XR18", "CO"],
  [7, "AdCentral", "Unilab", "BR"],
  [7, "Stages", "BPI Ka-Negosyo", "BR"],
  [7, "GA", "Sarah G x Bamboo", "CO"],
  [7, "Bench", "KSH", "BR"],
  [7, "Ballet Manila", "Recital", "DA"],
  [7, "AdCentral", "Progesterone Interactive Dance", "AV"],
  [8, "Seanne", "HCG", "OT"],
  [8, "Ballet Manila", "Ibong Adarna", "DA"],
  [8, "BBX (Mon)", "NTO Proshot", "AV"],
  [8, "Stages", "BPI Davao", "BR"],
  [8, "WISH", "Wish", "CO"],
  [8, "AdCentral", "Neurogen", "AV"],
  [8, "Vogue", "Vogue", "BR"],
  [8, "Arsenal", "Coxid", "AV"],
  [9, "Ballet Manila", "RJ", "DA"],
  [9, "Francis Theater", "Inconnu", "TH"],
  [9, "GA", "Sarah G x Bamboo Davao", "CO"],
  [9, "UAAP", "UAAP UE", "CO"],
  [9, "Steffi", "Steffi", "OT"],
  [9, "Arsenal", "Ezoprole", "AV"],
  [9, "Obar", "Obar", "OT"],
  [10, "Music Artes", "Silver Lining", "TH"],
  [10, "Bench", "AHS", "BR"],
  [10, "RISE", "Chanyeol", "CO"],
  [10, "Ballet Manila", "Dance for Shaz", "DA"],
  [10, "GA", "Sarah G x Bamboo Cebu", "CO"],
  [10, "Arsenal", "PCPF", "AV"],
  [10, "Arsenal", "Gapo", "AV"],
  [10, "Arsenal", "President's Night", "AV"],
  [10, "BSE", "OneZone", "CO"],
  [10, "GA", "Sarah G x Bamboo Pampanga", "CO"],
  [11, "HK CCA", "HK CCA", "OT"],
  [11, "ACC", "ACC Anniv", "OT"],
  [11, "Tayco", "CCP", "OT"],
  [11, "Sir Floy", "Poppert", "TH"],
  [11, "Steffi", "H&M", "BR"],
  [12, "Bench", "Xmas Party", "BR"],
  [12, "Ballet Manila", "Nutcracker", "DA"],
  [12, "Sir Floy", "Jed M", "OT"],
  [12, "Sir Ohm", "SPAT", "OT"],
  [12, "Dreamteam", "PICC", "GO"],
  [12, "AdCentral", "UPC", "AV"],
];

const DB_2024 = [
  [1, "DLSU", "DLSU Talk", "WS"],
  [1, "Gabo", "Magic", "OT"],
  [1, "Nicatto / DOT", "BGC Immersive", "IN"],
  [2, "Sandbox", "Spelling Bee", "OT"],
  [2, "Ballet Manila", "Le Corsaire", "DA"],
  [2, "AVLS", "Azzuro Installation", "IN"],
  [2, "Adam", "Commission", "OT"],
  [2, "Glendfford", "Ayala Valentines", "BR"],
  [2, "GA", "Cup of Joe", "CO"],
  [3, "Peachy", "AIM", "BR"],
  [3, "Pacoh", "Anilag", "GO"],
  [3, "GA", "IS Workshop", "WS"],
  [3, "Raf", "Rotary", "OT"],
  [3, "Arsenal", "UPC revision", "AV"],
  [3, "BBX (Yeyin)", "Pro Friends bumper", "AV"],
  [3, "Honeycomb", "Airmax installation", "IN"],
  [4, "Ohm", "BGC LED", "IN"],
  [4, "Ohm", "BGC Projection", "IN"],
  [4, "Full House Theater", "Buruguduy Musical", "TH"],
  [4, "Mind Museum", "BGC Installation Rental", "IN"],
  [4, "BBX (Mon)", "NAN edits", "AV"],
  [4, "Ballet Manila", "Ibong Adarna rerun", "DA"],
  [5, "Araneta", "BTS Installation Rental", "IN"],
  [5, "Bench", "Bench", "BR"],
  [5, "Ballet Manila", "Lola Basyang", "DA"],
  [5, "Barefoot", "Bar Boys", "TH"],
  [5, "Outbound Asia", "Resolume Workshop", "WS"],
  [6, "ARDP", "Independence Day (Jun 10)", "DA"],
  [6, "BBX (Yeyin)", "Wyeth", "AV"],
  [6, "VLF", "Vengeance", "TH"],
  [6, "Outbound Asia", "Resolume Workshop", "WS"],
  [6, "Arsenal", "Westmont AVP", "AV"],
  [6, "Ballet Manila", "Recital", "DA"],
  [7, "Ayala", "Anniversary", "BR"],
  [7, "Nicatto", "Micecon Clark", "GO"],
  [7, "Nicatto", "Riize", "CO"],
  [7, "Bee", "Fanmeet", "CO"],
  [7, "Nicatto", "BBMG", "CO"],
  [7, "Arsenal", "LRTH AVP", "AV"],
  [7, "Arsenal", "DOST AVP", "AV"],
  [7, "BBX", "NAN", "AV"],
  [7, "Ballet Manila", "LMSB Recital", "DA"],
  [8, "Ballet Manila", "Giselle", "DA"],
  [8, "BYC", "Beauty and the Beast", "TH"],
  [8, "Nicatto / Bench", "JCW", "BR"],
  [8, "Nicatto", "BBMG Canada", "CO"],
  [8, "Barefoot", "MSB", "TH"],
  [8, "Arsenal", "One Smile Pilipinas", "AV"],
  [8, "Arsenal", "IMWM", "AV"],
  [8, "Ballet Manila", "Malaysia send-off", "DA"],
  [8, "WTA", "CCP Shania", "CO"],
  [9, "ARDP", "Sayaw Tungo sa Kalayaan rerun", "DA"],
  [9, "BTC", "Barboys", "TH"],
  [9, "BBX (Yeyin)", "VFX", "AV"],
  [9, "BBX (Kiko/Mon)", "CARDEA URANIA / CITRAPOS", "AV"],
  [9, "Ballet Manila", "Ballet & Ballads 1", "DA"],
  [9, "YCIS", "Beijing", "OT"],
  [10, "Ballet Manila", "F&L", "DA"],
  [10, "United Neon", "YCIS", "BR"],
  [10, "—", "Shrek", "TH"],
  [10, "Boomerang", "Boomerang Awards", "BR"],
  [10, "Arsenal", "Unilab Quickstation", "AV"],
  [11, "Music Artes", "Silver Lining rerun", "TH"],
  [11, "Ballet Manila", "F&L rerun", "DA"],
  [11, "Ballet Manila", "Le Corsaire Jakarta", "DA"],
  [11, "Chevy", "RL Concert", "CO"],
  [11, "Bee", "Hori7on", "CO"],
  [11, "United Neon", "BGC SKY", "IN"],
  [11, "Ohm", "BGC Passion", "IN"],
  [11, "Arsenal", "Unilab Logos", "AV"],
  [11, "Arsenal", "Glyhart shoot + 2 AVPs", "AV"],
  [11, "Arsenal", "Unilab Preterm — Deo", "AV"],
  [11, "United Neon", "HBO Launch", "BR"],
  [11, "Dreamteam", "GSIS", "GO"],
  [11, "Dreamteam", "National Museum", "GO"],
  [11, "Prestige", "3D Xmas LED", "IN"],
  [11, "BSP", "BSP Alignment", "GO"],
  [11, "Ballet Manila", "Ballet & Ballads 2", "DA"],
  [11, "Arsenal", "DOST Indie", "AV"],
  [11, "Aya", "Good Energy", "OT"],
  [12, "Bee", "Akon (Dec 3)", "CO"],
  [12, "Ballet Manila", "Snow White", "DA"],
  [12, "MET", "MET Anniv", "TH"],
  [12, "Samsung", "Xmas", "BR"],
  [12, "Ericsson", "Vogue", "BR"],
  [12, "FWD", "Parol", "BR"],
  [12, "JAGStudio", "Rental", "OT"],
  [12, "GA", "Ben & Ben", "CO"],
  [12, "Ballet Manila", "Recital / Nutcracker", "DA"],
  [12, "—", "BBMG", "CO"],
  [12, "—", "PPOP Awards", "CO"],
];

const DB_2025 = [
  [1, "Bench", "Ternocon", "BR"],
  [1, "JM Cabling", "JM Cabling", "DA"],
  [1, "Ballet Manila", "ATF", "DA"],
  [2, "BBX", "Epson", "BR"],
  [2, "Gab P", "Gab P", "OT"],
  [2, "—", "Sessionistas", "CO"],
  [2, "Bench", "Bench", "BR"],
  [2, "Unilab", "Unilab", "BR"],
  [3, "PKB", "PKB rent", "OT"],
  [3, "Ballet Manila", "Pearl", "DA"],
  [3, "Arsenal", "JAC", "AV"],
  [3, "—", "80th Bday Buhain", "OT"],
  [3, "Arsenal", "Easecox", "AV"],
  [3, "YCIS", "HK YCIS HP", "OT"],
  [3, "PSS", "PSS Workshop", "WS"],
  [3, "—", "Para kay B", "TH"],
  [3, "—", "Tosca", "TH"],
  [3, "—", "Tarlac Masaya", "GO"],
  [4, "RWM", "RWM", "TH"],
  [4, "Arsenal", "Nitroxel", "AV"],
  [4, "Arsenal", "Patient Prof", "AV"],
  [4, "Arsenal", "Cardio Cont AVP", "AV"],
  [4, "Arsenal", "PHG 2", "AV"],
  [4, "—", "Ice repeat", "CO"],
  [4, "Megaworld", "Newport", "BR"],
  [4, "Stages", "Stages", "BR"],
  [5, "Ballet Manila", "Swan Lake", "DA"],
  [5, "Peachy", "Peachy", "OT"],
  [5, "—", "Zsazsa", "TH"],
  [5, "Ben & Ben", "Ben & Ben", "CO"],
  [5, "Solaire", "Solaire North", "BR"],
  [5, "—", "IJ BGC", "IN"],
  [5, "Arsenal", "Edit", "AV"],
  [5, "Arsenal", "Holo", "AV"],
  [5, "—", "Werk", "OT"],
  [5, "—", "Shooting Stars", "CO"],
  [6, "—", "Osaka Expo", "IN"],
  [6, "Sir Ralph", "Sir Ralph", "OT"],
  [6, "Aaron", "Re-Claim", "OT"],
  [6, "BBX", "Epson", "BR"],
  [6, "Blackstar (BSE)", "Kitchie Nadal", "CO"],
  [6, "GMA", "GMA Anniv", "BR"],
  [6, "Ballet Manila", "LMSB Recital — Just Dance", "DA"],
  [7, "CPAT", "Anniversary", "OT"],
  [7, "—", "Poppert", "TH"],
  [7, "—", "Frozen HK", "TH"],
  [7, "—", "Cebu NU Star", "OT"],
  [7, "—", "Resolume Training", "WS"],
  [8, "—", "Frozen Cebu", "TH"],
  [8, "GMA", "GMA Gala", "BR"],
  [8, "Ben & Ben", "Local Tour", "CO"],
  [8, "Arsenal", "PHG Midyear AVP", "AV"],
  [8, "ARDP", "ARDP", "DA"],
  [8, "Ballet Manila", "Don Quixote rerun", "DA"],
  [8, "Acer", "GoLive Asia", "BR"],
  [9, "Nicatto", "Creative Tourism", "GO"],
  [9, "—", "Ice Bday Concert", "CO"],
  [9, "PKB", "PKB Rerun", "OT"],
  [9, "Nicatto / San Miguel", "San Miguel", "BR"],
  [9, "SJDM", "San Jose Del Monte Bulacan", "GO"],
  [10, "—", "Red Charity Fashion Show", "BR"],
  [10, "Ben & Ben", "PNVF", "CO"],
  [10, "Barefoot (CueCraft)", "Barboys", "TH"],
  [10, "Ballet Manila", "F&L Rerun", "DA"],
  [10, "Ballet Manila", "B&B", "DA"],
  [10, "—", "SB19 Fastzone", "CO"],
  [10, "—", "Yaparazzi", "OT"],
  [10, "BSP (CueCraft)", "BSP", "GO"],
  [10, "Arsenal", "Edit AVP", "AV"],
  [10, "Arsenal", "Revision", "AV"],
  [11, "—", "Dionela", "CO"],
  [11, "—", "Silang Magigiting", "GO"],
  [11, "Meralco", "Meralco", "BR"],
  [11, "ACC", "ACC Anniv 2025", "OT"],
  [11, "—", "RL", "CO"],
  [11, "—", "Mr C", "OT"],
  [11, "—", "Faust", "TH"],
  [12, "Ben & Ben", "TTAD Iloilo", "CO"],
  [12, "JMC", "JMC", "DA"],
  [12, "Bench", "Bench", "BR"],
  [12, "—", "Capiz", "GO"],
  [12, "—", "RAAA", "OT"],
  [12, "PLDT", "PLDT", "BR"],
  [12, "—", "Luneta", "GO"],
  [12, "GMA", "GMA Main", "BR"],
];

const DB_BY_YEAR = { 2023: DB_2023, 2024: DB_2024, 2025: DB_2025 };
const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// ——— RECENT INQUIRIES (from messages · synced Jun 12) ———
const INQUIRIES = [
  {
    id: "inq-benben",
    from: "Ben & Ben — SARANGGOLA",
    via: "CONTRACTED",
    project: "Saranggola — Smart Araneta Coliseum",
    detail: "Visuals Director. Concept presentation Jun 19. This is the anchor date — everything else schedules around it.",
    timeline: "OCT 2, 2026 (FIXED)",
    need: "Visual Designer / Visuals Director / VJ",
  },
  {
    id: "inq-mio",
    from: "Mio Infante (9 Works Theatrical)",
    via: "MESSENGER",
    project: "Project Labyrinth — Dan Brown's Da Vinci Code (CONFIDENTIAL, title announce July)",
    detail: "Non-replica, proscenium blackbox, 10 pax, Asian premiere. VERIFIED SCHED: Pictorial TBA · Reading Aug 31 · Blocking Sep 1–4 · Press con Sep 8 · Run thrus Sep 7–21 (4–10pm) · Ingress Sep 18–21 · Black Box tech Sep 22–30 (stage/sound/light, TDRs, 12pm–10pm) · Gala Preview Oct 1 · OPENING Oct 2 · Shows Sat/Sun 3pm+8pm thru Oct 25 + Fri pickup rehs Oct 9/16/23.",
    timeline: "REH AUG 31 · TECH SEP 22–OCT 1 · OPENS OCT 2 · WKNDS THRU OCT 25",
    need: "Projections-heavy design + needs a researcher",
    sked: "./prodsked-labyrinth.pdf",
    flag: "🚨 OPENING NIGHT OCT 2 = SARANGGOLA NIGHT. Plan: design + tech Sep 22–30, train an operator for opening wknd.",
  },
  {
    id: "inq-mio2",
    from: "Mio Infante (9 Works Theatrical)",
    via: "MESSENGER",
    project: "Second inquiry — April 2027 production (TENTATIVE, details TBC)",
    detail: "Early ask only — no title or dates yet.",
    timeline: "APR 2027 (TENTATIVE)",
    need: "TBC — likely projection design",
    flag: "⚠ Potential conflict with KATY! (Culturtain, Apr 2027 @ CCP). Can't say yes to both until real dates land — first to confirm dates wins the slot.",
  },
  {
    id: "inq-noli",
    from: "Noli Me Tangere production (TENTATIVE)",
    via: "TBD",
    project: "Noli Me Tangere — details TBD",
    detail: "Tentative October production. Source/director/venue to confirm.",
    timeline: "OCT 2026 (TENTATIVE)",
    need: "TBD",
    flag: "⚠ Third October project — Oct is now Saranggola + Labyrinth + Noli. Something has to give or delegate.",
  },
  {
    id: "inq-chevy",
    from: "Chevy",
    via: "MESSENGER",
    project: "Culturtain (Celeste Legaspi & Girlie Rodis) — restaging KATY! + ALIKABOK",
    detail: "Chevy resigned from BM, now with Culturtain (original Filipino musicals). Wants to book me for both.",
    timeline: "KATY! APR 2027 (CCP) · ALIKABOK AUG 2027 (NPAT)",
    need: "Projection / video design (to confirm scope)",
  },
  {
    id: "inq-nel",
    from: "Ronelson Yadao (ARDP)",
    via: "MESSENGER",
    project: "Kenkoy — dance production (komiks character)",
    detail: "Peg video shared for stage design + visuals. Collaborators: Guelan, D Cortezano. 'Ganda ng visuals natin. Game!'",
    timeline: "SEPT 14–19, 2026 (tentative)",
    need: "Stage design + visuals (files due to Nel, Bianca, Jana TONIGHT)",
    flag: "⚠ Overlaps Labyrinth run-thru weeks; ends 3 days before Labyrinth tech starts.",
  },
  {
    id: "inq-ice",
    from: "Kaye R. — Fire & Ice",
    via: "MESSENGER",
    project: "Fire & Ice event w/ Ice — 'pwede ka na ulit?'",
    detail: "Asking if I'm back in PH by August. Repeat client (Being Ice 2025, Ice concerts 2023–2025).",
    timeline: "AUG 22, 2026",
    need: "Availability confirmation — I land mid-July, so YES is possible",
  },
  {
    id: "inq-weng",
    from: "Weng (Ballet Manila)",
    via: "VIBER",
    project: "BM shows — open availability ask + admin loose ends",
    detail: "'When ever are you available for BM shows?' (asking my availability) Plus: cheque pick-ups (F&L rerun @ Aliw), wet signature authorization, Florante collection via Nikko.",
    timeline: "OPEN — post-return",
    need: "Availability answer + settle collection logistics",
  },
  {
    id: "inq-peachy",
    from: "Tita Peachy (via Tita Aimee — Juicebox Shop)",
    via: "MESSENGER",
    project: "HARANA — bday of Steve Vesagas' father-in-law · Sept 11 · Alabang",
    detail: "Steve wants a F2F briefing: JUN 13, 3PM @ 18 Acacia St, Valle Verde 3. They're asking if I can Zoom in instead since I'm abroad ('pwede kaya i-Zoom si Joyce?').",
    timeline: "BRIEFING JUN 13 3PM PH (= 3AM NY) · EVENT SEP 11",
    need: "Projection/AV for HARANA (TBC). NOW: confirm Zoom or counter-propose a NY-sane hour",
    flag: "⏰ 3PM Manila = 3AM New York. Reply tonight — even just to move the time.",
  },
  {
    id: "inq-joshua",
    from: "Joshua Chan",
    via: "MESSENGER",
    project: "Motion control projection — 'have you tried this kaya?' (TikTok peg shared)",
    detail: "Has a project in mind, exploring motion-control projection. Asking about my experience / interest.",
    timeline: "TBC — ask for dates & scope",
    need: "Consult or design — motion control + projection. Very much my lane post-fellowship (URBANA, robotics, TouchDesigner).",
  },
];


// ——— THEME ———————————————————————————
const C = {
  bg: "#0A0A12",
  panel: "#12121F",
  cell: "#0E0E1A",
  border: "#2B2B45",
  cyan: "#23E5DB",
  magenta: "#FF3D8F",
  yellow: "#FFD23F",
  text: "#E8E8F0",
  dim: "#6E6E94",
  green: "#3DFF7B",
};
const CAT_COLOR = { work: C.cyan, event: C.green, travel: C.yellow, due: C.magenta, hol: C.dim };
const mono = "'Courier New', Courier, monospace";

const pad = (n) => String(n).padStart(2, "0");
const keyOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function buildMonth(year, month) {
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const weeks = [];
  const cur = new Date(start);
  while (true) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({ y: cur.getFullYear(), m: cur.getMonth() + 1, d: cur.getDate(), inMonth: cur.getMonth() + 1 === month });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    if (cur.getMonth() + 1 !== month && cur.getDay() === 0 && weeks.length >= 4) break;
    if (weeks.length > 6) break;
  }
  return weeks;
}

function Scanlines() {
  return (
    <div
      style={{
        pointerEvents: "none",
        position: "fixed",
        inset: 0,
        background:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
        zIndex: 50,
      }}
    />
  );
}

// ——— CALENDAR PAGE ———————————————————————
// ——— CALENDAR PAGER (JUN–OCT 2026) ———————————————
function CalendarPager() {
  const MONTHS = [
    [6, "JUNE"],
    [7, "JULY"],
    [8, "AUGUST"],
    [9, "SEPTEMBER"],
    [10, "OCTOBER"],
  ];
  const [mi, setMi] = useState(0);
  const [m, name] = MONTHS[mi];
  const arrow = (dir, disabled) => ({
    fontFamily: mono,
    fontSize: 16,
    fontWeight: 700,
    width: 44,
    padding: "6px 0",
    cursor: disabled ? "default" : "pointer",
    background: "transparent",
    color: disabled ? C.border : C.cyan,
    border: `2px solid ${disabled ? C.border : C.cyan}`,
    boxShadow: disabled ? "none" : `0 0 10px ${C.cyan}44`,
  });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
        <button style={arrow("l", mi === 0)} disabled={mi === 0} onClick={() => setMi(mi - 1)}>
          ◄
        </button>
        <div style={{ flex: 1, textAlign: "center", fontFamily: mono, fontSize: 14, fontWeight: 700, letterSpacing: "0.25em", color: C.cyan }}>
          {name} 2026
        </div>
        <button style={arrow("r", mi === MONTHS.length - 1)} disabled={mi === MONTHS.length - 1} onClick={() => setMi(mi + 1)}>
          ►
        </button>
      </div>
      <MonthGrid key={m} year={2026} month={m} monthName={name} />
    </div>
  );
}

// ——— CALENDAR PAGE ———————————————————————
function MonthGrid({ year, month, monthName }) {
  const today = "2026-06-12";
  const [selected, setSelected] = useState(null);
  const weeks = buildMonth(year, month);
  const selEvents = selected ? EVENTS[selected] || [] : [];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 2, marginTop: 10 }}>
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
          <div key={d} style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", color: C.dim, textAlign: "center", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 2, marginTop: 2 }}>
          {week.map((day) => {
            const k = keyOf(day.y, day.m, day.d);
            const evs = EVENTS[k] || [];
            const isToday = k === today;
            const isSel = k === selected;
            return (
              <button
                key={k}
                onClick={() => setSelected(isSel ? null : k)}
                style={{
                  minHeight: 64,
                  minWidth: 0,
                  overflow: "hidden",
                  background: isSel ? "#1A1A30" : C.cell,
                  border: `1px solid ${isSel ? C.cyan : C.border}`,
                  padding: "3px 2px",
                  cursor: evs.length ? "pointer" : "default",
                  opacity: day.inMonth ? 1 : 0.32,
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  fontFamily: "inherit",
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    fontWeight: 700,
                    alignSelf: "flex-end",
                    color: isToday ? "#0A0A12" : day.inMonth ? C.text : C.dim,
                    background: isToday ? C.magenta : "transparent",
                    borderRadius: isToday ? 99 : 0,
                    padding: isToday ? "1px 5px" : "1px 2px",
                    boxShadow: isToday ? `0 0 8px ${C.magenta}` : "none",
                  }}
                >
                  {day.d}
                </span>
                {evs.slice(0, 3).map((e, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 7.5,
                      lineHeight: 1.25,
                      color: C.text,
                      borderLeft: `2px solid ${CAT_COLOR[e.cat]}`,
                      paddingLeft: 3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                      maxWidth: "100%",
                    }}
                  >
                    {e.title}
                  </span>
                ))}
                {evs.length > 3 && <span style={{ fontFamily: mono, fontSize: 7.5, color: C.yellow }}>+{evs.length - 3}</span>}
              </button>
            );
          })}
        </div>
      ))}
      {selected && (
        <div style={{ marginTop: 10, border: `1px solid ${C.cyan}`, background: C.panel, padding: "10px 12px" }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.15em", color: C.cyan, marginBottom: 6 }}>
            ▓ {selected}
          </div>
          {selEvents.length === 0 && <div style={{ fontSize: 12.5, color: C.dim }}>No events.</div>}
          {selEvents.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", alignItems: "flex-start" }}>
              <span style={{ fontFamily: mono, fontSize: 10.5, color: CAT_COLOR[e.cat], width: 56, flexShrink: 0, fontWeight: 700 }}>{e.t}</span>
              <span style={{ fontSize: 12.5, color: C.text, lineHeight: 1.4 }}>{e.title}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12, fontFamily: mono, fontSize: 8.5, letterSpacing: "0.1em" }}>
        {[["WORK", "work"], ["EVENTS/SHOWS", "event"], ["TRAVEL/FIXED", "travel"], ["DUE/REBOOK", "due"]].map(([label, cat]) => (
          <span key={cat} style={{ color: C.dim, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, background: CAT_COLOR[cat], display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, marginTop: 8, letterSpacing: "0.05em" }}>
        SOURCES: JAG NY + WORK + ACC (APPLE) · JAG.NYC27 (GOOGLE) · SYNCED JUN 12 4PM
      </div>
    </div>
  );
}

// ——— CLIENT DATABASE PAGE ———————————————————
function ClientDB({ edits, setEdits, scheduleSave }) {
  const [year, setYear] = useState(2025);
  const [filterCat, setFilterCat] = useState("ALL");
  const [search, setSearch] = useState("");

  const rows = DB_BY_YEAR[year].map((r, i) => {
    const id = `${year}-${i}`;
    const e = edits[id] || {};
    return { id, m: r[0], client: r[1], project: r[2], cat: e.c || r[3], venue: e.v || "" };
  });

  const filtered = rows.filter((r) => {
    if (filterCat !== "ALL" && r.cat !== filterCat) return false;
    if (search && !(`${r.client} ${r.project}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  // per-month activity for the graph
  const monthCounts = Array.from({ length: 12 }, (_, i) => rows.filter((r) => r.m === i + 1).length);
  const maxCount = Math.max(...monthCounts, 1);

  // recurring clients (selected year)
  const clientCounts = {};
  rows.forEach((r) => {
    if (r.client === "—") return;
    clientCounts[r.client] = (clientCounts[r.client] || 0) + 1;
  });
  const topClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const setRow = (id, field, value) => {
    setEdits((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), [field]: value } };
      scheduleSave(next);
      return next;
    });
  };

  const inputStyle = {
    fontFamily: mono,
    fontSize: 10.5,
    background: C.cell,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: "4px 6px",
  };

  return (
    <div>
      {/* year switch */}
      <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
        {[2023, 2024, 2025].map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            style={{
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 700,
              flex: 1,
              padding: "8px 0",
              cursor: "pointer",
              background: year === y ? C.cyan : "transparent",
              color: year === y ? "#0A0A12" : C.cyan,
              border: `2px solid ${C.cyan}`,
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* per-month activity graph */}
      <div style={{ marginTop: 14, border: `1px solid ${C.border}`, background: C.panel, padding: "10px 10px 6px" }}>
        <div style={{ fontFamily: mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", color: C.dim, marginBottom: 8 }}>
          PROJECTS / MONTH · {year} · TOTAL {rows.length}
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 56 }}>
          {monthCounts.map((c, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontFamily: mono, fontSize: 7.5, color: C.yellow }}>{c || ""}</span>
              <div
                style={{
                  width: "100%",
                  height: `${(c / maxCount) * 40}px`,
                  background: C.green,
                  boxShadow: c ? `0 0 5px ${C.green}66` : "none",
                  minHeight: c ? 3 : 0,
                }}
              />
              <span style={{ fontFamily: mono, fontSize: 6.5, color: C.dim }}>{MONTH_ABBR[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* top recurring clients */}
      <div style={{ marginTop: 10, border: `1px solid ${C.border}`, background: C.panel, padding: "10px 12px" }}>
        <div style={{ fontFamily: mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", color: C.dim, marginBottom: 6 }}>
          TOP RECURRING · {year}
        </div>
        {topClients.map(([name, count]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
            <span style={{ fontSize: 12, color: C.text, width: 130, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </span>
            <div style={{ flex: 1, display: "flex", gap: 2 }}>
              {Array.from({ length: count }).map((_, i) => (
                <span key={i} style={{ width: 9, height: 9, background: C.magenta, display: "inline-block" }} />
              ))}
            </div>
            <span style={{ fontFamily: mono, fontSize: 10.5, color: C.yellow, fontWeight: 700 }}>{count}</span>
          </div>
        ))}
      </div>

      {/* filters */}
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <input
          placeholder="SEARCH CLIENT / PROJECT…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...inputStyle, width: 130 }}>
          <option value="ALL">ALL CATS</option>
          {Object.entries(CATS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* rows */}
      <div style={{ marginTop: 10 }}>
        {filtered.map((r) => (
          <div key={r.id} style={{ border: `1px solid ${C.border}`, background: C.panel, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: mono, fontSize: 9.5, fontWeight: 700, color: C.cyan, flexShrink: 0 }}>
                {MONTH_ABBR[r.m - 1]} {year}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.client}</span>
            </div>
            <div style={{ fontSize: 12.5, color: C.text, opacity: 0.85, margin: "2px 0 6px" }}>{r.project}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <select value={r.cat} onChange={(e) => setRow(r.id, "c", e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                {Object.entries(CATS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                placeholder="loc / venue"
                value={r.venue}
                onChange={(e) => setRow(r.id, "v", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ fontFamily: mono, fontSize: 11, color: C.dim, textAlign: "center", padding: 20 }}>NO MATCHES.</div>
        )}
      </div>
      <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, marginTop: 6, letterSpacing: "0.05em" }}>
        SOURCE: 2023–2025 COLLECTIBLES PDFs · CATEGORIES & VENUES ARE EDITABLE + AUTO-SAVED
      </div>
    </div>
  );
}

// ——— INQUIRIES PAGE ———————————————————————
function InquiriesPage({ done, toggle }) {
  const row = (label, value, color) => (
    <div style={{ display: "flex", gap: 8, padding: "3px 0", alignItems: "flex-start" }}>
      <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: C.dim, width: 64, flexShrink: 0, paddingTop: 2 }}>
        {label}
      </span>
      <span style={{ fontSize: 12.5, color: color || C.text, lineHeight: 1.45, flex: 1 }}>{value}</span>
    </div>
  );
  return (
    <div>
      {/* OCTOBER COLLISION MAP */}
      <div style={{ marginTop: 16, border: `1px solid ${C.magenta}`, background: C.panel, padding: "12px 14px" }}>
        <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: C.magenta, marginBottom: 8 }}>
          ▓▓ JUN–OCT 2026 COLLISION MAP
        </div>
        {[
          ["JUN 16", "Ben & Ben mtg w/ Mads, Max & Loraine — 11PM NY", C.yellow],
          ["JUN 19", "Ben & Ben initial concept presentation w/ creatives — 11PM NY", C.yellow],
          ["AUG 22", "Fire & Ice event w/ Ice (Kaye R.)", C.yellow],
          ["SEP 11", "HARANA @ Alabang — Steve Vesagas' father-in-law bday (via Tita Peachy)", C.yellow],
          ["SEP 14–19", "Kenkoy (ARDP) — tentative", C.yellow],
          ["SEP 22–30", "Labyrinth tech @ Black Box", C.yellow],
          ["OCT 1", "Labyrinth Gala Preview", C.yellow],
          ["OCT 2", "🚨 SARANGGOLA @ Araneta (CONTRACTED) + Labyrinth Opening", C.magenta],
          ["OCT 3–25", "Labyrinth wknd shows + Noli Me Tangere (tentative, TBD)", C.yellow],
        ].map(([d, t, col], i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "3px 0" }}>
            <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: col, width: 78, flexShrink: 0 }}>{d}</span>
            <span style={{ fontSize: 12.5, color: C.text, lineHeight: 1.4 }}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: C.dim, margin: "16px 0 4px" }}>
        ▓▓ {INQUIRIES.length} INQUIRIES · TAP "REPLIED" WHEN ANSWERED
      </div>
      {INQUIRIES.map((q) => {
        const replied = !!done[q.id];
        return (
          <div
            key={q.id}
            style={{
              marginTop: 12,
              border: `1px solid ${replied ? C.green : C.border}`,
              background: C.panel,
              padding: "12px 14px",
              opacity: replied ? 0.65 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>{q.from}</span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: q.via === "VIBER" ? "#B49CFF" : q.via === "CONTRACTED" ? C.yellow : q.via === "TBD" ? C.dim : C.cyan,
                  border: `1px solid ${q.via === "VIBER" ? "#B49CFF" : q.via === "CONTRACTED" ? C.yellow : q.via === "TBD" ? C.dim : C.cyan}`,
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                {q.via}
              </span>
            </div>
            {row("PROJECT", q.project)}
            {row("DETAILS", q.detail)}
            {row("TIMELINE", q.timeline, C.yellow)}
            {row("MY PART", q.need, C.green)}
            {q.flag && row("NOTE", q.flag, C.magenta)}
            <button
              onClick={() => toggle(q.id)}
              style={{
                marginTop: 10,
                fontFamily: mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.15em",
                padding: "7px 14px",
                cursor: "pointer",
                background: replied ? C.green : "transparent",
                color: replied ? "#0A0A12" : C.green,
                border: `2px solid ${C.green}`,
              }}
            >
              {replied ? "✓ REPLIED" : "MARK REPLIED"}
            </button>
            {q.sked && (
              <a
                href={q.sked}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  marginLeft: 8,
                  fontFamily: mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  padding: "7px 14px",
                  cursor: "pointer",
                  background: "transparent",
                  color: C.cyan,
                  border: `2px solid ${C.cyan}`,
                  textDecoration: "none",
                }}
              >
                📎 VIEW PROD SKED
              </a>
            )}
          </div>
        );
      })}
      <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, marginTop: 12, letterSpacing: "0.05em" }}>
        SOURCE: MESSENGER + VIBER SCREENSHOTS · JUN 12 · REPLY STATUS AUTO-SAVES
      </div>
    </div>
  );
}

// ——— VISION & MISSION PAGE ———————————————————
function VisionPage() {
  const block = (label, body) => (
    <div style={{ marginTop: 14, border: `1px solid ${C.border}`, background: C.panel, padding: "14px 16px" }}>
      <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: C.magenta, marginBottom: 8 }}>
        ▓▓ {label}
      </div>
      {body}
    </div>
  );
  const li = (txt) => (
    <div style={{ display: "flex", gap: 8, padding: "3px 0" }}>
      <span style={{ fontFamily: mono, color: C.green, flexShrink: 0 }}>►</span>
      <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{txt}</span>
    </div>
  );
  return (
    <div>
      {block(
        "NORTH STAR",
        <div style={{ fontSize: 14.5, color: C.yellow, lineHeight: 1.55, fontStyle: "italic" }}>
          Dramaturgical technology as authorship. Projection must earn its place.
        </div>
      )}
      {block(
        "VISION",
        <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55 }}>
          Filipino stories told with world-class immersive craft — a Philippine and Asian creative-tech scene with its own
          guild, language, and lineage.
        </div>
      )}
      {block(
        "MISSION",
        <div>
          {li("PRACTICE — build a sustainable immersive / projection practice: KNOWMAD · JAGStudio · CueCraft")}
          {li("COMMUNITY — found the guild for Philippine & Asian creative technologists")}
          {li("TEACH — workshops & mentorship; carry the lineage forward to the next generation")}
        </div>
      )}
      {block(
        "SIGNATURE",
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
          Text as atmosphere · a small figure in a vast projected landscape · technology in service of the story, never
          decoration.
        </div>
      )}
    </div>
  );
}

// ——— MAIN ———————————————————————————
export default function JAGQuest() {
  const [page, setPage] = useState("quest");
  const [done, setDone] = useState({});
  const [dbEdits, setDbEdits] = useState({});
  const [open, setOpen] = useState({ sprint: true });
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);
  const dbTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await appStorage.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (parsed && typeof parsed === "object") setDone(parsed.done || {});
        }
      } catch (e) {}
      try {
        const res2 = await appStorage.get(DB_KEY);
        if (res2 && res2.value) {
          const parsed2 = JSON.parse(res2.value);
          if (parsed2 && typeof parsed2 === "object") setDbEdits(parsed2);
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await appStorage.set(STORAGE_KEY, JSON.stringify({ done }));
      } catch (e) {
        console.error("save failed", e);
      }
    }, 400);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [done, loaded]);

  const scheduleDbSave = (next) => {
    if (dbTimer.current) clearTimeout(dbTimer.current);
    dbTimer.current = setTimeout(async () => {
      try {
        await appStorage.set(DB_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("db save failed", e);
      }
    }, 600);
  };

  const toggle = (id) => setDone((d) => ({ ...d, [id]: !d[id] }));

  const earned = ALL_TASKS.reduce((s, t) => s + (done[t.id] ? t.xp : 0), 0);
  const pct = Math.round((earned / TOTAL_XP) * 100);
  const doneCount = ALL_TASKS.filter((t) => done[t.id]).length;

  const resetAll = async () => {
    if (!window.confirm("RESET ALL PROGRESS?")) return;
    setDone({});
    try {
      await appStorage.set(STORAGE_KEY, JSON.stringify({ done: {} }));
    } catch (e) {}
  };

  const tabBtn = (id, label) => (
    <button
      key={id}
      onClick={() => setPage(id)}
      style={{
        fontFamily: mono,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "9px 2px",
        flex: 1,
        cursor: "pointer",
        background: page === id ? C.magenta : "transparent",
        color: page === id ? "#0A0A12" : C.magenta,
        border: `2px solid ${C.magenta}`,
        boxShadow: page === id ? `0 0 14px ${C.magenta}66` : "none",
        transition: "all 150ms",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Avenir Next','Segoe UI',system-ui,sans-serif",
        paddingBottom: 70,
      }}
    >
      <Scanlines />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 12px" }}>
        <div style={{ textAlign: "center", paddingTop: 26, fontFamily: mono }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: C.cyan,
              textShadow: `0 0 18px ${C.cyan}88, 0 0 4px ${C.cyan}`,
            }}
          >
            JAG QUEST
          </div>
          <div style={{ fontSize: 10.5, color: C.dim, letterSpacing: "0.3em", marginTop: 4 }}>
            NYC → DXB → SEA → MNL
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18, fontFamily: mono }}>
          {[
            { k: "SCORE", v: `${earned}`, c: C.yellow },
            { k: "CLEARED", v: `${doneCount}/${ALL_TASKS.length}`, c: C.green },
            { k: "PROGRESS", v: `${pct}%`, c: C.magenta },
          ].map((s) => (
            <div key={s.k} style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9.5, letterSpacing: "0.2em", color: C.dim }}>{s.k}</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: s.c, marginTop: 3 }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, border: `1px solid ${C.border}`, background: C.panel, padding: 4, display: "flex", gap: 3 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 14,
                background: i < Math.round(pct / 5) ? C.cyan : "#1B1B30",
                boxShadow: i < Math.round(pct / 5) ? `0 0 6px ${C.cyan}88` : "none",
                transition: "all 250ms",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 5, marginTop: 16, flexWrap: "wrap" }}>
          {tabBtn("quest", "QUEST")}
          {tabBtn("cal", "CAL")}
          {tabBtn("inq", "INQ")}
          {tabBtn("db", "CLIENTS")}
          {tabBtn("vm", "V&M")}
        </div>

        {page === "quest" && (
          <div>
            {LEVELS.map((lvl) => {
              const lvlDone = lvl.tasks.filter((t) => done[t.id]).length;
              const isOpen = !!open[lvl.id];
              const complete = lvlDone === lvl.tasks.length;
              return (
                <div key={lvl.id} style={{ marginTop: 14, border: `1px solid ${complete ? C.green : C.border}`, background: C.panel }}>
                  <button
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      color: C.text,
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontFamily: mono,
                    }}
                    onClick={() => setOpen((o) => ({ ...o, [lvl.id]: !o[lvl.id] }))}
                  >
                    <span style={{ color: complete ? C.green : C.cyan, fontSize: 13 }}>{complete ? "★" : isOpen ? "▼" : "►"}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em" }}>{lvl.name}</span>
                      <span style={{ fontSize: 10, color: C.dim, marginLeft: 8 }}>{lvl.sub}</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: complete ? C.green : C.dim }}>
                      {lvlDone}/{lvl.tasks.length}
                    </span>
                  </button>
                  {isOpen &&
                    lvl.tasks.map((t) => {
                      const c = !!done[t.id];
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggle(t.id)}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                            width: "100%",
                            textAlign: "left",
                            background: c ? "#0E1A14" : "transparent",
                            border: "none",
                            borderTop: `1px solid ${C.border}`,
                            padding: "10px 14px",
                            cursor: "pointer",
                            color: c ? C.dim : C.text,
                            fontFamily: "inherit",
                            fontSize: 13.5,
                            lineHeight: 1.4,
                            textDecoration: c ? "line-through" : "none",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: mono,
                              flexShrink: 0,
                              width: 18,
                              height: 18,
                              marginTop: 1,
                              border: `2px solid ${c ? C.green : C.dim}`,
                              color: C.green,
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {c ? "✓" : ""}
                          </span>
                          <span style={{ flex: 1 }}>{t.label}</span>
                          {t.due && !c && (
                            <span
                              style={{
                                fontFamily: mono,
                                fontSize: 9.5,
                                fontWeight: 700,
                                color: C.magenta,
                                border: `1px solid ${C.magenta}`,
                                padding: "1px 5px",
                                flexShrink: 0,
                                letterSpacing: "0.08em",
                              }}
                            >
                              {t.due}
                            </span>
                          )}
                          <span style={{ fontFamily: mono, fontSize: 10, color: C.yellow, flexShrink: 0, marginTop: 2 }}>+{t.xp}</span>
                        </button>
                      );
                    })}
                </div>
              );
            })}
            <div style={{ textAlign: "center", marginTop: 22 }}>
              <button
                onClick={resetAll}
                style={{
                  fontFamily: mono,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  background: "transparent",
                  border: `1px solid ${C.dim}`,
                  color: C.dim,
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                RESET
              </button>
            </div>
          </div>
        )}

        {page === "cal" && <CalendarPager />}
        {page === "inq" && <InquiriesPage done={done} toggle={toggle} />}
        {page === "db" && <ClientDB edits={dbEdits} setEdits={setDbEdits} scheduleSave={scheduleDbSave} />}
        {page === "vm" && <VisionPage />}
      </div>
    </div>
  );
}
