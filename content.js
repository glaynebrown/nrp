/* Everything the app teaches, typed up from Bella's "NRP notes" pages.
   Edit here to change what the cards say.

   Anything here can be changed in the app (Reference → Edit cards); those
   changes are saved to your account and laid on top of this.

   Little markup used in the text:
     ==words==   peach highlight      ++words++   lavender highlight
     **words**   bold                 [[verify]]  "check your book" dot
   The 6 big steps are `groups`; each card is a substep. Each card has `lines` (the main points) and optional `asides` (the side
   notes with a * in the notes). In Study mode each line is hidden until tapped. */
const NRP = {
  phases: {
    prep:   { label: 'Prep' },
    first:  { label: 'Golden minute' },
    vent:   { label: 'PPV' },
    cpr:    { label: 'CPR' },
    meds:   { label: 'Hypovolemia / PTX' },
    after:  { label: 'Debrief' },
  },

  // The 6 big steps. Each lists its substeps (cards below) in order.
  groups: [
    { id: 'g-prep', phase: 'prep', title: 'Prep', cards: ['prep'] },
    { id: 'g-golden', phase: 'first', title: 'Golden minute', timer: 'First 60 seconds', cards: ['rapid', 'initial', 'decision'] },
    { id: 'g-ppv', phase: 'vent', title: 'PPV', cards: ['ppv', 'mrsopa'] },
    { id: 'g-cpr', phase: 'cpr', title: 'CPR', cards: ['cpr', 'epi'] },
    { id: 'g-vol', phase: 'meds', title: 'Hypovolemia? or PTX?', cards: ['volume'] },
    { id: 'g-debrief', phase: 'after', title: 'Debrief', cards: ['debrief'] },
  ],

  cards: [
    {
      id: 'prep', phase: 'prep', title: 'Prep',
      summary: 'Gestation · fluid · risk factors · cord plan',
      lines: [
        '**Gestation?** (estimates weight)',
        '**Amniotic fluid** color?',
        'Any **maternal risk factors**?',
        '**Cord plan**?',
      ],
    },
    {
      id: 'rapid', phase: 'first', title: 'Rapid eval',
      summary: 'Term? Breathing/crying? Good tone?',
      lines: [
        'Appear **term**?',
        '**Crying / breathing**?',
        'Good **tone**?',
        'All yes = ==delay cord clamping==',
      ],
      asides: ['If some are “no” → warmer, or delay some. Either is appropriate.'],
    },
    {
      id: 'initial', phase: 'first', title: 'Initial steps',
      summary: 'Warm · dry · stimulate · position · clear PRN',
      lines: [
        'Cut cord',
        'Warmer',
        '==< 32 wks = bag== (plastic wrap)',
        'Warm / dry / stimulate',
        '**Sniffing** position',
        'Clear secretions **PRN**. No routine suctioning (vagal nerve → bradycardia)',
      ],
      asides: ['If immediate clamp/cut, consider ==milking the cord if > 28 wks==.'],
    },
    {
      id: 'decision', phase: 'first', title: 'The decision',
      summary: 'Breathing? HR > 100?',
      lines: [
        '**Breathing?** and **HR > 100?**',
        'Yes + no resp. distress → check **SpO₂**. If low, can give ++blow-by++',
        'Yes + resp. distress → can give ++CPAP++ to lessen work of breathing (++PEEP = 5++)',
        '**No** (apnea/gasping or HR < 100) → ==Start PPV==',
      ],
    },
    {
      id: 'ppv', phase: 'vent', title: 'Start PPV',
      summary: 'Neopuff or BVM · 25/5 · 15 sec then HR check',
      lines: [
        'Neopuff or BVM to ventilate',
        '==Pressure 25/5== (PIP 25 / PEEP 5)',
        'Rate 30–60 (“breathe… two… three”)',
        '**15 sec**, then HR check',
      ],
      link: { tab: 'tips', label: 'See PEEP vs PIP' },
    },
    {
      id: 'mrsopa', phase: 'vent', title: 'No chest rise? MR. SOPA',
      summary: 'Fix the seal, airway, pressure. Stay here until chest rise!',
      lines: [
        '**M**ask adjustment',
        '**R**eposition head',
        '**S**uction',
        '**O**pen mouth',
        '**P**ressure ↑ by 5',
        '**A**rtificial airway (consider intubation)',
      ],
      asides: [
        'Stay here until chest rise!',
        'Chest rise with ventilations → 15 more sec PPV, then HR check (==30 sec total==).',
      ],
    },
    {
      id: 'cpr', phase: 'cpr', title: 'Start compressions',
      summary: '30 sec PPV w/ chest rise + HR < 60 → compressions',
      lines: [
        '++Total of 30 sec PPV with chest rise++ and ==HR < 60==',
        '**Start compressions:** “1-and-2-and-3-and-breathe”',
        'Intubate with **FiO₂ 100%** + consider **cardiac monitoring**',
        '++60 sec++, then HR check',
        'HR > 60 → stop CPR + continue PPV',
      ],
      link: { tab: 'tips', label: 'Practice the rhythm' },
    },
    {
      id: 'epi', phase: 'cpr', title: 'HR still < 60 → Epi',
      summary: '1:10,000 · IV/IO 0.2 mL/kg · ET 1 mL/kg',
      lines: [
        '++IV (UVC) / IO++ · 1:10,000 · ==0.2 mL/kg== · q 3–5 min',
        'After each IV/IO push → **flush 3 mL NS**',
        'If unable to get a line (until you can) → ++ET++ · 1:10,000 · ==1 mL/kg==',
      ],
      asides: ['1:10,000 = **0.1 mg in every mL**.'],
      link: { tab: 'meds', label: 'Do the math' },
    },
    {
      id: 'volume', phase: 'meds', title: 'Hypovolemia? or PTX?',
      summary: 'NS / O-neg blood 10 mL/kg · unequal chest rise = decompress',
      lines: [
        '**Hypovolemia:** NS or O-neg blood · ==10 mL/kg==',
        '**PTX:** unequal chest rise = ++needle decompression++',
      ],
      link: { tab: 'meds', label: 'Do the math' },
    },
    {
      id: 'debrief', phase: 'after', title: 'Debrief',
      summary: 'What went well · what to change',
      lines: ['**Debrief** the team after every resuscitation'],
    },
  ],

  // Gestation → estimated weight, for the quick buttons in Med math and Run it.
  weights: [['28 wks', 1], ['32 wks', 2], ['37 wks', 3]],

  // Weight-based doses, from the notes. mgPerMl = concentration.
  meds: [
    { id: 'epiIV', name: 'Epi IV/IO', short: 'IV/IO epi', mlPerKg: 0.2, mgPerMl: 0.1, note: '1:10,000 · q 3–5 min · flush 3 mL NS after' },
    { id: 'epiET', name: 'Epi ET', short: 'ET epi', mlPerKg: 1, mgPerMl: 0.1, note: '1:10,000 · only until a line is in' },
    { id: 'ns', name: 'Normal saline', short: 'NS', mlPerKg: 10, mgPerMl: null, note: 'or O-neg blood' },
  ],

  // Less focus: reference only. Standard NRP values; verify with your book/unit guide.
  spo2: [
    ['1 min', 60, 65], ['2 min', 65, 70], ['3 min', 70, 75],
    ['4 min', 75, 80], ['5 min', 80, 85], ['10 min', 85, 95],
  ],
  // Starting FiO₂ by gestation (9th edition).
  fio2: [['≥ 35 wks', '21%'], ['32–34 wks', '21–30%'], ['< 32 wks', '≥ 30%']],
  ett: [
    ['< 1 kg', '< 28 wks', '2.5'],
    ['1–2 kg', '28–34 wks', '3.0'],
    ['> 2 kg', '> 34 wks', '3.5'],
  ],
};
