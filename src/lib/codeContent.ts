/*
 * The New Homes Quality Code — Version 2 (March 2026) — split into searchable
 * sections.
 *
 * SOURCE OF TRUTH: this content is transcribed from the official NHQB Code of
 * Practice, Version 2 (March 2026), published at nhqb.org.uk. The "points"
 * under each section are faithful to the Code's wording; the "summary" is a
 * plain-English lead-in for search only. Section references (e.g. "3.4") match
 * the Code's own numbering so the developer can always cite the clause.
 *
 * Version 2 was published in March 2026. Under the Code, a customer is
 * protected from their developer's own "activation" date — the point each
 * registered developer goes live — so the exact cut-over can differ by
 * developer; V2 is the current published version.
 *
 * This is a navigation aid, not legal advice. Where it matters, the app links
 * the developer back to the exact clause number to read in full.
 */

export interface CodeSection {
  /** Code clause reference, e.g. "3.4", "P05", "G-snag". */
  ref: string
  /** Which part of the Code this sits in. */
  part: string
  title: string
  /** Plain-English one-liner (used for search + shown under the title). */
  summary: string
  /** Faithful key points from the Code. */
  points: string[]
  /** Extra plain-English search terms a developer might type. */
  keywords: string[]
}

export const CODE_VERSION = 'Version 2 (March 2026)'
export const CODE_SOURCE_URL =
  'https://www.nhqb.org.uk/wp-content/uploads/2026/02/New-Homes-Quality-Code-V2-March-2026.pdf'

const PART_PRINCIPLES = 'Statement of Principles'
const PART_1 = 'Part 1 · Selling a new home'
const PART_2 = 'Part 2 · Legal documents, information, inspection & completion'
const PART_3 = 'Part 3 · After-sales, complaints & the New Homes Ombudsman'
const PART_4 = 'Part 4 · Solvency, legal rights & jurisdiction'
const PART_GLOSSARY = 'Glossary'

