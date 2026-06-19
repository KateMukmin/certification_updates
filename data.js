// Mock data — used as initial state by App
// All cert names alphabetized for the new flat dropdown
window.__APP_DATA__ = {
  worker: {
    name: 'Marcus Reed',
    role: 'Field Carpenter · Local 157',
    location: 'Brooklyn, NY',
    initials: 'MR',
  },

  // All certifications the user might add (master list, alphabetical for new flow)
  catalog: [
    { id: 'a49', name: 'A-49' },
    { id: 'aps', name: 'Accident Prevention Signs and Tags' },
    { id: 'afg', name: 'Acetylene Fuel Gas' },
    { id: 'addr', name: 'Address Verification' },
    { id: 'aerlift', name: 'Aerial Lift' },
    { id: 'aerlift_tr', name: 'Aerial Lift Training Certificate' },
    { id: 'aerlift_sa', name: 'Aerial Lift Training Certificate (Scissor/Articulating)' },
    { id: 'awp', name: 'Aerial Work Platform (AWP)' },
    { id: 'asb', name: 'Asbestos' },
    { id: 'asb16', name: 'Asbestos (16hr)' },
    { id: 'asbsup', name: 'Asbestos (Supervisor)' },
    { id: 'confspace', name: 'Confined Space Entry' },
    { id: 'cpr', name: 'CPR / First Aid' },
    { id: 'e21', name: 'E-21' },
    { id: 'fall', name: 'Fall Protection' },
    { id: 'fire', name: 'Fire Watch' },
    { id: 'flag', name: 'Flagger Certification' },
    { id: 'forklift', name: 'Forklift Operator' },
    { id: 'hazwoper', name: 'HAZWOPER 40hr' },
    { id: 'lead', name: 'Lead Abatement' },
    { id: 'osha10', name: 'OSHA 10' },
    { id: 'osha30', name: 'OSHA 30' },
    { id: 'rigger', name: 'Rigger / Signal Person' },
    { id: 'scaff', name: 'Scaffold User' },
    { id: 'silica', name: 'Silica Awareness' },
    { id: 'swms', name: 'Site-Specific Safety Plan (SSSP)' },
    { id: 'welding', name: 'Welding (Structural)' },
  ],

  // Projects the worker is currently assigned to.
  // Each project declares its certification requirements as groups.
  // A group can be "all" (every cert in list mandatory) or "any" (at least one required).
  // Each group lists which extra fields it requires beyond the universal Name+Issue Date.
  projects: [
    {
      id: 'kates',
      name: "Kate's Testing Project",
      shortName: 'Kate\u2019s Testing',
      color: '#00346B',
      groups: [
        {
          label: 'Asbestos',
          rule: 'all',
          certIds: ['asb16', 'asb', 'asbsup'],
          extraRequired: ['expiration'],
        },
        {
          label: 'L',
          rule: 'any',
          certIds: ['e21'],
          extraRequired: ['certId'],
        },
        {
          label: 'OSHA',
          rule: 'any',
          certIds: ['osha10', 'osha30'],
          extraRequired: [],
        },
      ],
    },
    {
      id: 'midtown',
      name: 'Midtown Tower — Phase 2',
      shortName: 'Midtown Tower',
      color: '#1BB161',
      groups: [
        {
          label: 'Asbestos',
          rule: 'all',
          certIds: ['asb16', 'asb', 'asbsup'],
          extraRequired: ['description', 'certId'],
        },
        {
          label: 'Heights',
          rule: 'any',
          certIds: ['fall', 'scaff', 'awp'],
          extraRequired: ['expiration'],
        },
        {
          label: 'OSHA',
          rule: 'any',
          certIds: ['osha30'],
          extraRequired: ['certId', 'media'],
        },
      ],
    },
    {
      id: 'hudson',
      name: 'Hudson Yards — Block C',
      shortName: 'Hudson Yards',
      color: '#F59A00',
      groups: [
        {
          label: 'Asbestos',
          rule: 'all',
          certIds: ['asb16', 'asb', 'asbsup'],
          extraRequired: ['expiration', 'media'],
        },
        {
          label: 'Confined Space',
          rule: 'all',
          certIds: ['confspace'],
          extraRequired: ['expiration', 'certId'],
        },
      ],
    },
  ],

  // Project that gets added in "simulate new project" demo
  newProject: {
    id: 'brooklyn',
    name: 'Brooklyn Bridge Maintenance',
    shortName: 'Brooklyn Bridge',
    color: '#DF252A',
    groups: [
      {
        label: 'Asbestos',
        rule: 'all',
        certIds: ['asb16', 'asb', 'asbsup'],
        extraRequired: ['expiration', 'description', 'certId'],
      },
      {
        label: 'Welding',
        rule: 'any',
        certIds: ['welding'],
        extraRequired: ['expiration'],
      },
    ],
  },

  // Worker's currently-saved certifications.
  // Each cert is now a SINGLE record (the change we're prototyping)
  certs: [
    {
      catalogId: 'osha30',
      certId: '30-77129-A',
      issueDate: '2024-04-12',
      expirationDate: '2029-04-12',
      description: '',
      media: { name: 'osha30-card.pdf', size: '412 KB' },
    },
    {
      catalogId: 'cpr',
      certId: '',
      issueDate: '2025-08-03',
      expirationDate: '2027-08-03',
      description: 'Renewed at Red Cross Brooklyn',
      media: null,
    },
    {
      catalogId: 'fall',
      certId: 'FP-2025-441',
      issueDate: '2025-02-18',
      expirationDate: '2027-02-18',
      description: '',
      media: { name: 'fall-protection.jpg', size: '1.2 MB' },
    },
  ],
};

// Field labels for the requirement chips
window.__FIELD_LABELS__ = {
  certId: 'Certification ID',
  expiration: 'Expiration Date',
  description: 'Description',
  media: 'Media upload',
};
