/* Everything the app teaches, typed up from Bella's "NRP notes" pages.
   Edit here to change what the cards say.

   Anything here can be changed in the app (Reference → Edit cards); those
   changes are saved to your account and laid on top of this.

   Little markup used in the text:
     ==words==   peach = values (doses, pressures, times)
     ++words++   lavender = the key action a step leads to (Start PPV, CPAP, epi route…)
     **words**   bold
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
        '++Start compressions++ · ==3:1 with breaths==: “1-and-2-and-3-and-breathe”',
        'Intubate or laryngeal mask with ==FiO₂ 100%== + consider cardiac monitoring',
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

  // Run it scenarios, from the NRP Scenario Builder (9th edition).
  builder: {
    // [from wks, to wks, from kg, to kg]: approximate weight for gestation
    weights: [[23, 24, 0.5, 0.6], [25, 26, 0.7, 0.8], [27, 29, 0.9, 1.0], [30, 32, 1.1, 1.4], [33, 34, 1.5, 1.8],
      [35, 37, 1.9, 2.4], [38, 40, 2.5, 3.1], [41, 43, 3.2, 4.2]],
    risks: {
      L3: ['Maternal hypertension', 'No prenatal care', 'Gestational age < 36 0/7 weeks'],
      L4: ['Mother has preeclampsia', 'Maternal magnesium therapy', 'Intrauterine growth restriction', 'Meconium-stained fluid'],
      L5: ['Category III fetal heart rate pattern', 'Mother febrile, fetus tachycardic', 'Breech or other abnormal presentation'],
      L6: ['Maternal seizures (eclampsia)', 'Failed vacuum extraction', 'Fetal bradycardia'],
      L7: ['Emergency c-section', 'General anesthesia'],
      volume: ['Motor vehicle crash (maternal/fetal trauma)', 'Prolapsed cord or tight nuchal cord', 'Extensive vaginal bleeding',
        'Fetal-maternal hemorrhage', 'Bleeding vasa previa', 'Placental laceration'],
      // Preterm scenarios may use any of the above except these.
      notPreterm: ['Meconium-stained fluid', 'Failed vacuum extraction'],
    },
    // Builder lessons: how far into the algorithm the baby takes you.
    levels: [
      { id: 'L3', name: 'Initial steps', lesson: 3, birth: ['Vaginal birth'] },
      { id: 'L4', name: 'Ventilation', lesson: 4, birth: ['Vaginal birth', 'Cesarean birth'] },
      { id: 'L5', name: 'Airway', lesson: 5, birth: ['Vaginal birth', 'Cesarean birth'] },
      { id: 'L6', name: 'Compressions', lesson: 6, birth: ['Vaginal birth', 'Cesarean birth'] },
      { id: 'L7', name: 'Medications', lesson: 7, birth: ['Emergency cesarean with general anesthesia'] },
      { id: 'OA', name: 'Obstructed airway', lesson: 7, birth: ['Vaginal birth', 'Cesarean birth'] },
    ],
    // The buttons in Run it. Preterm (lesson 8) isn't a button: any case may turn out preterm.
    severities: [
      { id: 'mild', name: 'Mild', hint: 'Fine after initial steps, maybe O₂ or CPAP', levels: ['L3'] },
      { id: 'moderate', name: 'Moderate', hint: 'Needs PPV + MR. SOPA', levels: ['L4'] },
      { id: 'severe', name: 'Severe', hint: 'Needs an airway or compressions', levels: ['L5', 'OA', 'L6'] },
      { id: 'critical', name: 'Critical', hint: 'Needs epi ± volume', levels: ['L7'] },
    ],
    pretermChance: 0.25,
  },

  /* Quiz (Study → Quiz). Checked against the 9th edition algorithm + your cards.
     type: decide = "What next?" · value · tf = true/false · wrong = "Which is wrong?" (a = the wrong one)
     a = right answer, no = wrong choices, why = shown after, card = card to link to (or tab: 'tips').
     Dose math, the dose values, SpO₂ and ETT questions are made in app.js from the doses + tables above. */
  quiz: [
    // ---- What next? ----
    { id: 'd-vigorous', type: 'decide', card: 'rapid', q: 'Term baby, good tone, crying. What next?',
      a: 'Delay cord clamping, skin to skin, routine care', no: ['Warmer for initial steps', 'Start PPV', 'Pulse oximeter + blow-by'],
      why: 'All three “yes” (term, tone, breathing) → stay with the parent. Clamp the cord after ==at least 60 sec==.' },
    { id: 'd-floppy', type: 'decide', card: 'initial', q: 'Baby is born with poor tone and isn’t breathing. What first?',
      a: 'Warm, dry, position, stimulate, clear airway if needed', no: ['Start PPV right away', 'Start compressions', 'Suction mouth and nose, then PPV'],
      why: 'Any “no” on the rapid eval → initial steps first, then decide.' },
    { id: 'd-apnea', type: 'decide', card: 'decision', q: 'After initial steps the baby is apneic. What next?',
      a: 'Start PPV + pulse oximeter, consider cardiac monitor', no: ['Keep stimulating for another minute', 'Blow-by oxygen', 'CPAP'],
      why: 'Apnea or gasping → ++Start PPV++. Pulse ox goes on with it.' },
    { id: 'd-gasp', type: 'decide', card: 'decision', q: 'Baby is gasping. ==HR 120==. What next?',
      a: 'Start PPV', no: ['CPAP', 'Pulse oximeter only, HR is fine', 'Blow-by oxygen'],
      why: 'Gasping counts as apnea, even with a good heart rate.' },
    { id: 'd-hr80', type: 'decide', card: 'decision', q: 'Baby is breathing, but ==HR is 80==. What next?',
      a: 'Start PPV', no: ['CPAP', 'Blow-by oxygen', 'Keep watching, they’re breathing'],
      why: '==HR < 100== → ++Start PPV++, even if breathing.' },
    { id: 'd-labored', type: 'decide', card: 'decision', q: 'Breathing, ==HR 130==, labored breathing. What next?',
      a: 'Pulse oximeter, oxygen if needed, consider CPAP', no: ['Start PPV', 'Intubate', 'Nothing, HR is over 100'],
      why: 'Labored breathing with ==HR > 100== → pulse ox, O₂ if needed, consider ++CPAP++ (==PEEP 5==).' },
    { id: 'd-cyan', type: 'decide', card: 'decision', q: 'Breathing, ==HR 140==, no distress, but stays cyanotic. What next?',
      a: 'Pulse oximeter, oxygen if needed', no: ['Start PPV', 'CPAP right away', 'Start compressions'],
      why: 'Persistent cyanosis → check SpO₂. If low, ++blow-by++.' },
    { id: 'd-mrsopa', type: 'decide', card: 'mrsopa', q: 'After ==15–30 sec of PPV==, HR isn’t rising and the chest isn’t moving. What next?',
      a: 'MR. SOPA', no: ['Start compressions', 'Give epi', 'Keep going the same way for 30 more sec'],
      why: 'No chest movement = the breaths aren’t getting in. Fix ventilation with the corrective steps.' },
    { id: 'd-chestup', type: 'decide', card: 'mrsopa', q: 'MR. SOPA got the chest moving. What next?',
      a: '15 more sec of PPV, then check HR', no: ['Check HR right now', 'Start compressions', 'Stop PPV and watch'],
      why: 'You want ==30 sec of effective ventilation== before the HR check.' },
    { id: 'd-hr110', type: 'decide', card: 'decision', q: 'After 30 sec of effective ventilation, ==HR is 110==. What next?',
      a: 'Post-resuscitation care, talk with family, debrief', no: ['Start compressions', 'Give epi', 'Intubate'],
      why: 'HR is no longer < 100 → post-resuscitation care.' },
    { id: 'd-hr80b', type: 'decide', card: 'mrsopa', q: 'After 30 sec of effective ventilation, ==HR is 80==. What next?',
      a: 'Keep ventilating, corrective steps, consider intubation or laryngeal mask', no: ['Start compressions', 'Give epi', 'Stop PPV'],
      why: 'HR < 100 but not < 60 → keep ventilating well. Compressions only at ==HR < 60==.' },
    { id: 'd-hr50', type: 'decide', card: 'cpr', q: 'After 30 sec of effective ventilation, ==HR is 50==. What next?',
      a: 'Intubate or laryngeal mask, compressions 3:1, 100% O₂, UVC or IO', no: ['Keep ventilating 30 more sec', 'Epi first, then compressions', 'Compressions on room air'],
      why: '==HR < 60== after 30 sec of effective ventilation → ++Start compressions++ with an airway and ==FiO₂ 100%==.' },
    { id: 'd-comp70', type: 'decide', card: 'cpr', q: 'After ==60 sec of compressions==, ==HR is 70==. What next?',
      a: 'Stop compressions, keep ventilating', no: ['Keep compressions until HR > 100', 'Give epi', 'Stop everything'],
      why: '==HR > 60== → stop CPR and continue PPV.' },
    { id: 'd-comp40', type: 'decide', card: 'epi', q: 'After ==60 sec of compressions==, ==HR is 40==. What next?',
      a: 'Epi by UVC or IO', no: ['Volume first', 'Stop compressions', 'Needle decompression'],
      why: 'HR still < 60 with good ventilation and compressions → epi. ++IV (UVC) / IO++ is the best route.' },
    { id: 'd-epi2', type: 'decide', card: 'volume', q: 'Epi was given 3 min ago. ==HR is still 40==. What next?',
      a: 'Repeat epi, consider hypovolemia or pneumothorax', no: ['Wait 5 more min', 'Stop compressions', 'Double the epi dose'],
      why: 'Epi ==q 3–5 min==. If HR stays < 60, think about blood loss or a PTX.' },
    { id: 'd-bleed', type: 'decide', card: 'volume', q: 'HR stays < 60. Mom had heavy bleeding and the baby is pale. What next?',
      a: 'NS or O-neg blood 10 mL/kg', no: ['Needle decompression', 'More epi only', 'Stop and call it'],
      why: 'Suspected blood loss → volume: NS or O-neg blood ==10 mL/kg==.' },
    { id: 'd-ptx', type: 'decide', card: 'volume', q: 'The baby suddenly gets worse and chest rise is unequal. What next?',
      a: 'Needle decompression', no: ['Give volume', 'More pressure', 'Give epi'],
      why: 'Unequal chest rise = think PTX → ++needle decompression++.' },
    { id: 'd-etepi', type: 'decide', card: 'epi', q: '==HR < 60== after compressions. Baby is intubated but there’s no line yet. What next?',
      a: 'ET epi 1 mL/kg while the line goes in', no: ['Wait for the line', 'IV dose (0.2 mL/kg) down the ETT', 'Skip epi, give volume'],
      why: 'ET epi is only until a line is in: ==1 mL/kg== of 1:10,000.' },
    { id: 'd-o2', type: 'decide', card: 'cpr', q: 'You’re starting compressions. What FiO₂?',
      a: '100%', no: ['21%', '30%', 'Whatever the SpO₂ target says'],
      why: 'Compressions → ==FiO₂ 100%==.' },
    { id: 'd-bag', type: 'decide', card: 'initial', q: 'A ==30 week== baby is born. Before you dry?',
      a: 'Plastic bag or wrap', no: ['Dry them well first', 'Skin to skin', 'Start PPV'],
      why: '==< 32 wks== = plastic bag. Don’t dry first.' },
    { id: 'd-milk31', type: 'decide', card: 'initial', q: 'A ==31 week== baby needs the cord clamped right away. Cord?',
      a: 'Consider milking the cord', no: ['Never milk under 35 wks', 'Delay clamping 60 sec anyway', 'Clamp and cut, no other option'],
      why: 'If immediate clamp/cut, consider milking the cord if ==> 28 wks==.' },
    { id: 'd-milk26', type: 'decide', card: 'initial', q: 'A ==26 week== baby needs the cord clamped right away. Milk the cord?',
      a: 'No: risk of brain bleeding under 28 wks', no: ['Yes, always milk preemies', 'Yes, milk it twice', 'Only if the HR is low'],
      why: 'Cord milking isn’t recommended ==< 28 wks== (severe IVH risk).' },

    // ---- Values ----
    { id: 'v-ppv', type: 'value', card: 'decision', q: 'Heart rate that means **start PPV**?',
      a: 'HR < 100', no: ['HR < 60', 'HR < 120', 'HR < 80'], why: '==HR < 100== (or apnea/gasping) → PPV.' },
    { id: 'v-comp', type: 'value', card: 'cpr', q: 'Heart rate that means **start compressions**?',
      a: 'HR < 60', no: ['HR < 100', 'HR < 80', 'HR < 40'], why: '==HR < 60== after 30 sec of effective ventilation.' },
    { id: 'v-stop', type: 'value', card: 'cpr', q: 'When can you **stop compressions**?',
      a: 'HR > 60', no: ['HR > 100', 'HR > 80', 'SpO₂ in target'], why: '==HR > 60== → stop CPR, keep ventilating.' },
    { id: 'v-rate', type: 'value', card: 'ppv', q: '**PPV rate**?',
      a: '30–60 / min', no: ['40–60 / min', '20–40 / min', '60–80 / min'], why: '9th edition: ==Rate 30–60== (“breathe… two… three”).' },
    { id: 'v-press', type: 'value', card: 'ppv', q: 'Starting **pressures** for PPV?',
      a: 'PIP 25 / PEEP 5', no: ['PIP 20 / PEEP 0', 'PIP 30 / PEEP 5', 'PIP 40 / PEEP 8'], why: '==Pressure 25/5==.' },
    { id: 'v-pip32', type: 'value', card: 'ppv', q: 'Acceptable **starting PIP** range at ==≥ 32 wks==?',
      a: '25–30', no: ['20–25', '15–20', '30–40'], why: 'Start at 25. Acceptable starting range: ==≥ 32 wks 25–30==, ==< 32 wks 20–25==.' },
    { id: 'v-pip-pre', type: 'value', card: 'ppv', q: 'Acceptable **starting PIP** range at ==< 32 wks==?',
      a: '20–25', no: ['25–30', '15–20', '30–35'], why: 'Start at 25. Acceptable starting range: ==< 32 wks 20–25==, ==≥ 32 wks 25–30==.' },
    { id: 'v-pip-up', type: 'value', card: 'mrsopa', q: 'In MR. SOPA, how much do you raise the **PIP** each time?',
      a: 'By 5', no: ['By 2', 'By 10', 'Straight to 40'], why: '**P** = ==PIP ↑ by 5== until the chest moves.' },
    { id: 'v-wait', type: 'value', card: 'ppv', q: 'How long into PPV before you start **corrective steps** (if HR isn’t rising and no chest movement)?',
      a: '15–30 sec', no: ['5 sec', '60 sec', '2 min'], why: 'HR not rising in ==15–30 sec== and no chest movement → MR. SOPA.' },
    { id: 'v-eff', type: 'value', card: 'mrsopa', q: 'How long of **effective ventilation** before the HR check?',
      a: '30 sec', no: ['15 sec', '60 sec', '2 min'], why: '==30 sec total== with chest movement, then check HR.' },
    { id: 'v-compt', type: 'value', card: 'cpr', q: 'How long of **compressions** before the HR check?',
      a: '60 sec', no: ['30 sec', '15 sec', '2 min'], why: '==60 sec==, then HR check.' },
    { id: 'v-ratio', type: 'value', card: 'cpr', q: '**Compressions to breaths** ratio?',
      a: '3:1', no: ['15:2', '30:2', '5:1'], why: '==3:1 with breaths==: “1-and-2-and-3-and-breathe”.' },
    { id: 'v-cpap', type: 'value', card: 'decision', q: '**CPAP** pressure?',
      a: 'PEEP 5', no: ['PEEP 10', 'PIP 25', 'PEEP 2'], why: '++CPAP++ at ==PEEP 5==.' },
    { id: 'v-q', type: 'value', card: 'epi', q: 'How often can you give **epi**?',
      a: 'Every 3–5 min', no: ['Every 1 min', 'Every 10 min', 'Only once'], why: 'Epi ==q 3–5 min==.' },
    { id: 'v-flush', type: 'value', card: 'epi', q: 'Flush after each IV/IO **epi**?',
      a: '3 mL NS', no: ['1 mL NS', '10 mL/kg NS', 'No flush'], why: 'Flush ==3 mL NS== after each IV/IO push.' },
    { id: 'v-fio2-35', type: 'value', tab: 'tips', q: 'Starting **FiO₂** at ==≥ 35 wks==?',
      a: '21%', no: ['21–30%', '≥ 30%', '100%'], why: '≥ 35 wks: ==21%== (room air).' },
    { id: 'v-fio2-32', type: 'value', tab: 'tips', q: 'Starting **FiO₂** at ==32–34 wks==?',
      a: '21–30%', no: ['21%', '≥ 30%', '100%'], why: '32–34 wks: ==21–30%==.' },
    { id: 'v-fio2-pre', type: 'value', tab: 'tips', q: 'Starting **FiO₂** at ==< 32 wks==?',
      a: '≥ 30%', no: ['21%', '21–30%', '100%'], why: '< 32 wks: ==≥ 30%==.' },
    { id: 'v-dcc', type: 'value', card: 'rapid', q: 'Delay cord clamping for **at least**…',
      a: '60 sec', no: ['30 sec', '15 sec', '3 min'], why: '9th edition: at least ==60 sec==.' },
    { id: 'v-bag', type: 'value', card: 'initial', q: 'Plastic bag/wrap for babies under…',
      a: '32 wks', no: ['28 wks', '35 wks', '37 wks'], why: '==< 32 wks== = plastic bag.' },
    { id: 'v-spo2start', type: 'value', tab: 'tips', q: 'The **SpO₂ target** table starts at…',
      a: '2 min', no: ['1 min', '5 min', '10 min'], why: '9th edition: targets start at ==2 min== (65–70%).' },
    { id: 'v-depth', type: 'value', tab: 'tips', q: '**ETT depth** is measured from the tip to…',
      a: 'The upper gum, midline', no: ['The lip', 'The nose', 'The ear'], why: '9th edition: **tip-to-gum** (not tip-to-lip).' },

    // ---- True or false ----
    { id: 't-suction', type: 'tf', card: 'initial', q: 'Suction every newborn routinely.', a: 'False',
      why: 'Only clear secretions **PRN**. Routine suction can cause a vagal bradycardia.' },
    { id: 't-order', type: 'tf', card: 'mrsopa', q: 'MR. SOPA must be done in exact order.', a: 'False',
      why: 'Do the steps in the order most likely to help.' },
    { id: 't-lma', type: 'tf', card: 'ppv', q: 'A laryngeal mask is only a rescue airway.', a: 'False',
      why: '9th edition: PPV can start with a face mask or a ++laryngeal mask++.' },
    { id: 't-spo2-1', type: 'tf', tab: 'tips', q: 'The SpO₂ target at 1 minute is 60–65%.', a: 'False',
      why: 'That was the 8th edition. Targets now start at ==2 min== (65–70%).' },
    { id: 't-1000', type: 'tf', card: 'epi', q: '1:10,000 and 1:1,000 epi can be used interchangeably.', a: 'False',
      why: '1:1,000 is ==1 mg/mL==, **10× stronger** than 1:10,000 (==0.1 mg/mL==).' },
    { id: 't-lip', type: 'tf', tab: 'tips', q: 'ETT depth is measured tip-to-lip.', a: 'False',
      why: '9th edition: **tip-to-gum** (upper gum, midline).' },
    { id: 't-comp100', type: 'tf', card: 'cpr', q: 'Start compressions when HR is under 100.', a: 'False',
      why: 'Compressions at ==HR < 60== (after 30 sec of effective ventilation). < 100 = PPV.' },
    { id: 't-comp30', type: 'tf', card: 'cpr', q: 'Check the HR after 30 sec of compressions.', a: 'False',
      why: '==60 sec== of compressions, then check.' },
    { id: 't-rate', type: 'tf', card: 'ppv', q: 'The PPV rate is 40–60 breaths/min.', a: 'False',
      why: '9th edition: ==Rate 30–60==.' },
    { id: 't-gasp', type: 'tf', card: 'decision', q: 'Gasping counts as breathing.', a: 'False',
      why: 'Gasping = apnea → ++Start PPV++.' },
    { id: 't-warmer', type: 'tf', card: 'rapid', q: 'A vigorous term baby needs to go to the warmer.', a: 'False',
      why: 'Term + tone + breathing → skin to skin, routine care.' },
    { id: 't-stop60', type: 'tf', card: 'cpr', q: 'You can stop compressions once HR is over 60.', a: 'True',
      why: '==HR > 60== → stop CPR, keep ventilating.' },
    { id: 't-etline', type: 'tf', card: 'epi', q: 'ET epi is only used until a line is in.', a: 'True',
      why: 'IV (UVC) / IO is the preferred route. ET only until you have one.' },
    { id: 't-debrief', type: 'tf', card: 'debrief', q: 'Debrief the team after every resuscitation.', a: 'True',
      why: 'Every one, even when it went well.' },

    // ---- Which is wrong? (a = the wrong statement) ----
    { id: 'w-epi', type: 'wrong', card: 'epi', q: 'Epi: which one is **wrong**?',
      a: 'ET dose is 0.2 mL/kg', no: ['Use 1:10,000', 'IV/IO dose is 0.2 mL/kg', 'Repeat every 3–5 min'],
      why: 'ET epi is ==1 mL/kg==. IV/IO is ==0.2 mL/kg==.' },
    { id: 'w-initial', type: 'wrong', card: 'initial', q: 'Initial steps: which one is **wrong**?',
      a: 'Suction every baby', no: ['Warm', 'Dry and stimulate', 'Sniffing position'],
      why: 'Clear secretions only **PRN**.' },
    { id: 'w-mrsopa', type: 'wrong', card: 'mrsopa', q: 'MR. SOPA: which one is **wrong**?',
      a: 'A = Add oxygen', no: ['M = Mask adjustment', 'R = Reposition head', 'O = Open mouth'],
      why: '**A** = **A**rtificial airway (intubation or laryngeal mask).' },
    { id: 'w-comp', type: 'wrong', card: 'cpr', q: 'Compressions: which one is **wrong**?',
      a: 'Check HR after 30 sec', no: ['Start at HR < 60', 'FiO₂ 100%', '3:1 with breaths'],
      why: 'Check HR after ==60 sec== of compressions.' },
    { id: 'w-preterm', type: 'wrong', card: 'initial', q: 'Baby ==< 32 wks==: which one is **wrong**?',
      a: 'Milk the cord at 26 wks', no: ['Plastic bag', 'Start FiO₂ ≥ 30%', 'Starting PIP 20–25'],
      why: 'No cord milking ==< 28 wks== (brain bleed risk).' },
    { id: 'w-golden', type: 'wrong', card: 'rapid', q: 'Golden minute: which one is **wrong**?',
      a: 'Start compressions', no: ['Birth', 'Cord plan', 'Rapid eval'],
      why: 'The first minute is birth, cord plan, rapid eval, initial steps and starting PPV if needed. Compressions come much later.' },
  ],
};