export const CODE_SECTIONS: CodeSection[] = [
  // ---- The 10 Guiding Principles ----
  {
    ref: 'P',
    part: PART_PRINCIPLES,
    title: 'The 10 Guiding Principles',
    summary: 'The core principles every registered developer agrees to apply to their business and dealings with customers.',
    points: [
      '01 Fairness — treat customers fairly throughout the buying and after-sales process.',
      '02 Safety — carry out and complete work in line with all regulations, with certificates from an approved body.',
      '03 Quality — complete all work to a high standard; do not complete until the new home is complete (see section 2).',
      '04 Service — have systems, processes and staff training in place; no high-pressure selling.',
      '05 Responsiveness — have a reliable after-sales service and effective complaints procedure; clear, thorough, timely responses.',
      '06 Transparency — provide clear, accurate information about buying the home, including future costs like ground rent and service charges.',
      '07 Independence — customers should appoint independent legal advisers and may ask for an independent pre-completion inspection.',
      '08 Inclusivity — identify and support vulnerable customers; make the Code available in appropriate formats and languages.',
      '09 Security — have financial arrangements to meet obligations, including repaying deposits and any Ombudsman awards.',
      '10 Compliance — meet the requirements of the Code and the New Homes Ombudsman Service.',
    ],
    keywords: ['principles', 'fairness', 'safety', 'quality', 'service', 'responsiveness', 'transparency', 'independence', 'inclusivity', 'security', 'compliance', 'vulnerable', 'values'],
  },

  // ---- Part 1: Selling a new home ----
  {
    ref: '1.1',
    part: PART_1,
    title: 'Sales information and marketing',
    summary: 'All sales and marketing must be clear, fair, not misleading, and show you are a registered developer.',
    points: [
      'All sales and marketing material — including photography, CGI and video — must not be misleading; it must be clear, fair and in plain language and keep to all advertising Codes and laws.',
      'Developers must state in their sales and marketing literature that they are on the register of registered developers.',
      'The Code logo must be prominently displayed in public sales areas (sales office, selling agents’ offices), brochures and websites.',
      'The Code must be available free of charge to any interested customer, in appropriate formats and languages.',
      'The needs of vulnerable customers must be considered in all sales and marketing literature.',
    ],
    keywords: ['marketing', 'advertising', 'cgi', 'brochure', 'website', 'misleading', 'logo', 'sales material', 'plain language'],
  },
  {
    ref: '1.2',
    part: PART_1,
    title: 'Describing the new home',
    summary: 'Minimum information you must give about the property, e.g. size, tenure, price, energy rating, completion date, warranty.',
    points: [
      'Must not mislead; must meet Material Information obligations under the Digital Markets, Competition & Consumers Act 2024 for property listings.',
      'As a minimum, information must include: size (room and total, per the RICS Code of Measuring Practice for gross internal area); tenure (including lease length); specification (including items not in standard spec such as floorcoverings, turf); indicative energy performance ratings; price; mobility adaptations; estimated legal completion dates; the warranty that applies; management services; service charges; future phases (with timescales where known); any agreements/restrictions affecting future sale; costs and cover of additional products such as insurances/warranties; expected Council Tax band (Rates in Northern Ireland).',
    ],
    keywords: ['describe', 'size', 'tenure', 'price', 'energy', 'epc', 'council tax', 'specification', 'material information', 'completion date', 'floor area', 'measurements'],
  },
  {
    ref: '1.3',
    part: PART_1,
    title: 'No high-pressure selling techniques',
    summary: 'You must not pressure customers into reserving or buying.',
    points: [
      'Must not suggest others are interested or that the price will soon rise if untrue.',
      'Must not offer a financial incentive for an immediate decision. For time-bound events (e.g. launch weekends), attendees must be given seven days to consider the purchase, during which the incentive (not a specific home) is held open.',
      'Must not claim the customer will lose the chance to personalise the home when the build stage still allows it.',
      'Must not push unnecessary insurance/warranty products, or suggest a sale depends on using a specific third-party adviser.',
      'No “drip pricing” of elements customers would reasonably expect to be included.',
    ],
    keywords: ['pressure', 'high pressure', 'incentive', 'launch weekend', 'seven days', 'drip pricing', 'tactics', 'sales'],
  },
  {
    ref: '1.4',
    part: PART_1,
    title: 'Part-exchange and assisted-move schemes',
    summary: 'Terms of part-exchange / assisted-move must be clear, fair and not used to pressurise.',
    points: [
      'Terms must be clear, fair, not misleading, in plain language, with enough time for the customer to consider.',
      'Must include: full terms and conditions (including the price offered and how long it is valid); how a fair, independent market valuation from more than one qualified source was decided; any deductions; how to qualify; the date to accept by; what happens if not accepted in time; expected completion dates for the part-exchange and the new home purchase and what happens if they do not occur on the same date.',
    ],
    keywords: ['part exchange', 'part-exchange', 'assisted move', 'valuation', 'px'],
  },
  {
    ref: '1.5',
    part: PART_1,
    title: 'Considering vulnerable customers',
    summary: 'Consider whether a customer is vulnerable and give appropriate extra support.',
    points: [
      'Consider whether a customer is vulnerable and take appropriate steps to help them make informed decisions.',
      'Take all reasonable steps to provide suitable advice and help; do not assume the degree of knowledge a customer has.',
      'Because buying a home is rare for most people, treat all customers as situationally vulnerable and offer extra support if needed.',
    ],
    keywords: ['vulnerable', 'support', 'situational', 'disability', 'help'],
  },
  {
    ref: '1.6',
    part: PART_1,
    title: 'Customer service standards and training',
    summary: 'Have the systems, permissions and staff training to meet the Code — and respond to NHQB audits within 30 days.',
    points: [
      'Have all systems, procedures and permissions (including permission to share customers’ information) needed to meet the Code.',
      'The NHQB compliance team may audit and ask for information about how you keep to the Code — you must provide it within 30 days.',
      'All employees who deal with customers must complete NHQB online training; agents must also be familiar with and meet the Code.',
    ],
    keywords: ['training', 'audit', '30 days', 'staff', 'compliance team', 'systems', 'permissions'],
  },
  {
    ref: '1.7',
    part: PART_1,
    title: 'Legal advisers, commission and incentives',
    summary: 'Customers must be free to choose their own advisers; disclose any fee or commission in writing beforehand.',
    points: [
      'Make customers aware they should get independent legal advice.',
      'You may recommend advisers but must make clear the customer is free to choose their own; you cannot offer incentives for recommending a professional adviser.',
      'For online links to a specific adviser, clearly identify the third party and ask the customer to confirm before they follow the link.',
      'Any fee, commission, reward or advantage for introducing an adviser or recommending products/services must be disclosed in writing — nature, expected amount, who receives it and for what — before the customer makes any commitment.',
    ],
    keywords: ['legal adviser', 'solicitor', 'commission', 'referral', 'conveyancer', 'mortgage', 'incentive', 'disclose'],
  },

  // ---- Part 2: Legal documents, information, inspection & completion ----
  {
    ref: '2.1',
    part: PART_2,
    title: 'Early bird arrangements',
    summary: 'Optional early notice of a plot before general sale — fee capped at £150 with refund rules.',
    points: [
      'You may charge a fee but must not charge more than £150 (or any future maximum the NHQB sets).',
      'Before the customer pays, make clear how long they have to accept the offer and how long they have to change their mind and still get a full refund.',
      'Refund in full if the customer says, within 24 hours of being told the plot is released (or a longer period you set), that they do not want to proceed. After that you may deduct administration costs if you explained this when they paid.',
      'If there is any difference between customers’ rights and expectations on early bird arrangements and this Code, this Code takes priority.',
    ],
    keywords: ['early bird', 'plot option', '£150', '150', 'reserve early', 'refund', '24 hours'],
  },
  {
    ref: '2.2',
    part: PART_2,
    title: 'Reservation Agreements',
    summary: 'The formal agreement to reserve a home — what must be provided and included, plus the Affordability Schedule.',
    points: [
      'A customer reserving a home must enter a formal Reservation Agreement; it must not be entered until all required information has been provided.',
      'Terms must be clear, fair, in plain language; both parties sign (digitally or in person) and the developer gives the customer a copy.',
      'Terms must include (among others): who they are buying from; the reservation fee amount; the right to cancel within the reservation period; refund terms and any admin fees; a 14-day cooling-off period; how to cancel; that the sale is “subject to contract” (England, Wales & NI); details of the home; the purchase price; how long price/agreement are valid; warranty provider contact details and a summary of cover; the date by which exchange must take place (reasonable, and not less than six weeks after reservation — 28 days plus the 14-day cooling-off — unless the customer asks for earlier; if exchange and completion happen within the cooling-off period it must only be with the customer’s express consent); tenure and associated costs; management/factoring costs; the process for requesting changes.',
      'An Affordability Schedule must be provided covering likely costs over the five years after sale: ground rent (amount, dates, formula); estimated additional costs (management fees, event fees, future/rising service charges, sinking funds); costs for regular maintenance of built-in equipment (shared heating, grey-water systems, air-source heat pumps); estimated costs to maintain the property and repair/replace fixtures or appliances in the first five years.',
    ],
    keywords: ['reservation agreement', 'reservation fee', 'affordability schedule', 'subject to contract', 'six weeks', 'ground rent', 'service charge', 'sinking fund'],
  },
  {
    ref: '2.3',
    part: PART_2,
    title: 'Cooling-off period',
    summary: 'Every Reservation Agreement must include at least a 14-day cooling-off period with a full refund.',
    points: [
      'All Reservation Agreements must include a cooling-off period of at least 14 days.',
      'If the customer cancels for any reason during the cooling-off period, the developer must refund the full reservation fee.',
    ],
    keywords: ['cooling off', 'cooling-off', '14 days', 'cancel', 'refund', 'change my mind'],
  },
  {
    ref: '2.4',
    part: PART_2,
    title: 'Cancelling after the cooling-off period',
    summary: 'After cooling-off, refund the fee less any agreed deductions within 14 days.',
    points: [
      'The Reservation Agreement may set out deductions taken from the refund if the customer cancels after the cooling-off period.',
      'Refund the reservation fee, less any agreed deductions, within 14 days of the customer’s notice of cancellation (subject to anti-money-laundering rules).',
    ],
    keywords: ['cancel', 'refund', '14 days', 'deductions', 'after cooling off'],
  },
  {
    ref: '2.5',
    part: PART_2,
    title: 'No developer right to cancel the reservation',
    summary: 'While the reservation is valid you cannot cancel it or re-reserve the same home to someone else.',
    points: [
      'While the Reservation Agreement is valid, the developer cannot cancel it and must not enter a new reservation or sale agreement with another customer for the same home.',
      'At the end of the reservation period, give the warranty provider full details of the buyer and reserved home if required (subject to data protection).',
    ],
    keywords: ['cannot cancel', 'developer cancel', 'reserve to someone else', 'gazumping'],
  },
  {
    ref: '2.6',
    part: PART_2,
    title: 'Pre-contract of sale information',
    summary: 'Information you must give the customer’s legal adviser before the contract of sale.',
    points: [
      'Property/planning info must include: a written Reservation Agreement; warranty cover summary and provider contact; tenure; planning consent reference and future phases/facilities where known; a list of included contents (e.g. cooker, fridge, carpets); confirmation the spec will be as advertised, including structural frame materials; the standards the home is built to (building regs, warranty standards, manufacturer standards); any exceptional restrictions; details of services/responsibilities that may not immediately transfer at completion.',
      'Cost info must include: description of management services and providers; an indicative costs schedule over five years (ground rent; additional costs such as management/event fees, rising service charges, sinking funds; regular maintenance of built-in equipment). Everyday running costs (utilities, energy, home insurance) do not have to be told to the customer.',
      'If the home is not yet complete, also give: the expected completion date; and a brochure/plan showing size, specification, layout, plot position and facing direction, including steep slopes, boundary finishes, and outbuildings/garages.',
      'Tell the customer in writing who to contact with questions before ownership transfers, and how questions will be answered.',
    ],
    keywords: ['pre-contract', 'legal adviser', 'planning', 'indicative costs', 'contents', 'specification', 'restrictions', 'management services'],
  },
  {
    ref: '2.7',
    part: PART_2,
    title: 'Contract of sale',
    summary: 'The contract of sale terms — including the two-year builders’ liability period and deposit protection.',
    points: [
      'Terms must be clear, fair, plain language, and keep to all legislation.',
      'The contract must: define the completion notice period; set out when the customer can cancel (e.g. an unagreed change affecting size/value/appearance, or excessive/unreasonable delay); explain what happens if the home is not ready by the stated date; explain how deposits are protected; provide a two-year builders’ liability period (also applying to special purpose vehicles).',
      'Immediately before exchange, the customer (via their legal representative) must state in writing any spoken statements they are relying on.',
    ],
    keywords: ['contract of sale', 'builders liability', 'two year', 'deposit protection', 'completion notice', 'exchange', 'missives'],
  },
  {
    ref: '2.8',
    part: PART_2,
    title: 'Pre-completion inspection',
    summary: 'The customer must be offered a pre-completion inspection; breaches of warranty standards fixed ideally before completion or within 30 days.',
    points: [
      'Give the customer the opportunity to carry out a pre-completion inspection, or appoint a suitably qualified inspector, before the completion date and after notice to complete is served.',
      'A standard NHQB Pre-Completion Inspection Checklist must be used (walls inspected in natural daylight from at least two metres, not shining a light on the surface). Tell self-inspecting customers it was designed for professionals.',
      'If issues breach warranty technical standards, the developer is responsible for addressing them, ideally before legal completion or within 30 days if not possible.',
      'A third-party inspector must: be a member of a recognised professional association (e.g. CABE, CIOB, ICWCI, RICS, RPSA); hold professional indemnity insurance; work only within their competency; use only the standard checklist.',
      'The completion notice period is usually expected to be at least 14 calendar days. The checklist is not intended to delay completion; respond to results in line with Part 3.',
      'Sites must meet health and safety legislation; tell customers the precautions to take on a construction site, and you may refuse access if they do not.',
    ],
    keywords: ['pre-completion inspection', 'pci', 'inspection', 'checklist', 'snagging', '30 days', 'inspector', 'rics', 'two metres'],
  },
  {
    ref: '2.9',
    part: PART_2,
    title: 'Major changes and the right to cancel',
    summary: 'Tell customers in writing about major changes; they can cancel within 14 days for a full refund.',
    points: [
      'Tell the customer about their right to cancel and when it applies for a major change; tell them in writing if there is a major change after they enter the Reservation Agreement.',
      'A major change is any change the developer is responsible for that significantly and substantially affects the size, appearance or value of the home (including internal layout) from what the customer was shown.',
      'Recommend the customer takes legal advice. If they find the major change unacceptable, they can cancel and get a full refund of contract deposit, reservation fee and other payments, provided they cancel within 14 days of receiving written details. Notice to complete cannot be served during this 14-day period.',
      'Keep the customer informed of non-major changes; they cannot cancel for these and do not have to formally agree, but retain the right to complain about snags.',
    ],
    keywords: ['major change', 'right to cancel', 'layout', 'design change', '14 days', 'refund'],
  },
  {
    ref: '2.10',
    part: PART_2,
    title: 'Complete new home',
    summary: 'Legal completion can only take place on a complete new home meeting building regs and safety requirements.',
    points: [
      'Completion (and occupation) can only take place on a complete new home; do not offer incentives to move into or complete on a home that is not complete.',
      'A complete new home has evidence a new home warranty is in place and meets the further conditions.',
      'Houses: all rooms, spaces and facilities finished for their purpose, with safe entrance and emergency exit routes; any remaining work is only decorative/fault-correction, relates to shared areas, or moving temporary to permanent utilities — and does not affect living safely or cause significant disruption.',
      'Apartments/flats: same test applied to the specific flat and building.',
      'Scotland only: a new home is complete if the local authority (building control) has confirmed it is ready to be lived in.',
    ],
    keywords: ['complete new home', 'completion', 'habitable', 'finished', 'occupation', 'safe', 'warranty in place'],
  },
  {
    ref: '2.11',
    part: PART_2,
    title: 'Completion — what must be done and handed over',
    summary: 'The handover checklist at completion: schedule of incomplete work, home demo, warranty docs, complaints procedure, H&S file, building reg certificate.',
    points: [
      'Completed construction to the standards agreed.',
      'Carried out a developer’s final quality assurance inspection and given the customer a Schedule of Incomplete Work (Home) plus a statement of timescales for completing work / putting right defects and the need for access.',
      'Confirmed the local authority has passed the home as habitable (Scotland only).',
      'Given the customer the opportunity to inspect or appoint a pre-completion inspector.',
      'Provided an appointment for a home demonstration, including how to use appliances.',
      'Provided full details of guarantees and warranties for the home and appliances.',
      'Provided (or arranged the warranty provider to provide) confirmation of cover / cover note / policy documentation, with details of any exceptions, exclusions, limits, excesses or conditions.',
      'Given the customer a copy of the complaints procedure.',
      'Provided a health and safety file (for apartments, to the managing agent/management company).',
      'Given building regulation control inspection records on request (England/Wales/NI) or confirmation the local authority passed it (Scotland).',
      'Provided the building regulation completion certificate if available; if not, told the customer when it will be available or signposted where to get it.',
    ],
    keywords: ['completion checklist', 'handover', 'schedule of incomplete work', 'home demonstration', 'warranty documents', 'complaints procedure copy', 'health and safety file', 'building regulation certificate', 'documents', 'what to give customer'],
  },
  {
    ref: '2.12',
    part: PART_2,
    title: 'Incomplete and additional work',
    summary: 'At completion, give a Schedule of Incomplete Work (Development) and keep the customer informed of future phases.',
    points: [
      'Give the customer a Schedule of Incomplete Work (Development) with the best available information on future phases and estimated timescales where known.',
      'Tell the customer of committed future phases; take reasonable steps to reduce significant negative effects during construction.',
      'Keep the customer informed of utility boxes or estate infrastructure (lamp posts, bins, bike shelters) installed after completion that could significantly affect the home.',
    ],
    keywords: ['incomplete work', 'development', 'future phases', 'infrastructure', 'estate'],
  },
  {
    ref: '2.13',
    part: PART_2,
    title: 'Repaying deposits and fees',
    summary: 'Protect deposits and fees; refund within 28 days if the contract is cancelled.',
    points: [
      'Have adequate arrangements to protect deposits, reservation fees and other fees — e.g. insuring the full contract deposit through the warranty, holding money in a suitable separate client account not usable until completion, or another legal arrangement covering the deposit/uninsured amounts.',
      'If the customer paid extra for adaptations/upgrades then cancels, refund the payments less costs already incurred.',
      'If the developer changes or cancels the contract, give the customer accurate information to assess any compensation.',
      'Refund the contract deposit and pay any other amounts due within 28 days of the contract being cancelled.',
    ],
    keywords: ['deposit', 'refund', '28 days', 'client account', 'protect money', 'fees'],
  },

  // ---- Part 3: After-sales, complaints & the Ombudsman ----
  {
    ref: '3.1',
    part: PART_3,
    title: 'After-sales service (2-year statement)',
    summary: 'You must provide an after-sales service for at least two years, with a written statement covering procedures, timescales, contacts, emergencies and normal maintenance.',
    points: [
      'Provide a full, accessible after-sales service for at least two years following completion.',
      'The written statement must include: a clear written statement of after-sales procedures; an explanation of the developer’s responsibility for putting right issues (including snags and defects) in the first two years; how issues and service calls are managed, including timescales, how to report problems and the names/contacts of who to report to; how to make a formal complaint if unhappy; the process for reporting and dealing with emergency issues, including what qualifies as an emergency (matters relating to health and safety that could seriously affect health/well-being or cause injury or loss of life); and clear guidance on what counts as normal maintenance the customer is responsible for.',
      'If building work continues on the development, tell the customer the health and safety precautions and protective measures in place.',
    ],
    keywords: ['after-sales', 'aftersales', 'two years', '2 years', 'written statement', 'emergency', 'normal maintenance', 'contacts', 'timescales', 'what to include'],
  },
  {
    ref: '3.2',
    part: PART_3,
    title: 'After-sales issues and complaints',
    summary: 'Have a system for receiving and dealing with after-sales issues, plus the formal complaint route, in writing.',
    points: [
      'Have a system and procedures for receiving and dealing with issues raised about the after-sales service, in addition to the right to a formal complaint under the Code.',
      'Give the customer a written statement of the process for raising an after-sales issue and for making a formal complaint (letter, brochure, leaflet, email or clearly on the website).',
      'Include how to refer the complaint or dispute to the New Homes Ombudsman Service if agreement cannot be reached.',
      'Customers have two years from reservation or completion (whichever is later) to make a complaint and refer it to the Ombudsman.',
      'Co-operate with any appropriately qualified adviser or authorised representative the customer appoints, subject to data-protection, confidentiality and health and safety processes.',
      'If work requires the customer to move to alternative accommodation, this must be at the developer’s expense and take account of the customer’s needs and duration.',
    ],
    keywords: ['after-sales complaint', 'system', 'written statement', 'ombudsman referral', 'representative', 'alternative accommodation', 'two years'],
  },
  {
    ref: '3.3',
    part: PART_3,
    title: 'Snags — the 30-day rule',
    summary: 'Snags must be dealt with as soon as possible and settled within 30 days unless there is a significant reason for delay.',
    points: [
      'Snags are finishing or other issues commonly needing putting right after moving in; work with customers to identify and put them right.',
      'Snags must be covered by the after-sales service and dealt with as soon as possible; acknowledge them as soon as possible.',
      'In most situations the developer must be able to settle an after-sales issue or problem within 30 days, unless there is a significant reason for delay.',
      'If there is a delay, explain the reasons clearly and give updates at least once a month until settled.',
      'If the customer is not satisfied with the after-sales service, they can make a formal complaint.',
      'Emergency issues are not snags; if a customer is not satisfied with how an emergency is dealt with, they can make a formal complaint from the date of completion.',
    ],
    keywords: ['snag', '30 days', 'thirty days', 'put right', 'fix', 'defect', 'monthly update', 'deadline', 'how long'],
  },
  {
    ref: '3.4',
    part: PART_3,
    title: 'Complaints procedure (5 / 10 / 30 / 56 days)',
    summary: 'The formal complaint timetable and the exact content required in each letter.',
    points: [
      'The customer can make a formal complaint if unhappy with the outcome of an issue raised under Part 1, Part 2 or Part 3.',
      'Written acknowledgement: no later than 5 days from the first business day after receiving the complaint (the “complaint start date”).',
      'Path to Resolution Letter: no later than 10 days from the complaint start date — outlines how the complaint will be investigated and whether it can be referred to the warranty provider’s dispute resolution service.',
      'Complaint Assessment and Response Letter: no later than 30 days from the complaint start date. Must include: (i) a separate report on each complaint; (ii) if settled, what action was taken; (iii) if not settled and more time is needed, an estimate of how long and what further steps and why; (iv) if correction work is accepted, details and an estimated completion date; (v) if further investigation/works are needed, when an update will be given (within 28 days); (vi) if a complaint is not accepted, a clear explanation of the reasons; (vii) information about any warranty provider dispute resolution service; (viii) how to refer the complaint to the New Homes Ombudsman Service.',
      'Eight-Week (56-day) Letter: if not closed, no later than 56 days from the complaint start date. Must include: (i) a clear summary of action taken to date; (ii) what is still outstanding, why, and the actions to be taken; (iii) an idea of when it will be settled; (iv) how often updates will be given (at least every 28 days).',
      'Closure Letter: can be sent at any stage after the complaint start date. Must include: (i) a list of the items agreed in the Assessment and Response Letter and confirmation each is resolved; (ii) how to refer matters to the New Homes Ombudsman Service if not satisfied.',
      'Multiple complaints can be combined into one, but the timetable applies from the date the first complaint was received.',
    ],
    keywords: ['complaint', 'complaints procedure', 'complaint deadlines', 'deadline', 'deadlines', 'timescale', 'acknowledgement', 'path to resolution', 'assessment and response', 'eight week', '8 week', '56 days', '5 days', '10 days', '30 days', '28 days', 'complaint start date', 'closure letter', 'letters', 'timetable'],
  },
  {
    ref: '3.5',
    part: PART_3,
    title: 'Referrals to the New Homes Ombudsman Service',
    summary: 'A complaint can be referred to the Ombudsman after 56 days of the complaint start date, if it arose within two years of completion.',
    points: [
      'If defects or snags are not dealt with in line with the complaints procedure, the customer can refer the dispute to the New Homes Ombudsman Service.',
      'A complaint that arose within the first two years after completion can be referred to the Ombudsman after 56 days of the complaint start date — whether or not the referral date is within the two years.',
      'Customers should refer as soon as possible; the Ombudsman follows its scheme rules in deciding whether to look into a complaint.',
      'Co-operate with any Ombudsman request to provide all relevant information about a complaint.',
    ],
    keywords: ['ombudsman', 'nhos', 'refer', 'referral', '56 days', 'two years', 'dispute'],
  },
  {
    ref: '3.6',
    part: PART_3,
    title: 'Resale',
    summary: 'If the customer sells within two years, after-sales only covers matters reported within two years of the original completion.',
    points: [
      'If the customer sells the home, the developer’s after-sales service applies only to matters reported within two years of the completion date of the original purchase.',
      'Future owners should get legal advice about this.',
    ],
    keywords: ['resale', 'sell', 'new owner', 'two years', 'transfer'],
  },

  // ---- Part 4 ----
  {
    ref: '4',
    part: PART_4,
    title: 'Solvency, legal rights & jurisdiction',
    summary: 'Have finances/insurance to meet Code obligations; the Code does not remove the customer’s other legal rights.',
    points: [
      'The developer (and seller, if different) must have the finances or insurance to provide reasonable protection against insolvency and meet Code obligations, including repaying deposits and any Ombudsman awards.',
      'Nothing in the Code affects the customer’s other legal rights or replaces applicable legislation. Customers need not complain to the Ombudsman and may take other action, such as the civil courts or another ombudsman/regulator.',
    ],
    keywords: ['solvency', 'insolvency', 'legal rights', 'jurisdiction', 'courts', 'finances', 'insurance'],
  },

  // ---- Glossary (key definitions developers ask about) ----
  {
    ref: 'G-snag',
    part: PART_GLOSSARY,
    title: 'Definition: Snag',
    summary: 'A minor imperfection or fault that does not meet the expected quality or finish.',
    points: [
      'A minor imperfection or fault in the new home which does not meet the expected quality or finish set out in the contract of sale — usually something damaged, broken, not fitted properly, or looking unfinished.',
      'Snags may be identified during a pre-completion inspection or after completion. A reported snag is not automatically a complaint.',
      'However, if a developer does not put a snag right within 30 days of the date it was reported, the customer can ask for it to be dealt with under the formal complaint process.',
    ],
    keywords: ['snag definition', 'what is a snag', 'imperfection', '30 days'],
  },
  {
    ref: 'G-defect',
    part: PART_GLOSSARY,
    title: 'Definition: Defect / defective or faulty items',
    summary: 'Incomplete work, or faults in completed work, not meeting expected quality or finish.',
    points: [
      'Incomplete work, or faults in completed work, that does not meet the expected quality or finish set out in the contract of sale — including the warranty provider’s standards or the manufacturer’s standards for that part of the building or home.',
    ],
    keywords: ['defect definition', 'what is a defect', 'faulty', 'fault'],
  },
  {
    ref: 'G-emergency',
    part: PART_GLOSSARY,
    title: 'Definition: Emergency issue',
    summary: 'An issue that poses an immediate threat to safety, security, health or well-being.',
    points: [
      'An issue that poses an immediate threat to safety, security, health or well-being.',
      'Emergency issues are not snags (see 3.3). If a customer is not satisfied with how an emergency is dealt with, they can make a formal complaint from the date of completion.',
    ],
    keywords: ['emergency definition', 'what is an emergency', 'urgent', 'health and safety', 'safety', 'well-being'],
  },
  {
    ref: 'G-complaint',
    part: PART_GLOSSARY,
    title: 'Definition: Complaint',
    summary: 'Any expression of dissatisfaction, justified or not, about a developer’s service or Code compliance.',
    points: [
      'Any spoken or written expression of dissatisfaction, whether justified or not, made by or on behalf of a customer about a service or product a developer has provided or failed to provide, or about a developer not keeping to the Code.',
    ],
    keywords: ['complaint definition', 'what is a complaint', 'dissatisfaction'],
  },
  {
    ref: 'G-complete',
    part: PART_GLOSSARY,
    title: 'Definition: Complete new home',
    summary: 'When a home counts as complete for legal completion (see 2.10).',
    points: [
      'Legal completion can only take place on a complete new home (see section 2.10 for the full test for houses, flats and Scotland).',
    ],
    keywords: ['complete new home definition', 'habitable', 'finished'],
  },
  {
    ref: 'G-vulnerable',
    part: PART_GLOSSARY,
    title: 'Definition: Vulnerable customer',
    summary: 'A customer significantly less able to protect their interests or more likely to suffer disadvantage.',
    points: [
      'A customer who is significantly less able than a typical customer to protect or represent their interests, or significantly more likely to suffer disadvantage during the buying process. Vulnerability can be temporary or permanent and can come and go.',
      'Developers must be flexible and tailor their response when necessary.',
    ],
    keywords: ['vulnerable definition', 'vulnerability'],
  },
  {
    ref: 'G-scope',
    part: PART_GLOSSARY,
    title: 'What the Code does NOT cover',
    summary: 'Areas outside the Code, e.g. commercial buyers, structural warranty claims, blight, personal injury.',
    points: [
      'The Code does not cover: homes bought by a commercial entity (company, trust, charity); claims that could be dealt with through the structural warranty; claims for blight; claims related to tenure/occupancy of other properties; loss of value due to market conditions or factors outside the developer’s control; personal injury; and claims not covered by the New Homes Ombudsman Service scheme rules.',
      '‘Customer’ means a person buying, or intending to buy, a home as a named individual (joint buyers are all ‘the customer’).',
    ],
    keywords: ['scope', 'not covered', 'exclusions', 'commercial', 'structural warranty', 'blight', 'personal injury', 'out of scope'],
  },
]

