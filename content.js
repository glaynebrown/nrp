/* Everything the app teaches, typed up from Bella's "NRP notes" pages.
   Edit here to change what the cards say.

   Anything here can be changed in the app (Reference → Edit cards); those
   changes are saved to your account and laid on top of this.

   Little markup used in the text:
     ==words==   peach = values (doses, pressures, times)
     ++words++   lavender = the key action a step leads to (Start PPV, CPAP, epi route…)
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
    { id: 'g-prep', phase: 'prep', icon: 'clipboard', title: 'Prep', cards: ['prep'] },
    { id: 'g-golden', phase: 'first', icon: 'stopwatch', title: 'Golden minute', timer: 'First 60 seconds', cards: ['rapid', 'initial', 'decision'] },
    { id: 'g-ppv', phase: 'vent', icon: 'lungs', title: 'PPV', cards: ['ppv', 'mrsopa'] },
    { id: 'g-cpr', phase: 'cpr', icon: 'heart', title: 'CPR', cards: ['cpr', 'epi'] },
    { id: 'g-vol', phase: 'meds', icon: 'drop', title: 'Hypovolemia or PTX?', cards: ['volume'] },
    { id: 'g-debrief', phase: 'after', title: 'Debrief', cards: ['debrief'], simple: true },  // simple = just the number + one sentence
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
        'All yes = ++delay cord clamping++',
      ],
      asides: ['If some are “no” → warmer, or delay some. Either is appropriate.'],
    },
    {
      id: 'initial', phase: 'first', title: 'Initial steps',
      summary: 'Warm · dry · stimulate · position · clear PRN',
      lines: [
        'Cut cord',
        'Warmer',
        '==< 32 wks== = plastic bag',
        'Warm / dry / stimulate',
        '**Sniffing** position',
        'Clear secretions **PRN**. No routine suctioning (vagal nerve → bradycardia)',
      ],
      asides: ['If immediate clamp/cut, consider milking the cord if ==> 28 wks==.'],
    },
    {
      id: 'decision', phase: 'first', title: 'The decision',
      summary: 'Breathing? HR > 100?',
      lines: [
        '**Breathing?** and ==HR > 100==?',
        'Yes + no resp. distress → check **SpO₂**. If low, can give ++blow-by++',
        'Yes + resp. distress → can give ++CPAP++ to lessen work of breathing (==PEEP 5==)',
        '**No** (apnea/gasping or ==HR < 100==) → ++Start PPV++',
      ],
    },
    {
      id: 'ppv', phase: 'vent', title: 'Start PPV',
      summary: 'Neopuff or BVM · 25/5 · HR rising by 15–30 sec?',
      lines: [
        'Neopuff or BVM · face mask or ++laryngeal mask++',
        '==Pressure 25/5== (PIP 25 / PEEP 5)',
        '==Rate 30–60== (“breathe… two… three”)',
        'HR not rising in ==15–30 sec== and no chest movement → MR. SOPA',
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
        '==**P**ressure ↑ by 5==',
        '**A**rtificial airway (consider intubation)',
      ],
      asides: [
        'Do the steps in the order most likely to help.',
        'Stay here until chest rise!',
        'Chest rise with ventilations → ==15 more sec== PPV, then HR check (==30 sec total==).',
      ],
    },
    {
      id: 'cpr', phase: 'cpr', title: 'Start compressions',
      summary: '30 sec PPV w/ chest rise + HR < 60 → compressions',
      lines: [
        'After ==30 sec== of PPV with chest rise, ==HR < 60==',
        '++Start compressions++: “1-and-2-and-3-and-breathe”',
        'Intubate with ==FiO₂ 100%== + consider cardiac monitoring',
        '==60 sec==, then HR check',
        '==HR > 60== → stop CPR + continue PPV',
      ],
      link: { tab: 'tips', label: 'Practice the rhythm' },
    },
    {
      id: 'epi', phase: 'cpr', title: 'HR still < 60 → Epi',
      summary: '1:10,000 · IV/IO 0.2 mL/kg · ET 1 mL/kg',
      lines: [
        '++IV (UVC) / IO++ · 1:10,000 · ==0.2 mL/kg== · ==q 3–5 min==',
        'After each IV/IO push → flush ==3 mL NS==',
        'If unable to get a line (until you can) → ++ET++ · 1:10,000 · ==1 mL/kg==',
      ],
      asides: ['1:10,000 = ==0.1 mg== in every mL.'],
      link: { tab: 'meds', label: 'Do the math' },
    },
    {
      id: 'volume', phase: 'meds', title: 'Hypovolemia or PTX?',
      summary: 'NS / O-neg blood 10 mL/kg · unequal chest rise = decompress',
      lines: [
        '**Hypovolemia:** NS or O-neg blood · ==10 mL/kg==',
        '**PTX:** unequal chest rise = ++needle decompression++',
      ],
      link: { tab: 'meds', label: 'Do the math' },
    },
    {
      id: 'debrief', phase: 'after', title: 'Debrief',
      summary: '',
      lines: ['Debrief the team after every resuscitation.'],
    },
  ],

  // Gestation → estimated weight (middle of the 9th ed range), for the quick buttons in Med math and Run it.
  weights: [['28 wks', 1], ['32 wks', 1.3], ['37 wks', 2.2], ['40 wks', 2.8]],

  // Weight-based doses, from the notes. mgPerMl = concentration.
  meds: [
    { id: 'epiIV', name: 'Epi IV/IO', short: 'IV/IO epi', mlPerKg: 0.2, mgPerMl: 0.1, note: '1:10,000 · q 3–5 min · flush 3 mL NS after' },
    { id: 'epiET', name: 'Epi ET', short: 'ET epi', mlPerKg: 1, mgPerMl: 0.1, note: '1:10,000 · only until a line is in' },
    { id: 'ns', name: 'Normal saline', short: 'NS', mlPerKg: 10, mgPerMl: null, note: 'or O-neg blood' },
  ],

  // Target SpO₂ (9th edition: starts at 2 min).
  spo2: [
    ['2 min', 65, 70], ['3 min', 70, 75],
    ['4 min', 75, 80], ['5 min', 80, 85], ['10 min', 85, 95],
  ],
  // Starting FiO₂ by gestation (9th edition).
  fio2: [['≥ 35 wks', '21%'], ['32–34 wks', '21–30%'], ['< 32 wks', '≥ 30%']],
  // ETT (9th edition): [gestation, weight, tip-to-gum depth, tube size mm ID]. * = a 2.0 mm tube (optional) may be considered.
  ett: [
    ['< 23 wks', '< 500 g', '5.0–5.5 cm', '2.5*'], ['23–24 wks', '500–600 g', '5.5 cm', '2.5*'],
    ['25–26 wks', '700–800 g', '6.0 cm', '2.5*'], ['27–29 wks', '900–1,000 g', '6.5 cm', '2.5'],
    ['30–32 wks', '1,100–1,400 g', '7.0 cm', '2.5–3.0'], ['33–34 wks', '1,500–1,800 g', '7.5 cm', '3.0'],
    ['35–37 wks', '1,900–2,400 g', '8.0 cm', '3.0–3.5'], ['38–40 wks', '2,500–3,100 g', '8.5 cm', '3.5'],
    ['41–43 wks', '3,200–4,200 g', '9.0 cm', '3.5'],
  ],
};
