export interface Source {
  id: string
  title: string
  org: string
  year: string
  finding: string
  url: string
}

/** Curated high-value references behind the concept (shown in Research section) */
export const SOURCES: Source[] = [
  {
    id: 'bani-hani',
    title: 'Feasibility of Highway Energy Harvesting Using a VAWT',
    org: 'Bani-Hani et al. — Energy Engineering',
    year: '2018',
    finding:
      'Roadside helical VAWT produced up to 48 W from traffic; average wake speed 4.4 m/s measured at 1.5 m height beside a highway.',
    url: 'https://www.tandfonline.com/doi/abs/10.1080/01998595.2018.11969276',
  },
  {
    id: 'mdpi-savonius',
    title: 'Darrieus vs Savonius Turbines for Passing-Vehicle Wind',
    org: 'Energies (MDPI)',
    year: '2024',
    finding:
      'Darrieus rotors failed to self-start below 6 m/s; helical Savonius reached Cp ≈ 0.20 at 5.8 m/s — best suited to turbulent, gusty vehicle airflow.',
    url: 'https://www.mdpi.com/1996-1073/17/7/1558',
  },
  {
    id: 'guide-vanes',
    title: 'Optimization of VAWT Systems to Capture Vehicle-Induced Highway Winds',
    org: 'Youngstown State University — Energies (MDPI)',
    year: '2025',
    finding:
      'CFD study: three guide vanes increased energy capture from passing-car wakes by ~242% versus an unguided rotor.',
    url: 'https://www.mdpi.com/1996-1073/18/12/3139',
  },
  {
    id: 'curtain',
    title: 'Improvement of a Savonius Rotor Performance with Curtaining',
    org: 'Altan & Atilgan — Applied Energy / Renewable Energy',
    year: '2008–2010',
    finding:
      'Simple curtain plates blocking the returning blade lifted the Savonius power coefficient from ~0.15 to ~0.38 in wind-tunnel tests.',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S0894177708000757',
  },
  {
    id: 'wake-field',
    title: 'Vehicle-Induced Turbulence — Field Measurements',
    org: 'Miller et al. — Boundary-Layer Meteorology / York University',
    year: '2019',
    finding:
      'On-highway measurements confirm a momentum wake trailing every vehicle; turbulence decays with distance following a power law; truck wakes spread ~5× wider than cars at 150 m.',
    url: 'https://yorkspace.library.yorku.ca/bitstreams/f838bd8c-4354-421a-879b-17c435c45d36/download',
  },
  {
    id: 'epa-wake',
    title: 'Scaled Wind Tunnel Modeling of Vehicle Wakes',
    org: 'US EPA — Fluid Modeling Facility',
    year: '2019',
    finding:
      'PIV wind-tunnel characterization of passenger-car and truck wakes underpins near-road dispersion models used worldwide.',
    url: 'https://cfpub.epa.gov/si/si_public_record_report.cfm?Lab=CEMM&dirEntryId=365596',
  },
  {
    id: 'cyprus',
    title: 'Harnessing Vehicle-Induced Wind for In-Road LED Markers',
    org: 'IOP Conference Series',
    year: '2025',
    finding:
      'Measured average highway-side wake speeds of 2.71–2.82 m/s were sufficient for one VAWT + storage to power 25 in-road LED markers over 500 m of road.',
    url: 'https://iopscience.iop.org/article/10.1088/1755-1315/1558/1/012028',
  },
  {
    id: 'alpha311',
    title: 'Alpha 311 Roadside Vertical Turbines',
    org: 'Alpha 311 Ltd (UK)',
    year: '2022',
    finding:
      'Commercial shaftless VAWT retrofitted onto lighting columns; world-first public-road trial on the A4444 in Telford; starts turning at ~1.8 m/s.',
    url: 'https://alpha-311.com/explore-the-turbine/how-it-works',
  },
  {
    id: 'ncdot',
    title: 'Wind Energy Generation Potential Along North Carolina Highways',
    org: 'NC State University / NCDOT',
    year: '2020',
    finding:
      'Month-long anemometer campaigns along freight corridors found considerable traffic-turbulence generation potential — though currently costlier than solar per kWh.',
    url: 'https://rosap.ntl.bts.gov/view/dot/54746',
  },
  {
    id: 'india-vawt',
    title: 'Low-Cost Savonius Behaviour on Indian Four-Lane Highways',
    org: 'Energy for Sustainable Development',
    year: '2017',
    finding:
      '$150 oil-drum Savonius cut-in at 3.5 m/s; median placement augmented rotational speed by ~64% versus roadside placement across monsoon seasons in Tamil Nadu.',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S0973082616311036',
  },
]

export const POSITIONING = [
  { k: 'CAPTURE', d: 'Omnidirectional drag rotor tuned for short, turbulent gusts' },
  { k: 'GUIDE', d: 'Passive flow guide shields returning blade, feeds advancing blade' },
  { k: 'MEASURE', d: 'ESP32 + INA219 + Hall sensing on the physical prototype' },
  { k: 'DEMONSTRATE', d: 'Miniature highway with repeatable vehicle passes' },
  { k: 'PREDICT', d: 'Transparent traffic→energy model exposed on this site' },
]