/**
 * A handful of very common plain-English questions mapped straight to the
 * clause that answers them — so the top of the search always feels like it
 * "knows" what the developer means.
 */
export const QUICK_ANSWERS: { q: string; ref: string; a: string }[] = [
  { q: 'How long do I have to fix a snag?', ref: '3.3', a: 'As soon as possible, and within 30 days unless there is a significant reason for delay. If delayed, update the customer at least monthly.' },
  { q: 'What are the complaint deadlines?', ref: '3.4', a: 'Acknowledge within 5 days, Path to Resolution by day 10, Assessment & Response by day 30, Eight-Week letter by day 56 — all from the complaint start date (first business day after receipt).' },
  { q: 'What must I hand over at completion?', ref: '2.11', a: 'Schedule of Incomplete Work, pre-completion inspection offer, home demonstration, warranty documents, complaints procedure copy, health & safety file, and building regulation completion certificate (or note why not yet available).' },
  { q: 'When can the customer go to the Ombudsman?', ref: '3.5', a: 'After 56 days of the complaint start date, for a complaint that arose within two years of completion.' },
  { q: 'What counts as an emergency?', ref: 'G-emergency', a: 'An issue that poses an immediate threat to safety, security, health or well-being. Emergencies are not snags.' },
  { q: 'How much can I charge for early bird / plot reservation?', ref: '2.1', a: 'No more than £150, with clear refund terms (full refund if the customer withdraws within 24 hours of the plot being released, or a longer period you set).' },
  { q: 'How long is the cooling-off period?', ref: '2.3', a: 'At least 14 days, with a full refund of the reservation fee if the customer cancels for any reason during it.' },
  { q: 'When must I refund a deposit?', ref: '2.13', a: 'Within 28 days of the contract being cancelled.' },
]
