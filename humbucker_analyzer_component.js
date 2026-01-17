


function HumbuckerAnalyzer() {
  const [pickups, setPickups] = useState([{
    id: 1,
    pickupName: '',
    manufacturer: '',
    coils: {
      north: {
        positive: { color: '' },
        negative: { color: '' },
        polarity: '',
        phase: '',
        poleType: ''
      },
      south: {
        positive: { color: '' },
        negative: { color: '' },
        polarity: '',
        phase: '',
        poleType: ''
      }
    },
    notes: '',
    isTwoConductor: false,
    isReversed: false, // Track if pickup has been phase-reversed
    seriesWires: { wire1: '', wire2: '' } // Track which colors form series connection
  }]);

  const [showPhaseWarning, setShowPhaseWarning] = useState(false);
  const [phaseWarningData, setPhaseWarningData] = useState(null);
  const [showPhaseCheckModal, setShowPhaseCheckModal] = useState(false);
  const [phaseCheckData, setPhaseCheckData] = useState({ pickupIndex: 0, isTwoConductor: false, phaseDirection: '' });
  
  // Setup wizard
  const [showSetupWizard, setShowSetupWizard] = useState(true);
  const [wizardStep, setWizardStep] = useState(0); // 0 = method selection, 1 = pickup 1, 2 = pickup 2
  const [phaseTestingMethod, setPhaseTestingMethod] = useState('analog'); // 'analog', 'digital', 'naudio'
  const [showInstructions, setShowInstructions] = useState(false); // For collapsible instructions
  const [wizardData, setWizardData] = useState({
    pickup1: {
      preset: '',
      isTwoConductor: false,
      phase: '',
      isCustom: false,
      customBrand: '',
      customName: '',
      customColors: {
        northPositive: '',
        northNegative: '',
        southPositive: '',
        southNegative: ''
      },
      northPhase: '',
      southPhase: '',
      northPoleType: 'Slug',
      southPoleType: 'Screw'
    },
    pickup2: {
      preset: '',
      isTwoConductor: false,
      phase: '',
      isCustom: false,
      customBrand: '',
      customName: '',
      customColors: {
        northPositive: '',
        northNegative: '',
        southPositive: '',
        southNegative: ''
      },
      northPhase: '',
      southPhase: '',
      northPoleType: 'Slug',
      southPoleType: 'Screw'
    }
  });
  
  // Custom pickup phase mismatch modal
  const [showCustomPhaseMismatch, setShowCustomPhaseMismatch] = useState(false);
  const [customPhaseMismatchData, setCustomPhaseMismatchData] = useState({ pickupStep: 1 });
  
  // Session management
  const [savedSessions, setSavedSessions] = useState([]);
  const [currentSessionName, setCurrentSessionName] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Google Sheets integration
  const [googleSheetsPresets, setGoogleSheetsPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsLoadError, setPresetsLoadError] = useState(null);

  // Common wire color options
  const colorOptions = [
    '',
    'Black',
    'White',
    'Red',
    'Green',
    'Yellow',
    'Blue',
    'Orange',
    'Purple',
    'Brown',
    'Gray',
    'Bare/Shield'
  ];

  // Phase testing instructions based on selected method
  const getPhaseInstructions = (method) => {
    const instructions = {
      analog: {
        title: 'Analog Meter Phase Testing Instructions',
        deviceSetup: [
          'Set analog meter to lowest DC voltage range',
          'Analog meters use a moving needle indicator'
        ],
        testSteps: [
          { text: 'RED lead (+) → Connect to coil start wire', highlight: 'red' },
          { text: 'BLACK lead (−) → Connect to coil finish wire', highlight: 'black' },
          { text: 'Place screwdriver flat on coil pole pieces', highlight: null },
          { text: 'Rapidly pull screwdriver off the poles', highlight: 'yellow' },
          { text: 'Watch needle direction as you pull off', highlight: null }
        ],
        question: 'Which direction did the needle move when pulling off?',
        phaseOptions: [
          { value: '← Left', label: '← Left', display: 'Left' },
          { value: '→ Right', label: '→ Right', display: 'Right' }
        ],
        visualNote: 'The yellow arrow direction in the pickup visualizer matches your needle movement direction.',
        visualMappings: [
          'Needle moved LEFT = ← Yellow arrow points LEFT in visualizer',
          'Needle moved RIGHT = → Yellow arrow points RIGHT in visualizer'
        ]
      },
      digital: {
        title: 'Digital Multimeter Phase Testing Instructions',
        deviceSetup: [
          'Set digital multimeter to DC voltage (lowest range)',
          'Digital meters show positive (+) or negative (-) values'
        ],
        testSteps: [
          { text: 'RED lead (+) → Connect to coil start wire', highlight: 'red' },
          { text: 'BLACK lead (−) → Connect to coil finish wire', highlight: 'black' },
          { text: 'Place screwdriver flat on coil pole pieces', highlight: null },
          { text: 'Rapidly pull screwdriver off the poles', highlight: 'yellow' },
          { text: 'Watch if voltage reading goes UP or DOWN', highlight: null }
        ],
        question: 'Did the voltage go UP (positive) or DOWN (negative) when pulling off?',
        phaseOptions: [
          { value: '↓ Down', label: '↓ Down (Negative)', display: 'Down (Negative)' },
          { value: '↑ Up', label: '↑ Up (Positive)', display: 'Up (Positive)' }
        ],
        visualNote: 'DOWN (negative) = LEFT arrow | UP (positive) = RIGHT arrow in the pickup visualizer.',
        visualMappings: [
          'Voltage went DOWN = ← Yellow arrow points LEFT in visualizer',
          'Voltage went UP = → Yellow arrow points RIGHT in visualizer'
        ]
      },
      naudio: {
        title: 'N-Audio Phase Checker Instructions',
        deviceSetup: [
          'Professional pickup phase testing device',
          'Learn more: N-Audio Guitar Pickup Phase Checker'
        ],
        deviceLink: 'https://n-audio.net/guitar-pickup-phase-checker/',
        testSteps: [
          { text: 'Connect coil start wire to Phase Checker input', highlight: null },
          { text: 'Connect coil finish wire to Phase Checker ground', highlight: null },
          { text: 'Power on the N-Audio Phase Checker device', highlight: null },
          { text: 'Tap on the pickup with a large flat metal object', highlight: 'yellow' },
          { text: 'Read the LED indicator color', highlight: null }
        ],
        question: 'Which LED lit up on the Phase Checker?',
        phaseOptions: [
          { value: '🔴 Red', label: '🔴 Red (Negative Phase)', display: 'Red (Negative Phase)' },
          { value: '🟢 Green', label: '🟢 Green (Positive Phase)', display: 'Green (Positive Phase)' }
        ],
        visualNote: 'RED LED = LEFT arrow | GREEN LED = RIGHT arrow in the pickup visualizer.',
        visualMappings: [
          'RED LED = ← Yellow arrow points LEFT in visualizer',
          'GREEN LED = → Yellow arrow points RIGHT in visualizer'
        ]
      }
    };

    return instructions[method] || instructions.analog;
  };

  // Normalize phase value to "negative" or "positive" for cross-method compatibility
  const normalizePhase = (phaseValue) => {
    if (!phaseValue) return null;

    const valueStr = String(phaseValue).toLowerCase();

    // All "left/down/red" values are negative phase
    if (
      valueStr.includes('left') ||
      valueStr.includes('down') ||
      valueStr.includes('red') ||
      valueStr.includes('↓') ||
      valueStr.includes('←') ||
      valueStr.includes('🔴') ||
      valueStr.includes('negative')
    ) {
      return 'negative';
    }
    // All "right/up/green" values are positive phase
    if (
      valueStr.includes('right') ||
      valueStr.includes('up') ||
      valueStr.includes('green') ||
      valueStr.includes('↑') ||
      valueStr.includes('→') ||
      valueStr.includes('🟢') ||
      valueStr.includes('positive')
    ) {
      return 'positive';
    }
    return null;
  };

  // Get display-friendly phase label based on testing method
  const getPhaseDisplay = (phaseValue) => {
    if (!phaseValue) return '';

    const instructions = getPhaseInstructions(phaseTestingMethod);

    // First try direct match with current method
    const directMatch = instructions.phaseOptions.find(opt => opt.value === phaseValue);
    if (directMatch) {
      return directMatch.display;
    }

    // If no direct match, normalize and convert to current method
    const normalized = normalizePhase(phaseValue);

    if (normalized === 'negative') {
      // Return the first option (which is always negative/left/down/red)
      return instructions.phaseOptions[0].display;
    } else if (normalized === 'positive') {
      // Return the second option (which is always positive/right/up/green)
      return instructions.phaseOptions[1].display;
    }

    // Fallback: return original value
    return phaseValue;
  };

  // Flip phase value to opposite (for phase reversal)
  const flipPhaseValue = (currentPhase) => {
    const instructions = getPhaseInstructions(phaseTestingMethod);
    const normalized = normalizePhase(currentPhase);

    if (normalized === 'negative') {
      // Flip to positive (second option)
      return instructions.phaseOptions[1].value;
    } else if (normalized === 'positive') {
      // Flip to negative (first option)
      return instructions.phaseOptions[0].value;
    }

    // Fallback: return analog values
    if (currentPhase && currentPhase.includes('Left')) {
      return '→ Right';
    } else {
      return '← Left';
    }
  };

  // Preset database based on official pickup color code charts
  // IMPORTANT: North start (positive/left) = HOT output, South start (positive/left) = GROUND
  // Series connection: North finish (negative/right) connects to South finish (negative/right)
  const presetDatabase = [
    { name: '-- Select a Preset --', manufacturer: '', north: { positive: '', negative: '', poleType: '' }, south: { positive: '', negative: '', poleType: '' } },
    { name: 'Custom/Unknown Pickup', manufacturer: 'Custom', north: { positive: '', negative: '', poleType: '' }, south: { positive: '', negative: '', poleType: '' } },
    // Seymour Duncan: Green(GND left) / Red-White series / Black(HOT right)
    { name: 'Seymour Duncan', manufacturer: 'Seymour Duncan', north: { positive: 'Green', negative: 'Red', poleType: 'Slug' }, south: { positive: 'White', negative: 'Black', poleType: 'Screw' } },
    { name: 'Duncan Designed', manufacturer: 'Duncan Designed', north: { positive: 'Green', negative: 'Red', poleType: 'Slug' }, south: { positive: 'White', negative: 'Black', poleType: 'Screw' } },
    // DiMarzio: Green(GND left) / Black-White series / Red(HOT right)
    { name: 'DiMarzio', manufacturer: 'DiMarzio', north: { positive: 'Green', negative: 'Black', poleType: 'Slug' }, south: { positive: 'White', negative: 'Red', poleType: 'Screw' } },
    // Gibson Aftermarket: Black(GND left) / White-Green series / Red(HOT right)
    { name: 'Gibson (Aftermarket)', manufacturer: 'Gibson', north: { positive: 'Black', negative: 'White', poleType: 'Slug' }, south: { positive: 'Green', negative: 'Red', poleType: 'Screw' } },
    { name: 'Gibson (Stock/Vintage)', manufacturer: 'Gibson', north: { positive: 'Black', negative: 'Bare/Shield', poleType: 'Slug' }, south: { positive: 'Bare/Shield', negative: 'Black', poleType: 'Screw' } },
    // Fender: Black(GND left) / Red-White series / Green(HOT right)
    { name: 'Fender (Humbucker)', manufacturer: 'Fender', north: { positive: 'Green', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Black', negative: 'White', poleType: 'Screw' } },
    // Jackson: Same as Fender
    { name: 'Jackson', manufacturer: 'Jackson', north: { positive: 'Green', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Black', negative: 'White', poleType: 'Screw' } },
    // Peavey: Green(GND left) / Orange-Red series / Yellow(HOT right)
    { name: 'Peavey', manufacturer: 'Peavey', north: { positive: 'Yellow', negative: 'Orange', poleType: 'Slug' }, south: { positive: 'Green', negative: 'Red', poleType: 'Screw' } },
    // Iron Gear: Green(GND left) / Red-White series / Yellow(HOT right)
    { name: 'Iron Gear', manufacturer: 'Iron Gear', north: { positive: 'Yellow', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // Ibanez: Green(GND left) / Red-White series / Blue(HOT right)
    { name: 'Ibanez', manufacturer: 'Ibanez', north: { positive: 'Blue', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // Rockfield: Green(GND left) / Red-White series / Black(HOT right)
    { name: 'Rockfield', manufacturer: 'Rockfield', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // TDM: Green(GND left) / Red-White series / Yellow(HOT right)
    { name: 'TDM', manufacturer: 'TDM', north: { positive: 'Yellow', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // GFS: Green(GND left) / Red-White series / Black(HOT right)
    { name: 'GFS', manufacturer: 'GFS', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // Swinehead: Same as DiMarzio
    { name: 'Swinehead', manufacturer: 'Swinehead', north: { positive: 'Red', negative: 'White', poleType: 'Slug' }, south: { positive: 'Green', negative: 'Black', poleType: 'Screw' } },
    // EMG: Bare(GND left) / Black-White series / Red(HOT right)
    { name: 'EMG (Passive)', manufacturer: 'EMG', north: { positive: 'Red', negative: 'Black', poleType: 'Slug' }, south: { positive: 'Bare/Shield', negative: 'White', poleType: 'Screw' } },
    // EMG HZ: Green(GND left) / Red-White series / Black(HOT right)
    { name: 'EMG HZ', manufacturer: 'EMG', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // All Active SD: Bare(GND left) / Black-White series / Red(HOT right)
    { name: 'All Active (Seymour Duncan)', manufacturer: 'Seymour Duncan', north: { positive: 'Red', negative: 'Black', poleType: 'Slug' }, south: { positive: 'Bare/Shield', negative: 'White', poleType: 'Screw' } },
    // Lawrence: Green(GND left) / Black-White series / Red(HOT right)
    { name: 'Lawrence', manufacturer: 'Lawrence', north: { positive: 'Red', negative: 'Black', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // Bare Knuckle: Green(GND left) / Red-White series / Black(HOT right)
    { name: 'Bare Knuckle', manufacturer: 'Bare Knuckle', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // Gotoh: Green(GND left) / Red-White series / Yellow(HOT right)
    { name: 'Gotoh', manufacturer: 'Gotoh', north: { positive: 'Yellow', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    // Standard pattern for remaining manufacturers: Green(GND left) / Red-White series / Black(HOT right)
    { name: 'Bill Lawrence', manufacturer: 'Bill Lawrence', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Carvin/Kiesel', manufacturer: 'Carvin/Kiesel', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Dean USA', manufacturer: 'Dean USA', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Fralin', manufacturer: 'Fralin', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Golden Age (4-Conductor)', manufacturer: 'Golden Age', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Joe Barden', manufacturer: 'Joe Barden', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Kent Armstrong', manufacturer: 'Kent Armstrong', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Lollar', manufacturer: 'Lollar Pickups', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Lundgren', manufacturer: 'Lundgren', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'MAMA Pickups', manufacturer: 'MAMA Pickups', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Mighty Mite', manufacturer: 'Mighty Mite', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'PRS (Paul Reed Smith)', manufacturer: 'PRS', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Rio Grande', manufacturer: 'Rio Grande', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Schaller', manufacturer: 'Schaller', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Suhr', manufacturer: 'Suhr', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } },
    { name: 'Tone Rider', manufacturer: 'Tone Rider', north: { positive: 'Black', negative: 'Red', poleType: 'Slug' }, south: { positive: 'Green', negative: 'White', poleType: 'Screw' } }
  ];

  // Merged preset database (hardcoded + Google Sheets)
  const allPresets = React.useMemo(() => {
    // Start with default entries
    const merged = [
      { name: '-- Select a Preset --', manufacturer: '', north: { positive: '', negative: '', poleType: '' }, south: { positive: '', negative: '', poleType: '' } },
      { name: 'Custom/Unknown Pickup', manufacturer: 'Custom', north: { positive: '', negative: '', poleType: '' }, south: { positive: '', negative: '', poleType: '' } }
    ];

    // Add hardcoded presets (skip first two which are Select and Custom)
    merged.push(...presetDatabase.slice(2));

    // Add Google Sheets presets if available
    if (googleSheetsPresets.length > 0) {
      merged.push(...googleSheetsPresets);
    }

    return merged;
  }, [googleSheetsPresets]);

  // Load presets from Google Sheets on component mount
  React.useEffect(() => {
    const loadPresets = async () => {
      // Check if Google Sheets integration is enabled
      if (!CONFIG?.ENABLE_GOOGLE_SHEETS) {
        return;
      }

      setPresetsLoading(true);
      setPresetsLoadError(null);

      try {
        const presets = [];

        // Load curated database
        if (CONFIG.CURATED_DATABASE_URL) {
          const curatedPresets = await loadPresetsFromCSV(CONFIG.CURATED_DATABASE_URL, false);
          presets.push(...curatedPresets);
        }

        // Load user submissions if enabled
        if (CONFIG.ENABLE_USER_SUBMISSIONS && CONFIG.USER_SUBMISSIONS_URL) {
          const userPresets = await loadPresetsFromCSV(CONFIG.USER_SUBMISSIONS_URL, true);
          presets.push(...userPresets);
        }

        setGoogleSheetsPresets(presets);
        console.log(`Loaded ${presets.length} presets from Google Sheets`);
      } catch (error) {
        console.error('Error loading Google Sheets presets:', error);
        setPresetsLoadError(error.message);
      } finally {
        setPresetsLoading(false);
      }
    };

    loadPresets();
  }, []); // Run only once on mount

  const wireColors = [
    { name: 'Black', hex: '#000000', needsBorder: true },
    { name: 'White', hex: '#FFFFFF', needsBorder: true },
    { name: 'Red', hex: '#DC2626', needsBorder: false },
    { name: 'Green', hex: '#16A34A', needsBorder: false },
    { name: 'Blue', hex: '#2563EB', needsBorder: false },
    { name: 'Yellow', hex: '#EAB308', needsBorder: false },
    { name: 'Brown', hex: '#92400E', needsBorder: false },
    { name: 'Orange', hex: '#EA580C', needsBorder: false },
    { name: 'Purple', hex: '#9333EA', needsBorder: false },
    { name: 'Gray', hex: '#6B7280', needsBorder: false },
    { name: 'Bare/Shield', hex: '#D4D4D4', needsBorder: true }
  ];

  const polarities = ['North Up', 'South Up'];
  const phases = ['← Left', '→ Right'];
  const poleTypes = ['Slug', 'Screw'];

  const getColorHex = (colorName) => {
    const color = wireColors.find(c => c.name === colorName);
    return color ? color.hex : '#4b5563';
  };

  const needsBorder = (colorName) => {
    const color = wireColors.find(c => c.name === colorName);
    return color ? color.needsBorder : false;
  };

  const addPickup = () => {
    if (pickups.length < 3) {
      setPickups([...pickups, {
        id: pickups.length + 1,
        pickupName: '',
        manufacturer: '',
        coils: {
          north: {
            positive: { color: '' },
            negative: { color: '' },
            polarity: '',
            phase: '',
            poleType: ''
          },
          south: {
            positive: { color: '' },
            negative: { color: '' },
            polarity: '',
            phase: '',
            poleType: ''
          }
        },
        notes: '',
        isTwoConductor: false
      }]);
    }
  };

  const removePickup = (index) => {
    if (pickups.length > 1) {
      setPickups(pickups.filter((_, i) => i !== index));
    }
  };

  // Session Management Functions
  const saveSession = () => {
    const sessionName = currentSessionName.trim() || `Guitar ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    const session = {
      id: Date.now(),
      name: sessionName,
      date: new Date().toISOString(),
      pickups: pickups
    };
    setSavedSessions([...savedSessions, session]);
    setCurrentSessionName('');
    setShowSessionModal(false);
    alert(`Saved: ${sessionName}`);
  };

  const loadSession = (session) => {
    if (confirm(`Load "${session.name}"? Current work will be lost if not saved.`)) {
      setPickups(session.pickups);
      setCurrentSessionName(session.name);
      setShowLoadModal(false);
    }
  };

  const deleteSession = (sessionId) => {
    if (confirm('Delete this saved session?')) {
      setSavedSessions(savedSessions.filter(s => s.id !== sessionId));
    }
  };

  const newSession = () => {
    if (confirm('Start new session? Current work will be lost if not saved.')) {
      reset();
      setCurrentSessionName('');
    }
  };

  const exportSession = (session) => {
    const dataStr = JSON.stringify(session, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCurrentSession = () => {
    const sessionName = currentSessionName.trim() || `Guitar ${new Date().toLocaleDateString()}`;
    const session = {
      name: sessionName,
      date: new Date().toISOString(),
      pickups: pickups
    };
    exportSession(session);
  };

  const importSession = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const session = JSON.parse(e.target.result);
          if (session.pickups && Array.isArray(session.pickups)) {
            const importedSession = {
              id: Date.now(),
              name: session.name || `Imported ${new Date().toLocaleDateString()}`,
              date: session.date || new Date().toISOString(),
              pickups: session.pickups
            };
            setSavedSessions([...savedSessions, importedSession]);
            alert(`Imported: ${importedSession.name}`);
          } else {
            alert('Invalid session file format');
          }
        } catch (err) {
          alert('Error reading file: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const printFriendly = () => {
    window.print();
  };

  const updatePickup = (index, field, value) => {
    const updated = [...pickups];
    updated[index][field] = value;
    setPickups(updated);
  };

  const updateCoil = (pickupIndex, coil, terminal, field, value) => {
    const updated = [...pickups];
    if (!updated[pickupIndex].coils[coil][terminal]) {
      updated[pickupIndex].coils[coil][terminal] = {};
    }
    updated[pickupIndex].coils[coil][terminal][field] = value;
    setPickups(updated);
  };

  const updatePoleType = (pickupIndex, coil, value) => {
    const updated = [...pickups];
    updated[pickupIndex].coils[coil].poleType = value;
    setPickups(updated);
  };

  const updatePolarity = (pickupIndex, coil, value) => {
    const updated = [...pickups];
    const oppositeCoil = coil === 'north' ? 'south' : 'north';
    const oppositePolarity = value === 'North Up' ? 'South Up' : value === 'South Up' ? 'North Up' : '';
    
    updated[pickupIndex].coils[coil].polarity = value;
    updated[pickupIndex].coils[oppositeCoil].polarity = oppositePolarity;
    setPickups(updated);
  };

  const updatePhase = (pickupIndex, coil, value) => {
    const updated = [...pickups];
    updated[pickupIndex].coils[coil].phase = value;
    setPickups(updated);
    
    // Check if phases are opposite within the same pickup (internal conflict)
    const northPhase = updated[pickupIndex].coils.north.phase;
    const southPhase = updated[pickupIndex].coils.south.phase;
    
    if (northPhase && southPhase && northPhase !== southPhase) {
      setPhaseWarningData({ pickupIndex, coil, type: 'internal' });
      setShowPhaseWarning(true);
      return;
    }
    
    // Check for cross-pickup phase conflicts (only when both coils have same phase)
    if (pickups.length > 1 && value && northPhase && southPhase && northPhase === southPhase) {
      for (let i = 0; i < pickups.length; i++) {
        if (i === pickupIndex) continue;
        
        const otherPickup = updated[i];
        const otherNorthPhase = otherPickup.coils.north.phase;
        const otherSouthPhase = otherPickup.coils.south.phase;
        
        // Only check if other pickup has both coils set to same phase
        if (otherNorthPhase && otherSouthPhase && otherNorthPhase === otherSouthPhase) {
          // If phases are opposite between pickups
          if (northPhase !== otherNorthPhase) {
            // Check 2-conductor situations
            const currentIs2Conductor = updated[pickupIndex].isTwoConductor;
            const otherIs2Conductor = otherPickup.isTwoConductor;
            
            if (currentIs2Conductor && otherIs2Conductor) {
              // Both are 2-conductor - cannot fix by wire reversal
              setPhaseWarningData({ 
                pickupIndex, 
                otherPickupIndex: i, 
                type: 'both-2-conductor' 
              });
              setShowPhaseWarning(true);
            } else if (currentIs2Conductor && !otherIs2Conductor) {
              // Current is 2-conductor, other is 4-conductor - flip the 4-conductor one
              setPhaseWarningData({ 
                pickupIndex: i,  // Flip the OTHER pickup (4-conductor)
                otherPickupIndex: pickupIndex,
                type: 'cross-pickup-2conductor-current' 
              });
              setShowPhaseWarning(true);
            } else if (!currentIs2Conductor && otherIs2Conductor) {
              // Current is 4-conductor, other is 2-conductor - flip current
              setPhaseWarningData({ 
                pickupIndex, 
                otherPickupIndex: i,
                type: 'cross-pickup' 
              });
              setShowPhaseWarning(true);
            } else {
              // Both are 4-conductor - flip current pickup
              setPhaseWarningData({ 
                pickupIndex, 
                otherPickupIndex: i, 
                type: 'cross-pickup' 
              });
              setShowPhaseWarning(true);
            }
            return;
          }
        }
      }
    }
  };

  const reverseCoilPhase = () => {
    if (!phaseWarningData) return;
    
    const updated = [...pickups];
    
    if (phaseWarningData.type === 'internal') {
      // Reverse single coil within a pickup
      const { pickupIndex, coil } = phaseWarningData;
      
      // Swap positive and negative wire colors
      const temp = updated[pickupIndex].coils[coil].positive.color;
      updated[pickupIndex].coils[coil].positive.color = updated[pickupIndex].coils[coil].negative.color;
      updated[pickupIndex].coils[coil].negative.color = temp;
      
      // Reverse the phase direction using current testing method
      updated[pickupIndex].coils[coil].phase = flipPhaseValue(updated[pickupIndex].coils[coil].phase);
    } else if (phaseWarningData.type === 'one-2-conductor') {
      // Reverse the 4-conductor pickup (whichever one that is)
      const pickupToReverse = phaseWarningData.whichIs2Conductor === 'current' 
        ? phaseWarningData.otherPickupIndex 
        : phaseWarningData.pickupIndex;
      
      // Reverse North coil
      let temp = updated[pickupToReverse].coils.north.positive.color;
      updated[pickupToReverse].coils.north.positive.color = updated[pickupToReverse].coils.north.negative.color;
      updated[pickupToReverse].coils.north.negative.color = temp;
      
      updated[pickupToReverse].coils.north.phase = flipPhaseValue(updated[pickupToReverse].coils.north.phase);
      
      // Reverse South coil
      temp = updated[pickupToReverse].coils.south.positive.color;
      updated[pickupToReverse].coils.south.positive.color = updated[pickupToReverse].coils.south.negative.color;
      updated[pickupToReverse].coils.south.negative.color = temp;
      
      updated[pickupToReverse].coils.south.phase = flipPhaseValue(updated[pickupToReverse].coils.south.phase);
    } else if (phaseWarningData.type === 'both-4-conductor' || 
               phaseWarningData.type === 'cross-pickup' || 
               phaseWarningData.type === 'cross-pickup-2conductor-current') {
      // Reverse both coils of the specified pickup to match other pickup
      const { pickupIndex } = phaseWarningData;
      
      // Reverse North coil
      let temp = updated[pickupIndex].coils.north.positive.color;
      updated[pickupIndex].coils.north.positive.color = updated[pickupIndex].coils.north.negative.color;
      updated[pickupIndex].coils.north.negative.color = temp;

      updated[pickupIndex].coils.north.phase = flipPhaseValue(updated[pickupIndex].coils.north.phase);

      // Reverse South coil
      temp = updated[pickupIndex].coils.south.positive.color;
      updated[pickupIndex].coils.south.positive.color = updated[pickupIndex].coils.south.negative.color;
      updated[pickupIndex].coils.south.negative.color = temp;

      updated[pickupIndex].coils.south.phase = flipPhaseValue(updated[pickupIndex].coils.south.phase);
      
      // Toggle isReversed flag
      updated[pickupIndex].isReversed = !updated[pickupIndex].isReversed;
    } else if (phaseWarningData.type === 'one-2-conductor') {
      // Reverse the 4-conductor pickup
      const pickupToReverse = phaseWarningData.whichIs2Conductor === 'current' 
        ? phaseWarningData.otherPickupIndex 
        : phaseWarningData.pickupIndex;
      
      // Toggle isReversed flag for the 4-conductor pickup
      updated[pickupToReverse].isReversed = !updated[pickupToReverse].isReversed;
    }
    // Note: 'both-2-conductor' type doesn't auto-reverse, user must acknowledge
    
    setPickups(updated);
    setShowPhaseWarning(false);
    setPhaseWarningData(null);
  };

  const reset = () => {
    setPickups([{
      id: 1,
      pickupName: '',
      manufacturer: '',
      coils: {
        north: {
          positive: { color: '' },
          negative: { color: '' },
          polarity: '',
          phase: '',
          poleType: ''
        },
        south: {
          positive: { color: '' },
          negative: { color: '' },
          polarity: '',
          phase: '',
          poleType: ''
        }
      },
      notes: '',
      isTwoConductor: false,
      isReversed: false
    }]);
  };

  const ColorSelect = ({ value, onChange, label }) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 print:bg-white print:text-black print:border-gray-400"
      >
        <option value="">Select Color</option>
        {wireColors.map(color => (
          <option key={color.name} value={color.name}>{color.name}</option>
        ))}
      </select>
    </div>
  );

  const CoilPolaritySelect = ({ value, onChange }) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-700">Coil Magnetic Polarity</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 print:bg-white print:text-black print:border-gray-400"
      >
        <option value="">Select Polarity</option>
        {polarities.map(pol => (
          <option key={pol} value={pol}>{pol}</option>
        ))}
      </select>
    </div>
  );

  const PoleTypeSelect = ({ value, onChange }) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-700">Pole Piece Type</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 print:bg-white print:text-black print:border-gray-400"
      >
        <option value="">Select Type</option>
        {poleTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
    </div>
  );

  const PhaseSelect = ({ value, onChange }) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-700">Phase Test (Needle Jump Direction)</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 print:bg-white print:text-black print:border-gray-400"
      >
        <option value="">Select Direction</option>
        {phases.map(phase => (
          <option key={phase} value={phase}>{phase}</option>
        ))}
      </select>
    </div>
  );

  const PickupVisual = ({ pickup }) => (
    <svg viewBox="0 0 700 500" className="w-full">
      {/* Title */}
      <text x="350" y="30" textAnchor="middle" fill="#60a5fa" fontSize="20" fontWeight="bold" className="print:fill-black">
        {pickup.pickupName || 'Humbucker Pickup'}
      </text>
      {pickup.manufacturer && (
        <text x="350" y="55" textAnchor="middle" fill="#9ca3af" fontSize="14" className="print:fill-gray-700">
          {pickup.manufacturer}
        </text>
      )}
      
      {/* Pickup body */}
      <rect x="100" y="80" width="500" height="340" fill="#1f2937" stroke="#4b5563" strokeWidth="3" rx="10" className="print:fill-white"/>
      
      {/* North Coil - Top */}
      <g>
        <rect x="130" y="110" width="440" height="140" fill="#166534" fillOpacity="0.3" stroke="#22c55e" strokeWidth="2" rx="5" className="print:fill-green-100"/>
        <text x="350" y="135" textAnchor="middle" fill="#22c55e" fontSize="16" fontWeight="bold" className="print:fill-black">
          {pickup.coils.north.polarity ? 'NORTH COIL' : 'COIL 1'}
          {pickup.coils.north.poleType && ` (${pickup.coils.north.poleType} Side)`}
        </text>
        {pickup.coils.north.polarity && (
          <text x="350" y="155" textAnchor="middle" fill="#86efac" fontSize="12" className="print:fill-gray-700">
            {pickup.coils.north.polarity}
          </text>
        )}
        
        {/* Pole pieces */}
        {pickup.coils.north.poleType === 'Slug' ? (
          [0,1,2,3,4,5].map(i => (
            <circle key={i} cx={200 + i*60} cy="190" r="12" fill="#9ca3af" stroke="#6b7280" strokeWidth="2"/>
          ))
        ) : pickup.coils.north.poleType === 'Screw' ? (
          [0,1,2,3,4,5].map(i => (
            <g key={i}>
              <circle cx={200 + i*60} cy="190" r="12" fill="#4b5563" stroke="#6b7280" strokeWidth="2"/>
              <line x1={200 + i*60 - 6} y1="190" x2={200 + i*60 + 6} y2="190" stroke="#9ca3af" strokeWidth="2"/>
              <line x1={200 + i*60} y1="184" x2={200 + i*60} y2="196" stroke="#9ca3af" strokeWidth="2"/>
            </g>
          ))
        ) : (
          [0,1,2,3,4,5].map(i => (
            <circle key={i} cx={200 + i*60} cy="190" r="12" fill="#4b5563" stroke="#6b7280" strokeWidth="2" strokeDasharray="3,3"/>
          ))
        )}
        
        {/* North Start wire - LEFT SIDE */}
        <line x1="150" y1="220" x2="50" y2="220" 
          stroke={pickup.coils.north.positive.color ? getColorHex(pickup.coils.north.positive.color) : '#4b5563'} 
          strokeWidth="4"/>
        <circle cx="40" cy="220" r="10" 
          fill={pickup.coils.north.positive.color ? getColorHex(pickup.coils.north.positive.color) : '#374151'} 
          stroke={needsBorder(pickup.coils.north.positive.color) ? '#000' : '#6b7280'} 
          strokeWidth="2"/>
        {pickup.coils.north.positive.color && (
          <text x="40" y="210" textAnchor="middle" 
            fill={needsBorder(pickup.coils.north.positive.color) ? '#000' : getColorHex(pickup.coils.north.positive.color)} 
            fontSize="10" className="print:fill-black">
            {pickup.coils.north.positive.color}
          </text>
        )}
        {/* Phase arrow for North coil - LEFT */}
        {pickup.coils.north.phase && normalizePhase(pickup.coils.north.phase) === 'negative' && (
          <g>
            <path d="M 25 210 L 15 220 L 25 230" stroke="#fbbf24" strokeWidth="3" fill="none" className="print:stroke-black"/>
            <text x="10" y="207" fontSize="10" fill="#fbbf24" fontWeight="bold" className="print:fill-black">←</text>
          </g>
        )}
        
        {/* North Finish wire - RIGHT SIDE */}
        <line x1="550" y1="220" x2="650" y2="220" 
          stroke={pickup.coils.north.negative.color ? getColorHex(pickup.coils.north.negative.color) : '#4b5563'} 
          strokeWidth="4"/>
        <circle cx="660" cy="220" r="10" 
          fill={pickup.coils.north.negative.color ? getColorHex(pickup.coils.north.negative.color) : '#374151'} 
          stroke={needsBorder(pickup.coils.north.negative.color) ? '#000' : '#6b7280'} 
          strokeWidth="2"/>
        {pickup.coils.north.negative.color && (
          <text x="660" y="210" textAnchor="middle" 
            fill={needsBorder(pickup.coils.north.negative.color) ? '#000' : getColorHex(pickup.coils.north.negative.color)} 
            fontSize="10" className="print:fill-black">
            {pickup.coils.north.negative.color}
          </text>
        )}
        {/* Phase arrow for North coil - RIGHT */}
        {pickup.coils.north.phase && normalizePhase(pickup.coils.north.phase) === 'positive' && (
          <g>
            <path d="M 675 210 L 685 220 L 675 230" stroke="#fbbf24" strokeWidth="3" fill="none" className="print:stroke-black"/>
            <text x="680" y="207" fontSize="10" fill="#fbbf24" fontWeight="bold" className="print:fill-black">→</text>
          </g>
        )}
      </g>
      
      {/* South Coil - Bottom */}
      <g>
        <rect x="130" y="270" width="440" height="140" fill="#581c87" fillOpacity="0.3" stroke="#a855f7" strokeWidth="2" rx="5" className="print:fill-purple-100"/>
        <text x="350" y="295" textAnchor="middle" fill="#a855f7" fontSize="16" fontWeight="bold" className="print:fill-black">
          {pickup.coils.south.polarity ? 'SOUTH COIL' : 'COIL 2'}
          {pickup.coils.south.poleType && ` (${pickup.coils.south.poleType} Side)`}
        </text>
        {pickup.coils.south.polarity && (
          <text x="350" y="315" textAnchor="middle" fill="#d8b4fe" fontSize="12" className="print:fill-gray-700">
            {pickup.coils.south.polarity}
          </text>
        )}
        
        {/* Pole pieces */}
        {pickup.coils.south.poleType === 'Screw' ? (
          [0,1,2,3,4,5].map(i => (
            <g key={i}>
              <circle cx={200 + i*60} cy="350" r="12" fill="#4b5563" stroke="#6b7280" strokeWidth="2"/>
              <line x1={200 + i*60 - 6} y1="350" x2={200 + i*60 + 6} y2="350" stroke="#9ca3af" strokeWidth="2"/>
              <line x1={200 + i*60} y1="344" x2={200 + i*60} y2="356" stroke="#9ca3af" strokeWidth="2"/>
            </g>
          ))
        ) : pickup.coils.south.poleType === 'Slug' ? (
          [0,1,2,3,4,5].map(i => (
            <circle key={i} cx={200 + i*60} cy="350" r="12" fill="#9ca3af" stroke="#6b7280" strokeWidth="2"/>
          ))
        ) : (
          [0,1,2,3,4,5].map(i => (
            <circle key={i} cx={200 + i*60} cy="350" r="12" fill="#4b5563" stroke="#6b7280" strokeWidth="2" strokeDasharray="3,3"/>
          ))
        )}
        
        {/* South Start wire - LEFT SIDE */}
        <line x1="150" y1="380" x2="50" y2="380" 
          stroke={pickup.coils.south.positive.color ? getColorHex(pickup.coils.south.positive.color) : '#4b5563'} 
          strokeWidth="4"/>
        <circle cx="40" cy="380" r="10" 
          fill={pickup.coils.south.positive.color ? getColorHex(pickup.coils.south.positive.color) : '#374151'} 
          stroke={needsBorder(pickup.coils.south.positive.color) ? '#000' : '#6b7280'} 
          strokeWidth="2"/>
        {pickup.coils.south.positive.color && (
          <text x="40" y="370" textAnchor="middle" 
            fill={needsBorder(pickup.coils.south.positive.color) ? '#000' : getColorHex(pickup.coils.south.positive.color)} 
            fontSize="10" className="print:fill-black">
            {pickup.coils.south.positive.color}
          </text>
        )}
        {/* Series connection indicator - Yellow dotted line connects the two series wires */}
        {pickup.coils.north.negative.color && pickup.coils.south.positive.color && (
          (() => {
            // Determine if wires are in standard position or reversed
            // For Seymour Duncan: standard is Red(right)+White(left), reversed is Green(right)+Black(left)
            // For DiMarzio: standard is Black(right)+White(left), reversed is Red(right)+Green(left)
            
            // Check if current north.negative is actually on the right (standard) or left (reversed)
            // We'll use manufacturer to determine original series wires
            const isSeymourDuncan = pickup.manufacturer === 'Seymour Duncan';
            const isDiMarzio = pickup.manufacturer === 'DiMarzio';
            
            // Original series pairs
            let originalNorthNeg = '';
            let originalSouthPos = '';
            
            if (isSeymourDuncan) {
              originalNorthNeg = 'Red';
              originalSouthPos = 'White';
            } else if (isDiMarzio) {
              originalNorthNeg = 'Black';  // DiMarzio: Black (North finish) connects to White (South start)
              originalSouthPos = 'White';
            }
            
            // Check if current wires match original (standard) or are swapped (reversed)
            const isStandardPosition = 
              pickup.coils.north.negative.color === originalNorthNeg && 
              pickup.coils.south.positive.color === originalSouthPos;
            
            if (isStandardPosition || !originalNorthNeg) {
              // Standard: right of North to left of South
              return (
                <g>
                  <line x1="660" y1="220" x2="660" y2="300" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5,5" className="print:stroke-black"/>
                  <line x1="660" y1="300" x2="40" y2="380" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5,5" className="print:stroke-black"/>
                </g>
              );
            } else {
              // Reversed: left of North to right of South
              return (
                <g>
                  <line x1="40" y1="220" x2="40" y2="300" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5,5" className="print:stroke-black"/>
                  <line x1="40" y1="300" x2="660" y2="380" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5,5" className="print:stroke-black"/>
                </g>
              );
            }
          })()
        )}
        {/* Phase arrow for South coil - LEFT */}
        {pickup.coils.south.phase && normalizePhase(pickup.coils.south.phase) === 'negative' && (
          <g>
            <path d="M 25 370 L 15 380 L 25 390" stroke="#fbbf24" strokeWidth="3" fill="none" className="print:stroke-black"/>
            <text x="10" y="367" fontSize="10" fill="#fbbf24" fontWeight="bold" className="print:fill-black">←</text>
          </g>
        )}
        
        {/* South Finish wire - RIGHT SIDE */}
        <line x1="550" y1="380" x2="650" y2="380" 
          stroke={pickup.coils.south.negative.color ? getColorHex(pickup.coils.south.negative.color) : '#4b5563'} 
          strokeWidth="4"/>
        <circle cx="660" cy="380" r="10" 
          fill={pickup.coils.south.negative.color ? getColorHex(pickup.coils.south.negative.color) : '#374151'} 
          stroke={needsBorder(pickup.coils.south.negative.color) ? '#000' : '#6b7280'} 
          strokeWidth="2"/>
        {pickup.coils.south.negative.color && (
          <text x="660" y="370" textAnchor="middle" 
            fill={needsBorder(pickup.coils.south.negative.color) ? '#000' : getColorHex(pickup.coils.south.negative.color)} 
            fontSize="10" className="print:fill-black">
            {pickup.coils.south.negative.color}
          </text>
        )}
        {/* Phase arrow for South coil - RIGHT */}
        {pickup.coils.south.phase && normalizePhase(pickup.coils.south.phase) === 'positive' && (
          <g>
            <path d="M 675 370 L 685 380 L 675 390" stroke="#fbbf24" strokeWidth="3" fill="none" className="print:stroke-black"/>
            <text x="680" y="367" fontSize="10" fill="#fbbf24" fontWeight="bold" className="print:fill-black">→</text>
          </g>
        )}
      </g>
      
      {/* Center divider */}
      <line x1="130" y1="260" x2="570" y2="260" stroke="#4b5563" strokeWidth="2" strokeDasharray="8,4"/>
      
      {/* Hot and Ground labels - centered between coils */}
      {pickup.coils.north.positive.color && pickup.coils.south.negative.color && (
        <g>
          {/* Ground label - left side, centered vertically */}
          <text x="15" y="305" fill="#10b981" fontSize="16" fontWeight="bold" className="print:fill-black">
            GND
          </text>
          
          {/* Hot label - right side, centered vertically */}
          <text x="670" y="305" fill="#ef4444" fontSize="16" fontWeight="bold" className="print:fill-black">
            HOT
          </text>
        </g>
      )}
    </svg>
  );

  const applyPreset = (pickupIndex, presetName) => {
    const preset = allPresets.find(p => p.name === presetName);
    if (!preset || !preset.manufacturer) return; // Skip if "Select a Preset" option
    
    // Show phase check modal
    setPhaseCheckData({ 
      pickupIndex, 
      preset,
      isTwoConductor: false, 
      phaseDirection: '' 
    });
    setShowPhaseCheckModal(true);
  };

  const confirmPhaseCheck = () => {
    const { pickupIndex, preset, isTwoConductor, phaseDirection } = phaseCheckData;
    
    const updated = [...pickups];
    updated[pickupIndex].pickupName = preset.name;
    updated[pickupIndex].manufacturer = preset.manufacturer;
    updated[pickupIndex].coils.north.positive.color = preset.north.positive;
    updated[pickupIndex].coils.north.negative.color = isTwoConductor ? '' : preset.north.negative;
    updated[pickupIndex].coils.north.poleType = preset.north.poleType;
    updated[pickupIndex].coils.north.phase = phaseDirection;
    updated[pickupIndex].coils.south.positive.color = preset.south.positive;
    updated[pickupIndex].coils.south.negative.color = isTwoConductor ? '' : preset.south.negative;
    updated[pickupIndex].coils.south.poleType = preset.south.poleType;
    updated[pickupIndex].coils.south.phase = phaseDirection;
    updated[pickupIndex].isTwoConductor = isTwoConductor;
    
    // Automatically add a second pickup if this is the only one and we have room
    if (updated.length === 1 && pickups.length < 3) {
      updated.push({
        id: updated.length + 1,
        pickupName: '',
        manufacturer: '',
        coils: {
          north: {
            positive: { color: '' },
            negative: { color: '' },
            polarity: '',
            phase: '',
            poleType: ''
          },
          south: {
            positive: { color: '' },
            negative: { color: '' },
            polarity: '',
            phase: '',
            poleType: ''
          }
        },
        notes: '',
        isTwoConductor: false
      });
    }
    
    setPickups(updated);
    setShowPhaseCheckModal(false);
    setPhaseCheckData({ pickupIndex: 0, isTwoConductor: false, phaseDirection: '' });
    
    // After setting pickups, check for phase conflicts with other pickups
    setTimeout(() => {
      checkPhaseConflict(pickupIndex, phaseDirection, updated, isTwoConductor);
    }, 100);
  };

  const flipCustomCoil = (coilToFlip) => {
    const pickupKey = `pickup${customPhaseMismatchData.pickupStep}`;
    const currentPickup = wizardData[pickupKey];
    
    if (coilToFlip === 'north') {
      // Flip north coil: swap wire colors and flip phase
      const newPhase = currentPickup.northPhase === '← Left' ? '→ Right' : '← Left';
      setWizardData({
        ...wizardData,
        [pickupKey]: {
          ...currentPickup,
          customColors: {
            ...currentPickup.customColors,
            northPositive: currentPickup.customColors.northNegative,
            northNegative: currentPickup.customColors.northPositive
          },
          northPhase: newPhase
        }
      });
    } else {
      // Flip south coil: swap wire colors and flip phase
      const newPhase = currentPickup.southPhase === '← Left' ? '→ Right' : '← Left';
      setWizardData({
        ...wizardData,
        [pickupKey]: {
          ...currentPickup,
          customColors: {
            ...currentPickup.customColors,
            southPositive: currentPickup.customColors.southNegative,
            southNegative: currentPickup.customColors.southPositive
          },
          southPhase: newPhase
        }
      });
    }
    
    setShowCustomPhaseMismatch(false);
    
    // After flipping, automatically proceed
    setTimeout(() => {
      if (customPhaseMismatchData.pickupStep === 1) {
        setWizardStep(2);
      } else {
        completeWizard();
      }
    }, 100);
  };

  const completeWizard = () => {
    // Apply both pickups from wizard
    const newPickups = [];
    
    // Helper function to create pickup from wizard data
    const createPickup = (pickupData, pickupId) => {
      if (!pickupData.preset) return null;
      
      if (pickupData.isCustom) {
        // Custom pickup with manual inputs
        return {
          id: pickupId,
          pickupName: 'Custom Pickup',
          manufacturer: 'Custom',
          coils: {
            north: {
              positive: { color: pickupData.customColors.northPositive || '' },
              negative: { color: pickupData.customColors.northNegative || '' },
              polarity: '',
              phase: pickupData.northPhase || '',
              poleType: pickupData.northPoleType || 'Slug'
            },
            south: {
              positive: { color: pickupData.customColors.southPositive || '' },
              negative: { color: pickupData.customColors.southNegative || '' },
              polarity: '',
              phase: pickupData.southPhase || '',
              poleType: pickupData.southPoleType || 'Screw'
            }
          },
          notes: '',
          isTwoConductor: false,
          isReversed: false,
          seriesWires: { wire1: '', wire2: '' }
        };
      } else {
        // Preset pickup
        const preset = allPresets.find(p => p.name === pickupData.preset);
        if (!preset || !preset.manufacturer) return null;
        
        return {
          id: pickupId,
          pickupName: preset.name,
          manufacturer: preset.manufacturer,
          coils: {
            north: {
              positive: { color: preset.north.positive },
              negative: { color: pickupData.isTwoConductor ? '' : preset.north.negative },
              polarity: '',
              phase: pickupData.phase,
              poleType: preset.north.poleType
            },
            south: {
              positive: { color: preset.south.positive },
              negative: { color: pickupData.isTwoConductor ? '' : preset.south.negative },
              polarity: '',
              phase: pickupData.phase,
              poleType: preset.south.poleType
            }
          },
          notes: '',
          isTwoConductor: pickupData.isTwoConductor,
          isReversed: false,
          seriesWires: { wire1: '', wire2: '' }
        };
      }
    };
    
    // Pickup 1
    const pickup1 = createPickup(wizardData.pickup1, 1);
    if (pickup1) newPickups.push(pickup1);
    
    // Pickup 2
    const pickup2 = createPickup(wizardData.pickup2, 2);
    if (pickup2) newPickups.push(pickup2);
    
    if (newPickups.length > 0) {
      setPickups(newPickups);
    }
    setShowSetupWizard(false);
    
    // Check for phase conflicts after wizard completes
    if (newPickups.length === 2) {
      // Get phase for pickup 2 (works for both preset and custom)
      const pickup2Phase = newPickups[1].coils.north.phase; // Use the actual phase from the created pickup
      const pickup2Is2Conductor = newPickups[1].isTwoConductor;
      
      if (pickup2Phase) {
        setTimeout(() => {
          checkPhaseConflict(1, pickup2Phase, newPickups, pickup2Is2Conductor);
        }, 100);
      }
    }
  };

  const shareCustomPickupWithCommunity = (pickupStep) => {
    // Get the custom pickup data from the wizard
    const pickupData = wizardData[`pickup${pickupStep}`];

    if (!pickupData.isCustom) {
      alert('Only custom pickups can be shared with the community.');
      return;
    }

    // Check if form template is configured
    if (!CONFIG?.GOOGLE_FORM_TEMPLATE_URL || !CONFIG?.ENABLE_SHARE_BUTTON) {
      alert('Community sharing is not yet configured. Please check back later!');
      return;
    }

    // Prepare data for the form
    const formData = {
      manufacturer: pickupData.customBrand || '',
      model: pickupData.customName || '',
      northRed: pickupData.customColors.northPositive,
      northBlack: pickupData.customColors.northNegative,
      northPole: pickupData.northPoleType,
      southRed: pickupData.customColors.southPositive,
      southBlack: pickupData.customColors.southNegative,
      southPole: pickupData.southPoleType,
      notes: `North Phase: ${pickupData.northPhase}, South Phase: ${pickupData.southPhase}`
    };

    // Generate pre-filled form URL
    const formURL = generatePrefilledFormURL(CONFIG.GOOGLE_FORM_TEMPLATE_URL, formData);

    // Open form in new tab
    window.open(formURL, '_blank');
  };

  const checkPhaseConflict = (currentPickupIndex, currentPhase, updatedPickups, currentIs2Conductor) => {
    if (updatedPickups.length < 2 || !currentPhase) return;
    
    // Check against other pickups
    for (let i = 0; i < updatedPickups.length; i++) {
      if (i === currentPickupIndex) continue;
      
      const otherPickup = updatedPickups[i];
      const otherNorthPhase = otherPickup.coils.north.phase;
      const otherSouthPhase = otherPickup.coils.south.phase;
      
      // Only check if other pickup has both coils set to the same phase
      if (otherNorthPhase && otherSouthPhase && otherNorthPhase === otherSouthPhase) {
        // If phases are opposite between pickups
        if (currentPhase !== otherNorthPhase) {
          const otherIs2Conductor = otherPickup.isTwoConductor;
          
          // Determine which pickup to reverse - always the higher indexed one (second pickup)
          const higherIndex = Math.max(currentPickupIndex, i);
          const lowerIndex = Math.min(currentPickupIndex, i);
          
          if (currentIs2Conductor && otherIs2Conductor) {
            // Both are 2-conductor - cannot fix by wire reversal
            setPhaseWarningData({ 
              pickupIndex: higherIndex, 
              otherPickupIndex: lowerIndex, 
              type: 'both-2-conductor' 
            });
            setShowPhaseWarning(true);
            return;
          } else if (currentIs2Conductor || otherIs2Conductor) {
            // One is 2-conductor - reverse the 4-conductor one
            const twoConductorIndex = currentIs2Conductor ? currentPickupIndex : i;
            const fourConductorIndex = currentIs2Conductor ? i : currentPickupIndex;
            setPhaseWarningData({ 
              pickupIndex: fourConductorIndex, 
              otherPickupIndex: twoConductorIndex, 
              type: 'one-2-conductor',
              whichIs2Conductor: currentIs2Conductor ? 'current' : 'other'
            });
            setShowPhaseWarning(true);
            return;
          } else {
            // Both are 4-conductor - reverse the second/higher indexed pickup
            setPhaseWarningData({ 
              pickupIndex: higherIndex, 
              otherPickupIndex: lowerIndex, 
              type: 'both-4-conductor' 
            });
            setShowPhaseWarning(true);
            return;
          }
        }
      }
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Phase Check Modal for Presets */}
      {showPhaseCheckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md border-2 border-blue-500">
            <h3 className="text-xl font-bold text-blue-400 mb-4">Phase & Wiring Check</h3>
            <p className="text-gray-300 mb-4">
              Before applying this preset, please verify the pickup wiring and phase direction.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Wiring Type:</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!phaseCheckData.isTwoConductor}
                      onChange={() => setPhaseCheckData({ ...phaseCheckData, isTwoConductor: false })}
                      className="mr-2"
                    />
                    <span>4-Conductor</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={phaseCheckData.isTwoConductor}
                      onChange={() => setPhaseCheckData({ ...phaseCheckData, isTwoConductor: true })}
                      className="mr-2"
                    />
                    <span>2-Conductor (Series)</span>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {phaseCheckData.isTwoConductor 
                    ? 'Coils are wired in series internally - test as single unit. Note: Ground wire is typically bare/braided shield.' 
                    : 'Each coil has separate wires - test individually'}
                </p>
              </div>

              {phaseCheckData.isTwoConductor && (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
                  <p className="text-xs text-yellow-200">
                    <strong>💡 2-Conductor Note:</strong> The ground wire is typically a bare braided shield wire, not an insulated colored wire. If you only see one colored wire plus a bare shield, that's normal for 2-conductor pickups.
                  </p>
                </div>
              )}

              {phaseCheckData.preset && (
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-xs font-semibold text-yellow-300 mb-2">
                    {phaseCheckData.isTwoConductor ? '2-Conductor Testing:' : '4-Conductor Testing (Series Connection):'}
                  </p>
                  
                  {!phaseCheckData.isTwoConductor && (
                    <div className="mb-3 pb-3 border-b border-gray-600">
                      <p className="text-xs text-gray-300 mb-1">
                        <strong>Step 1:</strong> Connect wires for series (North coil finish to South coil start):
                      </p>
                      <p className="text-xs text-gray-300">
                        <span style={{ color: getColorHex(phaseCheckData.preset.north.negative) }}>
                          {phaseCheckData.preset.north.negative}
                        </span>
                        {' (North finish) + '}
                        <span style={{ color: getColorHex(phaseCheckData.preset.south.positive) }}>
                          {phaseCheckData.preset.south.positive}
                        </span>
                        {' (South start) — tape off'}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-300 mb-1">
                    <strong>{phaseCheckData.isTwoConductor ? 'Analog Meter Connection:' : 'Step 2: Test Phase'}</strong>
                  </p>
                  <p className="text-xs text-gray-300">
                    <strong className="text-red-400">Red (+) Lead:</strong> Connect to{' '}
                    {phaseCheckData.isTwoConductor ? (
                      <span style={{ color: getColorHex(phaseCheckData.preset.north.positive) }}>
                        {phaseCheckData.preset.north.positive} (Hot wire)
                      </span>
                    ) : (
                      <span style={{ color: getColorHex(phaseCheckData.preset.north.positive) }}>
                        {phaseCheckData.preset.north.positive}
                      </span>
                    )}
                    {!phaseCheckData.isTwoConductor && ' wire'}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    <strong className="text-gray-400">Black (-) Lead:</strong> Connect to{' '}
                    {phaseCheckData.isTwoConductor ? (
                      <span style={{ color: getColorHex('Bare/Shield') }}>
                        Bare (Shield/Ground)
                      </span>
                    ) : (
                      <span style={{ color: getColorHex(phaseCheckData.preset.south.negative || 'Bare/Shield') }}>
                        {phaseCheckData.preset.south.negative || 'Bare/Shield'}
                      </span>
                    )}
                    {!phaseCheckData.isTwoConductor && ' wire'}
                  </p>
                  <p className="text-xs text-yellow-200 mt-2 italic">
                    Pull screwdriver from pole pieces and watch needle direction
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Phase Direction (Analog Meter Needle):</label>
                <select
                  value={phaseCheckData.phaseDirection}
                  onChange={(e) => setPhaseCheckData({ ...phaseCheckData, phaseDirection: e.target.value })}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Direction</option>
                  <option value="← Left">← Left</option>
                  <option value="→ Right">→ Right</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmPhaseCheck}
                disabled={!phaseCheckData.phaseDirection}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition"
              >
                Apply Preset
              </button>
              <button
                onClick={() => {
                  setShowPhaseCheckModal(false);
                  setPhaseCheckData({ pickupIndex: 0, isTwoConductor: false, phaseDirection: '' });
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 md:p-8 max-w-3xl w-full my-2 md:my-8">
            <h2 className="text-3xl font-bold text-blue-400 mb-6">
              {wizardStep === 0 ? 'Select Your Phase Testing Method' : `Setup Pickup ${wizardStep}`}
            </h2>

            {/* Step 0: Phase Testing Method Selection */}
            {wizardStep === 0 && (
              <div className="space-y-6">
                <p className="text-gray-300 mb-6">
                  Choose the device you'll use to test pickup phase. This will customize the instructions throughout the setup wizard.
                </p>

                {/* Analog Meter Option */}
                <div
                  onClick={() => setPhaseTestingMethod('analog')}
                  className={`cursor-pointer rounded-lg p-6 border-2 transition ${
                    phaseTestingMethod === 'analog'
                      ? 'border-blue-500 bg-blue-900'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={phaseTestingMethod === 'analog'}
                      onChange={() => setPhaseTestingMethod('analog')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Analog Meter</h3>
                      <p className="text-gray-300 mb-3">
                        Traditional analog meter with moving needle. Place screwdriver on poles, rapidly pull off,
                        and watch which direction the needle swings.
                      </p>
                      <div className="text-sm text-gray-400">
                        Phase indicators: <span className="font-semibold text-white">← Left</span> or <span className="font-semibold text-white">→ Right</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Multimeter Option */}
                <div
                  onClick={() => setPhaseTestingMethod('digital')}
                  className={`cursor-pointer rounded-lg p-6 border-2 transition ${
                    phaseTestingMethod === 'digital'
                      ? 'border-blue-500 bg-blue-900'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={phaseTestingMethod === 'digital'}
                      onChange={() => setPhaseTestingMethod('digital')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Digital Multimeter</h3>
                      <p className="text-gray-300 mb-3">
                        Digital meter showing positive/negative voltage. Pull screwdriver off poles and
                        watch if voltage goes up (+) or down (-).
                      </p>
                      <div className="text-sm text-gray-400">
                        Phase indicators: <span className="font-semibold text-white">↓ Down (Negative)</span> or <span className="font-semibold text-white">↑ Up (Positive)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* N-Audio Phase Checker Option */}
                <div
                  onClick={() => setPhaseTestingMethod('naudio')}
                  className={`cursor-pointer rounded-lg p-6 border-2 transition ${
                    phaseTestingMethod === 'naudio'
                      ? 'border-blue-500 bg-blue-900'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={phaseTestingMethod === 'naudio'}
                      onChange={() => setPhaseTestingMethod('naudio')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">N-Audio Phase Checker</h3>
                      <p className="text-gray-300 mb-3">
                        Professional LED-based phase testing device. Connect pickup coils and read LED color.
                      </p>
                      <a
                        href="https://n-audio.net/guitar-pickup-phase-checker/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300 underline text-sm inline-block mb-3"
                      >
                        Learn more about N-Audio Phase Checker →
                      </a>
                      <div className="text-sm text-gray-400">
                        Phase indicators: <span className="font-semibold text-white">🟢 Green (Positive Phase)</span> or <span className="font-semibold text-white">🔴 Red (Negative Phase)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setWizardStep(1);
                      setShowInstructions(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                  >
                    Next: Select Pickups →
                  </button>
                </div>
              </div>
            )}

            {/* Preset Selection */}
            {wizardStep > 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Manufacturer Preset
                </label>
                <select
                  value={wizardData[`pickup${wizardStep}`].preset}
                  onChange={(e) => {
                    const isCustom = e.target.value === 'Custom/Unknown Pickup';
                    setWizardData({
                      ...wizardData,
                      [`pickup${wizardStep}`]: { 
                        ...wizardData[`pickup${wizardStep}`], 
                        preset: e.target.value,
                        isCustom: isCustom
                      }
                    });
                  }}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {allPresets.map((preset, idx) => (
                    <option key={idx} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Custom Manual Input Fields */}
              {wizardData[`pickup${wizardStep}`].isCustom && (
                <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-yellow-400">Manual Wire Color Input</h3>

                  {/* Brand and Name Input Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Pickup Brand/Manufacturer (optional)
                      </label>
                      <input
                        type="text"
                        value={wizardData[`pickup${wizardStep}`].customBrand}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          [`pickup${wizardStep}`]: {
                            ...wizardData[`pickup${wizardStep}`],
                            customBrand: e.target.value
                          }
                        })}
                        placeholder="e.g., Custom Shop, DIY, etc."
                        className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Pickup Name/Model (optional)
                      </label>
                      <input
                        type="text"
                        value={wizardData[`pickup${wizardStep}`].customName}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          [`pickup${wizardStep}`]: {
                            ...wizardData[`pickup${wizardStep}`],
                            customName: e.target.value
                          }
                        })}
                        placeholder="e.g., Hot Bridge, Custom Neck, etc."
                        className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Detailed Testing Instructions */}
                  {(() => {
                    const instructions = getPhaseInstructions(phaseTestingMethod);
                    return (
                      <div className="bg-gray-700 rounded-lg p-4 border-2 border-yellow-500">
                        <button
                          onClick={() => setShowInstructions(!showInstructions)}
                          className="w-full flex items-center justify-between text-left hover:bg-gray-600 rounded p-2 -m-2 transition"
                        >
                          <h3 className="font-bold text-yellow-400">
                            {instructions.title}
                          </h3>
                          <span className="text-yellow-400 text-xl">
                            {showInstructions ? '−' : '+'}
                          </span>
                        </button>
                        {showInstructions && (
                        <div className="space-y-3 text-sm text-gray-200 mt-3">
                          {/* Device Setup Info */}
                          <div className="bg-gray-600 rounded p-2">
                            {instructions.deviceSetup.map((line, idx) => (
                              <div key={idx} className="text-gray-300">
                                {idx === 1 && instructions.deviceLink ? (
                                  <a href={instructions.deviceLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                    {line}
                                  </a>
                                ) : line}
                              </div>
                            ))}
                          </div>

                          <div className="font-semibold text-yellow-300">Test Each Coil Individually:</div>

                          {/* North Coil Test */}
                          <div>
                            <div className="font-semibold text-white mb-1">North Coil Test:</div>
                            <div className="ml-4 space-y-1">
                              {instructions.testSteps.map((step, idx) => (
                                <div key={idx}>
                                  {idx + 1}. {step.highlight === 'red' ? (
                                    <><span className="text-red-400 font-semibold">RED lead (+)</span> → Connect to North Start wire</>
                                  ) : step.highlight === 'black' ? (
                                    <><span className="bg-gray-800 px-1 rounded font-semibold">BLACK lead (−)</span> → Connect to North Finish wire</>
                                  ) : step.highlight === 'yellow' ? (
                                    <><span className="text-yellow-300 font-semibold">Rapidly pull screwdriver off</span> the poles</>
                                  ) : step.text.replace('coil', 'North coil')}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* South Coil Test */}
                          <div>
                            <div className="font-semibold text-white mb-1">South Coil Test:</div>
                            <div className="ml-4 space-y-1">
                              {instructions.testSteps.map((step, idx) => (
                                <div key={idx}>
                                  {idx + 1}. {step.highlight === 'red' ? (
                                    <><span className="text-red-400 font-semibold">RED lead (+)</span> → Connect to South Start wire</>
                                  ) : step.highlight === 'black' ? (
                                    <><span className="bg-gray-800 px-1 rounded font-semibold">BLACK lead (−)</span> → Connect to South Finish wire</>
                                  ) : step.highlight === 'yellow' ? (
                                    <><span className="text-yellow-300 font-semibold">Rapidly pull screwdriver off</span> the poles</>
                                  ) : step.text.replace('coil', 'South coil')}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Question */}
                          <div className="bg-gray-600 rounded p-2 mt-2">
                            <div className="font-semibold text-yellow-300">{instructions.question}</div>
                          </div>

                          {/* Visual Guide */}
                          <div className="bg-blue-900 rounded p-3 mt-2">
                            <div className="font-semibold text-blue-300 mb-2">Visual Guide:</div>
                            <div className="text-gray-300 mb-2">{instructions.visualNote}</div>
                            {instructions.visualMappings.map((mapping, idx) => (
                              <div key={idx} className="text-sm text-gray-300 ml-2">• {mapping}</div>
                            ))}
                          </div>
                        </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* North Coil */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">North Coil</div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Pole Type:</label>
                        <select
                          value={wizardData[`pickup${wizardStep}`].northPoleType}
                          onChange={(e) => setWizardData({
                            ...wizardData,
                            [`pickup${wizardStep}`]: {
                              ...wizardData[`pickup${wizardStep}`],
                              northPoleType: e.target.value
                            }
                          })}
                          className="bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-xs"
                        >
                          <option value="Slug">Slug</option>
                          <option value="Screw">Screw</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-300 block mb-1">
                          <span className="text-red-400 font-semibold">RED lead (+)</span> - Start Wire
                        </label>
                        <select
                          value={wizardData[`pickup${wizardStep}`].customColors.northPositive}
                          onChange={(e) => setWizardData({
                            ...wizardData,
                            [`pickup${wizardStep}`]: {
                              ...wizardData[`pickup${wizardStep}`],
                              customColors: {
                                ...wizardData[`pickup${wizardStep}`].customColors,
                                northPositive: e.target.value
                              }
                            }
                          })}
                          className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-2 text-sm"
                        >
                          {colorOptions.map((color, idx) => (
                            <option key={idx} value={color}>{color || '-- Select Color --'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-300 block mb-1">
                          <span className="bg-gray-800 px-1 rounded font-semibold">BLACK lead (−)</span> - Finish Wire
                        </label>
                        <select
                          value={wizardData[`pickup${wizardStep}`].customColors.northNegative}
                          onChange={(e) => setWizardData({
                            ...wizardData,
                            [`pickup${wizardStep}`]: {
                              ...wizardData[`pickup${wizardStep}`],
                              customColors: {
                                ...wizardData[`pickup${wizardStep}`].customColors,
                                northNegative: e.target.value
                              }
                            }
                          })}
                          className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-2 text-sm"
                        >
                          {colorOptions.map((color, idx) => (
                            <option key={idx} value={color}>{color || '-- Select Color --'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* North Coil Phase */}
                    {(() => {
                      const instructions = getPhaseInstructions(phaseTestingMethod);
                      const currentPhase = wizardData[`pickup${wizardStep}`].northPhase;
                      const isSecondOption = currentPhase === instructions.phaseOptions[1].value;
                      const noSelection = !currentPhase;

                      return (
                        <div className="mt-2">
                          <div className="text-xs text-gray-300 mb-2">North Coil Phase Test:</div>
                          <div className="flex items-center gap-2 bg-gray-800 rounded-full p-1 relative">
                            {/* Sliding background */}
                            {!noSelection && (
                              <div
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-full transition-all duration-300 ease-in-out ${
                                  isSecondOption ? 'left-[calc(50%+2px)]' : 'left-1'
                                }`}
                              />
                            )}

                            {/* Option buttons */}
                            {instructions.phaseOptions.map((option, idx) => (
                              <button
                                key={idx}
                                onClick={() => setWizardData({
                                  ...wizardData,
                                  [`pickup${wizardStep}`]: { ...wizardData[`pickup${wizardStep}`], northPhase: option.value }
                                })}
                                className="flex-1 relative z-10 py-2 px-2 rounded-full transition-colors text-center"
                              >
                                <div className={`text-sm font-semibold transition-colors ${
                                  currentPhase === option.value ? 'text-white' : noSelection ? 'text-gray-300' : 'text-gray-400'
                                }`}>
                                  {option.label}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* South Coil */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">South Coil</div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Pole Type:</label>
                        <select
                          value={wizardData[`pickup${wizardStep}`].southPoleType}
                          onChange={(e) => setWizardData({
                            ...wizardData,
                            [`pickup${wizardStep}`]: {
                              ...wizardData[`pickup${wizardStep}`],
                              southPoleType: e.target.value
                            }
                          })}
                          className="bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-xs"
                        >
                          <option value="Slug">Slug</option>
                          <option value="Screw">Screw</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-300 block mb-1">
                          <span className="text-red-400 font-semibold">RED lead (+)</span> - Start Wire
                        </label>
                        <select
                          value={wizardData[`pickup${wizardStep}`].customColors.southPositive}
                          onChange={(e) => setWizardData({
                            ...wizardData,
                            [`pickup${wizardStep}`]: {
                              ...wizardData[`pickup${wizardStep}`],
                              customColors: {
                                ...wizardData[`pickup${wizardStep}`].customColors,
                                southPositive: e.target.value
                              }
                            }
                          })}
                          className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-2 text-sm"
                        >
                          {colorOptions.map((color, idx) => (
                            <option key={idx} value={color}>{color || '-- Select Color --'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-300 block mb-1">
                          <span className="bg-gray-800 px-1 rounded font-semibold">BLACK lead (−)</span> - Finish Wire
                        </label>
                        <select
                          value={wizardData[`pickup${wizardStep}`].customColors.southNegative}
                          onChange={(e) => setWizardData({
                            ...wizardData,
                            [`pickup${wizardStep}`]: {
                              ...wizardData[`pickup${wizardStep}`],
                              customColors: {
                                ...wizardData[`pickup${wizardStep}`].customColors,
                                southNegative: e.target.value
                              }
                            }
                          })}
                          className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-2 text-sm"
                        >
                          {colorOptions.map((color, idx) => (
                            <option key={idx} value={color}>{color || '-- Select Color --'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* South Coil Phase */}
                    {(() => {
                      const instructions = getPhaseInstructions(phaseTestingMethod);
                      const currentPhase = wizardData[`pickup${wizardStep}`].southPhase;
                      const isSecondOption = currentPhase === instructions.phaseOptions[1].value;
                      const noSelection = !currentPhase;

                      return (
                        <div className="mt-2">
                          <div className="text-xs text-gray-300 mb-2">South Coil Phase Test:</div>
                          <div className="flex items-center gap-2 bg-gray-800 rounded-full p-1 relative">
                            {/* Sliding background */}
                            {!noSelection && (
                              <div
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-full transition-all duration-300 ease-in-out ${
                                  isSecondOption ? 'left-[calc(50%+2px)]' : 'left-1'
                                }`}
                              />
                            )}

                            {/* Option buttons */}
                            {instructions.phaseOptions.map((option, idx) => (
                              <button
                                key={idx}
                                onClick={() => setWizardData({
                                  ...wizardData,
                                  [`pickup${wizardStep}`]: { ...wizardData[`pickup${wizardStep}`], southPhase: option.value }
                                })}
                                className="flex-1 relative z-10 py-2 px-2 rounded-full transition-colors text-center"
                              >
                                <div className={`text-sm font-semibold transition-colors ${
                                  currentPhase === option.value ? 'text-white' : noSelection ? 'text-gray-300' : 'text-gray-400'
                                }`}>
                                  {option.label}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {/* 2-Conductor Option - Only for preset pickups */}
              {!wizardData[`pickup${wizardStep}`].isCustom && (
                <div>
                  <label className="flex items-center gap-3 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wizardData[`pickup${wizardStep}`].isTwoConductor}
                      onChange={(e) => setWizardData({
                        ...wizardData,
                        [`pickup${wizardStep}`]: { ...wizardData[`pickup${wizardStep}`], isTwoConductor: e.target.checked }
                      })}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">This is a 2-conductor pickup</span>
                  </label>
                </div>
              )}
              
              {/* Phase Testing Instructions - Only for preset pickups */}
              {!wizardData[`pickup${wizardStep}`].isCustom && wizardData[`pickup${wizardStep}`].preset && (() => {
                const selectedPreset = allPresets.find(p => p.name === wizardData[`pickup${wizardStep}`].preset);
                if (!selectedPreset || !selectedPreset.manufacturer) return null;

                const instructions = getPhaseInstructions(phaseTestingMethod);

                return (
                  <div className="bg-gray-700 rounded-lg p-4 border-2 border-yellow-500">
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="w-full flex items-center justify-between text-left hover:bg-gray-600 rounded p-2 -m-2 transition"
                    >
                      <h3 className="font-bold text-yellow-400">
                        {instructions.title}
                      </h3>
                      <span className="text-yellow-400 text-xl">
                        {showInstructions ? '−' : '+'}
                      </span>
                    </button>
                    {showInstructions && (
                    <div className="space-y-3 text-sm text-gray-200 mt-3">
                      {/* Device Setup Info */}
                      <div className="bg-gray-600 rounded p-2">
                        {instructions.deviceSetup.map((line, idx) => (
                          <div key={idx} className="text-gray-300">
                            {idx === 1 && instructions.deviceLink ? (
                              <a href={instructions.deviceLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                {line}
                              </a>
                            ) : line}
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="font-semibold text-white mb-1">Step 1: Connect Test Leads</div>
                        <div className="ml-4">
                          • <span className="text-red-400">RED lead (+)</span> → <span className="font-bold text-white">{selectedPreset.north.positive} wire</span> (North Start/Ground wire)
                        </div>
                        <div className="ml-4">
                          • <span className="text-black bg-gray-300 px-1 rounded">BLACK lead (−)</span> → <span className="font-bold text-white">{selectedPreset.south.negative} wire</span> (South Finish/Hot wire)
                        </div>
                      </div>

                      {!wizardData[`pickup${wizardStep}`].isTwoConductor && (
                        <div>
                          <div className="font-semibold text-white mb-1">Step 2: Connect Series Wires</div>
                          <div className="ml-4">
                            • Twist together: <span className="font-bold text-white">{selectedPreset.north.negative}</span> + <span className="font-bold text-white">{selectedPreset.south.positive}</span> wires
                          </div>
                          <div className="ml-4 text-yellow-300 text-xs mt-1">
                            (These create the series connection for testing)
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="font-semibold text-white mb-1">Step 3: Perform Phase Test</div>
                        {phaseTestingMethod === 'naudio' ? (
                          <>
                            <div className="ml-4">
                              • Power on the N-Audio Phase Checker device
                            </div>
                            <div className="ml-4">
                              • <span className="text-yellow-300 font-semibold">Tap on the pickup with a large flat metal object</span>
                            </div>
                            <div className="ml-4">
                              • Read the LED indicator color
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="ml-4">
                              • Place a screwdriver (or similar metal object) flat on the pickup pole pieces
                            </div>
                            <div className="ml-4">
                              • <span className="text-yellow-300 font-semibold">Rapidly pull the screwdriver off</span> the poles
                            </div>
                            <div className="ml-4">
                              • Watch the {phaseTestingMethod === 'analog' ? 'needle direction' : 'voltage reading'}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="bg-gray-600 rounded p-2 mt-2">
                        <div className="font-semibold text-yellow-300">{instructions.question}</div>
                      </div>

                      {/* Visual Guide */}
                      <div className="bg-blue-900 rounded p-3 mt-2">
                        <div className="font-semibold text-blue-300 mb-2">Visual Guide:</div>
                        <div className="text-gray-300 mb-2">{instructions.visualNote}</div>
                        {instructions.visualMappings.map((mapping, idx) => (
                          <div key={idx} className="text-sm text-gray-300 ml-2">• {mapping}</div>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                );
              })()}
              
              {/* Phase Selection - Only for preset pickups */}
              {!wizardData[`pickup${wizardStep}`].isCustom && (() => {
                const instructions = getPhaseInstructions(phaseTestingMethod);
                const currentPhase = wizardData[`pickup${wizardStep}`].phase;
                const isSecondOption = currentPhase === instructions.phaseOptions[1].value;
                const isFirstOption = currentPhase === instructions.phaseOptions[0].value;
                const noSelection = !currentPhase;

                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Phase Test Result
                    </label>
                    <div className="flex items-center justify-between gap-4 bg-gray-700 rounded-full p-2 relative">
                      {/* Sliding background */}
                      {!noSelection && (
                        <div
                          className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-blue-600 rounded-full transition-all duration-300 ease-in-out ${
                            isSecondOption ? 'left-[calc(50%+4px)]' : 'left-2'
                          }`}
                        />
                      )}

                      {/* Option buttons */}
                      {instructions.phaseOptions.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => setWizardData({
                            ...wizardData,
                            [`pickup${wizardStep}`]: { ...wizardData[`pickup${wizardStep}`], phase: option.value }
                          })}
                          className="flex-1 relative z-10 py-3 px-4 rounded-full transition-colors text-center"
                        >
                          <div className={`text-xl mb-1 transition-all ${
                            currentPhase === option.value ? 'scale-110' : noSelection ? 'scale-100 opacity-100' : 'scale-100 opacity-60'
                          }`}>
                            {option.label.split(' ')[0]}
                          </div>
                          <div className={`text-xs font-semibold transition-colors ${
                            currentPhase === option.value ? 'text-white' : noSelection ? 'text-gray-300' : 'text-gray-400'
                          }`}>
                            {option.display}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            )}

            {/* Navigation Buttons - Only show for pickup selection steps */}
            {wizardStep > 0 && (
            <div className="flex gap-4 mt-8">
              {wizardStep === 2 && (
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setShowInstructions(false);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => {
                  const currentData = wizardData[`pickup${wizardStep}`];
                  const isValid = currentData.preset && (
                    !currentData.isCustom 
                      ? currentData.phase  // Preset needs phase
                      : (currentData.northPhase && currentData.southPhase)  // Custom needs both phases
                  );
                  
                  if (!isValid) return;
                  
                  // Check for phase mismatch in custom pickups
                  if (currentData.isCustom && currentData.northPhase !== currentData.southPhase) {
                    setCustomPhaseMismatchData({ pickupStep: wizardStep });
                    setShowCustomPhaseMismatch(true);
                    return;
                  }
                  
                  if (wizardStep === 1) {
                    setWizardStep(2);
                    setShowInstructions(false);
                  } else if (wizardStep === 2) {
                    completeWizard();
                  }
                }}
                disabled={(() => {
                  const currentData = wizardData[`pickup${wizardStep}`];
                  if (!currentData.preset) return true;
                  if (currentData.isCustom) {
                    return !currentData.northPhase || !currentData.southPhase;
                  }
                  return !currentData.phase;
                })()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {wizardStep === 1 ? 'Next →' : 'Complete Setup'}
              </button>

              {/* Share with Community button - only show for custom pickups */}
              {CONFIG?.ENABLE_SHARE_BUTTON && wizardData[`pickup${wizardStep}`]?.isCustom && (
                <button
                  onClick={() => shareCustomPickupWithCommunity(wizardStep)}
                  disabled={(() => {
                    const currentData = wizardData[`pickup${wizardStep}`];
                    // Only require wire colors
                    const hasAllColors = currentData.customColors.northPositive &&
                                        currentData.customColors.northNegative &&
                                        currentData.customColors.southPositive &&
                                        currentData.customColors.southNegative;
                    return !hasAllColors;
                  })()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  title="Share this custom pickup with the community database (only wire colors required)"
                >
                  <Upload size={20} />
                  Share with Community
                </button>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Pickup Phase Mismatch Modal */}
      {showCustomPhaseMismatch && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg border-2 border-yellow-500">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">⚠️ Coil Phase Mismatch Detected</h3>
            
            <p className="text-gray-300 mb-4">
              The North and South coils have opposite phase directions. For a humbucker to work properly 
              and cancel hum, both coils must have the same phase direction.
            </p>
            
            <p className="text-white font-semibold mb-4">
              Which coil would you like to flip to match the other?
            </p>
            
            <div className="bg-gray-700 rounded p-3 mb-4 text-sm text-gray-300">
              <div className="font-semibold text-yellow-400 mb-2">Flipping a coil will:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Swap the wire colors for that coil</li>
                <li>Reverse its phase direction to match the other coil</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => flipCustomCoil('north')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition"
              >
                Flip North Coil
              </button>
              <button
                onClick={() => flipCustomCoil('south')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition"
              >
                Flip South Coil
              </button>
            </div>
            
            <button
              onClick={() => setShowCustomPhaseMismatch(false)}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}



      {/* Phase Warning Modal */}
      {showPhaseWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md border-2 border-yellow-500">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Phase Mismatch Detected</h3>
            
            {phaseWarningData?.type === 'internal' ? (
              <>
                <p className="text-gray-300 mb-4">
                  The two coils have opposite phase directions. For proper hum-canceling operation, 
                  both coils should have the same phase direction (both pointing left OR both pointing right).
                </p>
                <p className="text-gray-300 mb-6">
                  Would you like to reverse the {phaseWarningData?.coil === 'north' ? 'North' : 'South'} coil's 
                  phase to match? This will swap the wire colors on this coil.
                </p>
              </>
            ) : phaseWarningData?.type === 'both-2-conductor' ? (
              <>
                <p className="text-gray-300 mb-4">
                  <strong className="text-red-400">⚠️ CRITICAL: Both pickups are 2-conductor wiring!</strong>
                </p>
                <p className="text-gray-300 mb-4">
                  Pickup {phaseWarningData?.pickupIndex + 1} and Pickup {phaseWarningData?.otherPickupIndex + 1} 
                  have opposite phase directions. Since both are 2-conductor pickups, you cannot fix this by reversing wires.
                </p>
                <p className="text-gray-300 mb-6">
                  <strong>To make these pickups compatible, you must:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Open one pickup and physically flip the magnet orientation, OR</li>
                    <li>Open one pickup and rewire the internal coil connections</li>
                  </ul>
                </p>
                <p className="text-yellow-300 text-sm italic">
                  These pickups will NOT hum-cancel properly together without physical modification.
                </p>
              </>
            ) : phaseWarningData?.type === 'one-2-conductor' ? (
              <>
                <p className="text-gray-300 mb-4">
                  Pickup {phaseWarningData?.pickupIndex + 1} and Pickup {phaseWarningData?.otherPickupIndex + 1} 
                  have opposite phase directions.
                </p>
                <p className="text-gray-300 mb-4">
                  {phaseWarningData?.whichIs2Conductor === 'current' ? (
                    <>
                      Pickup {phaseWarningData?.pickupIndex + 1} is 2-conductor (cannot be reversed by wiring).
                      Pickup {phaseWarningData?.otherPickupIndex + 1} is 4-conductor.
                    </>
                  ) : (
                    <>
                      Pickup {phaseWarningData?.otherPickupIndex + 1} is 2-conductor (cannot be reversed by wiring).
                      Pickup {phaseWarningData?.pickupIndex + 1} is 4-conductor.
                    </>
                  )}
                </p>
                <p className="text-gray-300 mb-6">
                  Would you like to reverse the 4-conductor Pickup {phaseWarningData?.whichIs2Conductor === 'current' ? phaseWarningData?.otherPickupIndex + 1 : phaseWarningData?.pickupIndex + 1} to match? 
                  This will swap the wire colors on both coils.
                </p>
              </>
            ) : phaseWarningData?.type === 'both-4-conductor' ? (
              <>
                <p className="text-gray-300 mb-4">
                  <strong className="text-yellow-400">Both pickups are 4-conductor (reversible)</strong>
                </p>
                <p className="text-gray-300 mb-4">
                  Pickup {phaseWarningData?.pickupIndex + 1} has opposite phase direction compared to 
                  Pickup {phaseWarningData?.otherPickupIndex + 1}.
                </p>
                <p className="text-gray-300 mb-6">
                  Would you like to reverse both coils in Pickup {phaseWarningData?.pickupIndex + 1} to match? 
                  This will swap the wire colors on both coils.
                </p>
              </>
            ) : phaseWarningData?.type === 'cross-pickup-2conductor-current' ? (
              <>
                <p className="text-gray-300 mb-4">
                  Pickup {phaseWarningData?.otherPickupIndex + 1} (2-conductor) has opposite phase direction 
                  compared to Pickup {phaseWarningData?.pickupIndex + 1} (4-conductor).
                </p>
                <p className="text-gray-300 mb-6">
                  Since Pickup {phaseWarningData?.otherPickupIndex + 1} is 2-conductor and cannot be reversed, 
                  would you like to reverse the 4-conductor Pickup {phaseWarningData?.pickupIndex + 1} to match? 
                  This will swap the wire colors on both coils.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-300 mb-4">
                  Pickup {phaseWarningData?.pickupIndex + 1} has opposite phase direction compared to 
                  Pickup {phaseWarningData?.otherPickupIndex + 1}. For consistency across all pickups, 
                  they should all have the same phase direction.
                </p>
                <p className="text-gray-300 mb-6">
                  Would you like to reverse both coils in Pickup {phaseWarningData?.pickupIndex + 1} to match? 
                  This will swap the wire colors on both coils.
                </p>
              </>
            )}
            
            <div className="flex gap-3">
              {phaseWarningData?.type !== 'both-2-conductor' ? (
                <>
                  <button
                    onClick={reverseCoilPhase}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-semibold transition"
                  >
                    Yes, Reverse Phase
                  </button>
                  <button
                    onClick={() => {
                      setShowPhaseWarning(false);
                      setPhaseWarningData(null);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold transition"
                  >
                    No, Keep As Is
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowPhaseWarning(false);
                    setPhaseWarningData(null);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition"
                >
                  I Understand - Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 print:mb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 print:text-black">Humbucker Pickup Analyzer</h1>
            <p className="text-gray-400 mt-1 print:text-gray-700">Color Code & Phase Testing Tool</p>
          </div>
          <div className="flex gap-2 print:hidden">
            {pickups.length < 3 && (
              <button
                onClick={addPickup}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition"
              >
                <Plus size={18} />
                Add Pickup
              </button>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
            >
              <RotateCcw size={18} />
              Reset All
            </button>
          </div>
        </div>

        {/* Looth Tool Advertisement */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 mb-6 border-2 border-blue-500 print:hidden">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <h2 className="text-2xl font-bold text-blue-300 mb-2 print:text-black">
                🔧 Professional Guitar Tech Tools
              </h2>
              <p className="text-gray-300 mb-3 print:text-gray-700">
                Need quality luthier tools? Check out our selection of professional-grade equipment for 
                guitar building, repair, and pickup winding at <strong className="text-blue-400 print:text-black">LoothTool.com</strong>
              </p>
              <a 
                href="https://loothtool.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition print:hidden"
              >
                Visit LoothTool.com →
              </a>
              <span className="hidden print:inline text-blue-600 font-semibold">
                Visit us at: https://loothtool.com/
              </span>
            </div>
            <div className="text-6xl print:text-4xl">
              🎸
            </div>
          </div>
        </div>

        {/* Visual Comparison - Side by Side */}
        {pickups.length > 1 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 print:border print:border-gray-300 print:bg-white print:p-4 print:mb-4">
            <h2 className="text-xl font-semibold mb-4 text-blue-300 print:text-black print:text-lg print:mb-3">Visual Comparison</h2>
            <div className={`grid grid-cols-1 ${pickups.length === 2 ? 'md:grid-cols-2 print:grid-cols-2' : 'md:grid-cols-3 print:grid-cols-3'} gap-4 print:gap-3`}>
              {pickups.map((pickup, index) => (
                <div key={pickup.id} className="border border-gray-700 rounded-lg p-4 print:border-gray-300 print:p-3">
                  <h3 className="text-center text-sm font-semibold mb-2 text-gray-300 print:text-black">
                    Pickup {index + 1}: {pickup.pickupName || 'Unnamed'}
                  </h3>
                  <PickupVisual pickup={pickup} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Section - Below Visual Comparison */}
        {pickups.length === 2 && pickups[0].manufacturer && pickups[1].manufacturer && !showSetupWizard && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 print:border print:border-gray-300 print:bg-white print:break-inside-avoid print:p-4">
            <div className="flex items-center justify-between mb-6 print:block print:mb-4">
              <h2 className="text-2xl font-bold text-blue-400 print:text-black print:text-xl print:mb-3">Pickup Summary</h2>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition print:hidden"
                title="Print pickup details and wiring diagrams"
              >
                <Printer size={20} />
                Print
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4">
              {pickups.map((pickup, idx) => (
                <div key={pickup.id} className="bg-gray-700 rounded-lg p-6 print:border print:border-gray-300 print:bg-white print:break-inside-avoid print:p-4">
                  <h3 className="text-xl font-bold text-blue-300 mb-4 print:text-black">
                    Pickup {idx + 1}: {pickup.pickupName || pickup.manufacturer}
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400 print:text-gray-700">Manufacturer:</span>
                      <span className="text-white ml-2 font-semibold print:text-black">{pickup.manufacturer}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 print:text-gray-700">Configuration:</span>
                      <span className="text-white ml-2 font-semibold print:text-black">
                        {pickup.isTwoConductor ? '2-Conductor' : '4-Conductor'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 print:text-gray-700">Phase:</span>
                      <span className="text-white ml-2 font-semibold print:text-black">{getPhaseDisplay(pickup.coils.north.phase)}</span>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-3 mt-3 print:border-gray-300">
                      <div className="font-semibold text-gray-300 mb-2 print:text-black">Wire Colors:</div>
                      {(() => {
                        // Determine original ground and hot wires based on manufacturer
                        let originalGround = '';
                        let originalHot = '';
                        
                        if (pickup.manufacturer === 'Custom') {
                          // For custom pickups, use the actual wire positions
                          originalGround = pickup.coils.north.positive.color;
                          originalHot = pickup.coils.south.negative.color;
                        } else if (pickup.manufacturer === 'Seymour Duncan' || 
                            pickup.manufacturer === 'Duncan Designed' ||
                            pickup.manufacturer === 'EMG HZ' ||
                            pickup.manufacturer === 'Bare Knuckle' ||
                            pickup.manufacturer === 'Rockfield' ||
                            pickup.manufacturer === 'GFS' ||
                            pickup.manufacturer === 'Bill Lawrence') {
                          originalGround = 'Green';
                          originalHot = 'Black';
                        } else if (pickup.manufacturer === 'DiMarzio' || pickup.manufacturer === 'Swinehead') {
                          originalGround = 'Green';
                          originalHot = 'Red';
                        } else if (pickup.manufacturer === 'Gibson') {
                          originalGround = 'Black';
                          originalHot = 'Red';
                        } else if (pickup.manufacturer === 'Fender' || pickup.manufacturer === 'Jackson') {
                          originalGround = 'Green';
                          originalHot = 'White';
                        } else if (pickup.manufacturer === 'Peavey') {
                          originalGround = 'Green';
                          originalHot = 'Yellow';
                        } else if (pickup.manufacturer === 'Iron Gear' || pickup.manufacturer === 'Gotoh' || pickup.manufacturer === 'TDM') {
                          originalGround = 'Green';
                          originalHot = 'Yellow';
                        } else if (pickup.manufacturer === 'Ibanez') {
                          originalGround = 'Green';
                          originalHot = 'Blue';
                        } else if (pickup.manufacturer === 'Lawrence') {
                          originalGround = 'Green';
                          originalHot = 'Red';
                        } else if (pickup.manufacturer === 'EMG') {
                          originalGround = 'Bare/Shield';
                          originalHot = 'Red';
                        } else {
                          originalGround = 'Green';
                          originalHot = 'Black';
                        }
                        
                        // If reversed, swap ground and hot
                        let currentGround = originalGround;
                        let currentHot = originalHot;
                        if (pickup.isReversed) {
                          currentGround = originalHot;
                          currentHot = originalGround;
                        }
                        
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-green-400 print:text-black">GND:</span>
                                <span className="text-white ml-2 print:text-black">{currentGround}</span>
                              </div>
                              <div>
                                <span className="text-red-400 print:text-black">HOT:</span>
                                <span className="text-white ml-2 print:text-black">{currentHot}</span>
                              </div>
                            </div>
                            {!pickup.isTwoConductor && (
                              <div className="mt-2">
                                <span className="text-yellow-400 print:text-black">Series:</span>
                                <span className="text-white ml-2 print:text-black">
                                  {pickup.coils.north.negative.color} + {pickup.coils.south.positive.color}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="border-t border-gray-700 pt-3 mt-3 print:border-gray-300">
                      <div className="font-semibold text-gray-300 mb-2 print:text-black">Pole Types:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-400 print:text-gray-700">North:</span>
                          <span className="text-white ml-2 print:text-black">{pickup.coils.north.poleType}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 print:text-gray-700">South:</span>
                          <span className="text-white ml-2 print:text-black">{pickup.coils.south.poleType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Pickup Sections */}
        {pickups.map((pickup, pickupIndex) => (
          <div key={pickup.id} className="mb-8 print:page-break-before print:hidden">
            {/* Pickup Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-400 print:text-black">
                Pickup {pickupIndex + 1}
              </h2>
              {pickups.length > 1 && (
                <button
                  onClick={() => removePickup(pickupIndex)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition text-sm print:hidden"
                >
                  <X size={16} />
                  Remove
                </button>
              )}
            </div>

            {/* Pickup Info */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 print:border print:border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-blue-300 print:text-black">Pickup Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-700">Load Preset</label>
                  <select
                    onChange={(e) => applyPreset(pickupIndex, e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 print:bg-white print:text-black print:border-gray-400"
                    defaultValue=""
                  >
                    {allPresets.map((preset, idx) => (
                      <option key={idx} value={preset.name}>{preset.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-700">Pickup Name/Model</label>
                  <input
                    type="text"
                    value={pickup.pickupName}
                    onChange={(e) => updatePickup(pickupIndex, 'pickupName', e.target.value)}
                    placeholder="e.g., PAF Vintage, JB Bridge"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 print:bg-white print:text-black print:border-gray-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-700">Manufacturer</label>
                  <input
                    type="text"
                    value={pickup.manufacturer}
                    onChange={(e) => updatePickup(pickupIndex, 'manufacturer', e.target.value)}
                    placeholder="e.g., Seymour Duncan, DiMarzio"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 print:bg-white print:text-black print:border-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Visual Display for single pickup or details view */}
            {pickups.length === 1 && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6 print:border print:border-gray-300">
                <h3 className="text-xl font-semibold mb-4 text-blue-300 print:text-black">Visual Diagram</h3>
                <div className="flex justify-center">
                  <PickupVisual pickup={pickup} />
                </div>
              </div>
            )}

            {/* Coils Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* North Coil */}
              <div className="bg-gray-800 rounded-lg p-6 print:border print:border-gray-300">
                <h3 className="text-xl font-semibold mb-4 text-green-400 print:text-black">
                  {pickup.coils.north.polarity ? 'North Coil' : 'Coil 1'}
                  {pickup.coils.north.poleType && ` (${pickup.coils.north.poleType} Side)`}
                </h3>
                
                <div className="space-y-4">
                  <PoleTypeSelect
                    value={pickup.coils.north.poleType}
                    onChange={(v) => updatePoleType(pickupIndex, 'north', v)}
                  />

                  <CoilPolaritySelect
                    value={pickup.coils.north.polarity}
                    onChange={(v) => updatePolarity(pickupIndex, 'north', v)}
                  />

                  <div className="bg-gray-700/50 p-4 rounded print:bg-gray-100">
                    <h4 className="font-semibold mb-3 text-green-300 print:text-black">Positive (+) Analog Meter Terminal</h4>
                    <ColorSelect 
                      value={pickup.coils.north.positive.color}
                      onChange={(v) => updateCoil(pickupIndex, 'north', 'positive', 'color', v)}
                      label="Wire Color"
                    />
                  </div>

                  <div className="bg-gray-700/50 p-4 rounded print:bg-gray-100">
                    <h4 className="font-semibold mb-3 text-green-300 print:text-black">Negative (-) Analog Meter Terminal</h4>
                    <ColorSelect 
                      value={pickup.coils.north.negative.color}
                      onChange={(v) => updateCoil(pickupIndex, 'north', 'negative', 'color', v)}
                      label="Wire Color"
                    />
                  </div>

                  <PhaseSelect
                    value={pickup.coils.north.phase}
                    onChange={(v) => updatePhase(pickupIndex, 'north', v)}
                  />
                </div>
              </div>

              {/* South Coil */}
              <div className="bg-gray-800 rounded-lg p-6 print:border print:border-gray-300">
                <h3 className="text-xl font-semibold mb-4 text-purple-400 print:text-black">
                  {pickup.coils.south.polarity ? 'South Coil' : 'Coil 2'}
                  {pickup.coils.south.poleType && ` (${pickup.coils.south.poleType} Side)`}
                </h3>
                
                <div className="space-y-4">
                  <PoleTypeSelect
                    value={pickup.coils.south.poleType}
                    onChange={(v) => updatePoleType(pickupIndex, 'south', v)}
                  />

                  <CoilPolaritySelect
                    value={pickup.coils.south.polarity}
                    onChange={(v) => updatePolarity(pickupIndex, 'south', v)}
                  />

                  <div className="bg-gray-700/50 p-4 rounded print:bg-gray-100">
                    <h4 className="font-semibold mb-3 text-purple-300 print:text-black">Positive (+) Analog Meter Terminal</h4>
                    <ColorSelect 
                      value={pickup.coils.south.positive.color}
                      onChange={(v) => updateCoil(pickupIndex, 'south', 'positive', 'color', v)}
                      label="Wire Color"
                    />
                  </div>

                  <div className="bg-gray-700/50 p-4 rounded print:bg-gray-100">
                    <h4 className="font-semibold mb-3 text-purple-300 print:text-black">Negative (-) Analog Meter Terminal</h4>
                    <ColorSelect 
                      value={pickup.coils.south.negative.color}
                      onChange={(v) => updateCoil(pickupIndex, 'south', 'negative', 'color', v)}
                      label="Wire Color"
                    />
                  </div>

                  <PhaseSelect
                    value={pickup.coils.south.phase}
                    onChange={(v) => updatePhase(pickupIndex, 'south', v)}
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 print:border print:border-gray-300">
              <h3 className="text-xl font-semibold mb-4 text-blue-300 print:text-black">Notes & Observations</h3>
              <textarea
                value={pickup.notes}
                onChange={(e) => updatePickup(pickupIndex, 'notes', e.target.value)}
                placeholder="Additional notes, measurements, observations..."
                rows={4}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 print:bg-white print:text-black print:border-gray-400"
              />
            </div>
          </div>
        ))}

        {/* Testing Guide */}
        <div className="bg-gray-800 rounded-lg p-6 print:border print:border-gray-300 print:page-break-before print:hidden">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400 print:text-black">Testing Guide</h2>
          
          <div className="space-y-4 text-gray-300 text-sm print:text-black">
            <div>
              <h3 className="font-semibold text-yellow-300 mb-2 print:text-black">Magnetic Polarity Test:</h3>
              <p><strong>Tool:</strong> Magnetic pole checker or compass</p>
              <p><strong>Method:</strong> Place the magnetic checker on top of the pole pieces. The tool will indicate North or South magnetic polarity.</p>
              <p className="text-yellow-200 print:text-gray-700 italic mt-1">Note: For hum-canceling, the two coils must have opposite magnetic polarities (one North Up, one South Up).</p>
            </div>
            
            <div className="border-t border-gray-600 pt-4 print:border-gray-300">
              <h3 className="font-semibold text-yellow-300 mb-2 print:text-black">Phase Test (Screwdriver Pull-Off):</h3>
              <p><strong>Setup:</strong> Connect analog analog meter leads to coil terminals, set to lowest DC voltage range.</p>
              <p><strong>Test:</strong> Quickly pull a screwdriver away from the pole pieces while watching the needle.</p>
              <p><strong>← Needle jumps LEFT</strong></p>
              <p><strong>→ Needle jumps RIGHT</strong></p>
              <p className="text-yellow-200 print:text-gray-700 italic mt-1">Note: Proper electrical phasing combined with correct magnetic polarity is critical for hum-canceling operation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Save Session</h2>
            <p className="text-gray-300 mb-4">
              Save your current pickup configuration to load later or export.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Name
              </label>
              <input
                type="text"
                value={currentSessionName}
                onChange={(e) => setCurrentSessionName(e.target.value)}
                placeholder="e.g., '59 Les Paul Custom'"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveSession}
                className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSessionModal(false);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Session Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Load Saved Session</h2>
            
            {savedSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No saved sessions yet.</p>
                <p className="text-sm text-gray-500">Save your current work to create a session.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg mb-1 truncate">
                          {session.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {new Date(session.date).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {session.pickups.length} pickup{session.pickups.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => loadSession(session)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold transition"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => exportSession(session)}
                          className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-semibold transition"
                        >
                          Export
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowLoadModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { 
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          .print\\:border { border: 1px solid #d1d5db !important; }
          .print\\:text-black { color: black !important; }
          .print\\:text-gray-700 { color: #374151 !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:bg-gray-100 { background: #f3f4f6 !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:border-gray-400 { border-color: #9ca3af !important; }
          .print\\:page-break-before { page-break-before: always !important; }
          .print\\:fill-black { fill: black !important; }
          .print\\:fill-gray-700 { fill: #374151 !important; }
          .print\\:fill-green-100 { fill: #dcfce7 !important; }
          .print\\:fill-purple-100 { fill: #f3e8ff !important; }
          .print\\:stroke-black { stroke: black !important; }
          .print\\:inline { display: inline !important; }
          
          /* Force white background on all containers */
          .bg-gray-900, .bg-gray-800, .bg-gray-700 {
            background: white !important;
          }
          
          /* Force black text */
          .text-white, .text-gray-300, .text-gray-400 {
            color: black !important;
          }
          
          /* SVG backgrounds */
          svg rect[fill="#1f2937"] {
            fill: white !important;
          }
        }
      `}</style>
    </div>
  );
}