/**
 * Static sector mapping for known symbols.
 * Yahoo Finance sector names used for consistency.
 * Extend this map when adding new positions.
 */
export const KNOWN_SECTORS: Record<string, string> = {
  // Technology
  AMD:    'Technology',
  ADBE:   'Technology',
  FTNT:   'Technology',
  OKTA:   'Technology',
  DOCN:   'Technology',
  BBAI:   'Technology',
  FISV:   'Technology',
  IREN:   'Technology',
  MARA:   'Technology',
  MRVL:   'Technology',
  NVTS:   'Technology',
  TSM:    'Technology',
  HPQ:    'Technology',
  CIBR:   'Technology',   // ETF focused on cybersecurity

  // Consumer Cyclical
  AMZN:   'Consumer Cyclical',
  BABA:   'Consumer Cyclical',
  NKE:    'Consumer Cyclical',
  JD:     'Consumer Cyclical',
  UAA:    'Consumer Cyclical',
  'KER.PA': 'Consumer Cyclical',
  '2FE.DE': 'Consumer Cyclical',  // Ferrari

  // Consumer Defensive
  OTLY:   'Consumer Defensive',
  BYND:   'Consumer Defensive',
  'ADM.DE': 'Consumer Defensive',

  // Healthcare
  NVAX:   'Healthcare',
  UNH:    'Healthcare',
  HIMS:   'Healthcare',
  FIG:    'Healthcare',
  'BAYN.DE': 'Healthcare',
  'BION.SW': 'Healthcare',

  // Financial Services
  COIN:   'Financial Services',
  SOFI:   'Financial Services',
  'SREN.SW': 'Financial Services',

  // Energy
  OXY:    'Energy',
  XLE:    'Energy',        // ETF
  'ENI.DE': 'Energy',
  'DNQ.HM': 'Energy',   // Equinor

  // Basic Materials
  MOS:    'Basic Materials',
  MP:     'Basic Materials',
  GDXJ:   'Basic Materials', // Gold miners ETF
  'SIKA.SW': 'Basic Materials',
  'COPM.SW': 'Basic Materials',  // Copper miners ETF

  // Communication Services
  'UBI.PA': 'Communication Services',

  // Utilities
  SMR:    'Utilities',

  // Industrials
  ONDS:   'Industrials',
}
