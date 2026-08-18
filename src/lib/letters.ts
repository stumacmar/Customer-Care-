/*
 * Auto-generated complaint letters (New Homes Quality Code, Part 3).
 *
 * Required content verified against the NHQB's published Code (nhqb.org.uk,
 * Part 3: after-sales, complaints and the New Homes Ombudsman):
 *  - Acknowledgement: within 5 days of the complaint start date (the first
 *    business day after the complaint is received).
 *  - Path to Resolution (day 10): how the complaint will be investigated, and
 *    whether it can be referred to the warranty provider's dispute resolution
 *    service.
 *  - Complaint Assessment & Response (day 30): a separate report on each
 *    complaint item; actions taken if settled; timescale if further
 *    investigation or works are needed with estimated completion dates;
 *    updates at least every 28 days; reasons if rejected; dispute resolution
 *    route and Ombudsman referral information.
 *  - Eight-Week Letter (day 56): summary of action taken; what is outstanding
 *    with reasons; expected timescale; updates at least every 28 days; the
 *    customer's right to refer to the New Homes Ombudsman Service.
 *  - Closure: the items resolved (as reported in the Assessment & Response
 *    letter) and how to refer to the Ombudsman if still dissatisfied.
 *
 * Every generator pre-fills names, addresses, references and the correct
 * deadline dates. Output is an editable draft — never a black-box auto-send.
 */

import { addDays, formatDate, todayISO } from './dates'
import { majorChangeCancelBy, SNAG_PUT_RIGHT_DAYS } from './code'
import type { ChangeRecord, Issue, MilestoneKey, Plot } from '../types'

/** New Homes Ombudsman Service contact details (nhos.org.uk). */
export const NHOS_CONTACT =
  'New Homes Ombudsman Service — www.nhos.org.uk · 0330 808 4286 · customer.services@nhos.org.uk'

export interface LetterContext {
  developerName: string
  plot: Plot
  issue: Issue
  today: string
}

export interface LetterDraft {
  milestoneKey: MilestoneKey
  title: string
  /** Subject line used when emailing the letter. */
  subject: string
  body: string
}

function header(ctx: LetterContext): string {
  const ref = ctx.issue.reference || ctx.issue.id
  return [
    ctx.developerName || '[Your company name]',
    '',
    `Date: ${formatDate(ctx.today)}`,
    `Our reference: ${ref}`,
    '',
    'To:',
    ctx.plot.customerNames || '[Customer name(s)]',
    ctx.plot.address || '[Property address]',
    '',
  ].join('\n')
}

function signOff(ctx: LetterContext): string {
  return [
    '',
    'Yours sincerely,',
    '',
    '[Name]',
    ctx.developerName || '[Your company name]',
    '[Contact telephone] · [Contact email]',
  ].join('\n')
}

function ombudsmanBlock(): string {
  return [
    'Referring your complaint to the New Homes Ombudsman:',
    '   If your complaint is not resolved through our complaints process — or once it',
    '   has been open for 56 days — you may refer it to the New Homes Ombudsman',
    '   Service, which is free and independent.',
    `   ${NHOS_CONTACT}`,
  ].join('\n')
}

/** Day 5 — written acknowledgement. */
function acknowledgement(ctx: LetterContext): LetterDraft {
  const ref = ctx.issue.reference || ctx.issue.id
  const body = [
    header(ctx),
    `Dear ${ctx.plot.customerNames || '[Customer name]'},`,
    '',
    `Re: Acknowledgement of your complaint (${ref})`,
    '',
    `Thank you for contacting us about your home at ${ctx.plot.address || '[address]'}. ` +
      'This letter confirms that we have received and recorded your complaint.',
    '',
    'The details we have recorded are:',
    `  • Complaint received: ${formatDate(ctx.issue.receivedAt || ctx.issue.startedAt)}`,
    `  • Complaint start date (first business day after receipt): ${formatDate(ctx.issue.startedAt)}`,
    `  • Summary: ${ctx.issue.description || '[summary of the complaint]'}`,
    '',
    'What happens next:',
    `  • By ${formatDate(addDays(ctx.issue.startedAt, 10))} we will send you our written ` +
      "'path to resolution', setting out how we will investigate your complaint.",
    `  • By ${formatDate(addDays(ctx.issue.startedAt, 30))} we will send you our full ` +
      'Complaint Assessment and Response letter.',
    '',
    'Your point of contact for this complaint is [name], who can be reached on ' +
      '[telephone] or [email].',
    '',
    'A copy of our complaints procedure was provided with your home information and is ' +
      'available on request.',
    signOff(ctx),
  ].join('\n')
  return {
    milestoneKey: 'acknowledgement',
    title: 'Acknowledgement letter (Day 5)',
    subject: `Acknowledgement of your complaint (${ref}) — ${ctx.plot.address}`,
    body,
  }
}

/** Day 10 — Path to Resolution. */
function pathToResolution(ctx: LetterContext): LetterDraft {
  const ref = ctx.issue.reference || ctx.issue.id
  const body = [
    header(ctx),
    `Dear ${ctx.plot.customerNames || '[Customer name]'},`,
    '',
    `Re: Path to Resolution for your complaint (${ref})`,
    '',
    'Further to our acknowledgement, this letter sets out how we will investigate and ' +
      'work to resolve your complaint.',
    '',
    'How we will investigate:',
    '  • What we will do: [describe the investigation / inspection / works planned]',
    '  • Who is responsible: [name and role]',
    '  • Steps and timescales: [e.g. inspection by DD/MM, works by DD/MM]',
    '',
    'Your home warranty:',
    '   [State whether this complaint can be referred to your warranty provider and its ' +
      "dispute resolution service — e.g. \"This issue falls under your structural warranty " +
      'with [provider], whose dispute resolution service is available to you at [contact]\" ' +
      'or "We do not consider this complaint falls within the warranty provider\'s scheme."]',
    '',
    `We will send you our full Complaint Assessment and Response letter by ` +
      `${formatDate(addDays(ctx.issue.startedAt, 30))}. If anything delays this, we will ` +
      'tell you why and keep you updated at least once every 28 days.',
    signOff(ctx),
  ].join('\n')
  return {
    milestoneKey: 'path_to_resolution',
    title: 'Path to Resolution letter (Day 10)',
    subject: `Path to Resolution — your complaint (${ref}) — ${ctx.plot.address}`,
    body,
  }
}

/** Day 30 — Complaint Assessment and Response. */
function assessmentResponse(ctx: LetterContext): LetterDraft {
  const ref = ctx.issue.reference || ctx.issue.id
  const body = [
    header(ctx),
    `Dear ${ctx.plot.customerNames || '[Customer name]'},`,
    '',
    `Re: Complaint Assessment and Response (${ref})`,
    '',
    'We have now assessed your complaint. This letter reports on each part of it in turn.',
    '',
    '1. Our assessment of each item raised:',
    '   [Report on each complaint item SEPARATELY. For each one state either:',
    '    – settled: what action has been taken to resolve it; or',
    '    – further investigation needed: what and by when (estimated date); or',
    '    – works required: what corrective work will be done and its estimated',
    '      completion date; or',
    '    – rejected: the reasons why we do not uphold this item.]',
    '',
    '2. Keeping you updated:',
    '   For anything not yet settled, we will update you on progress at least once ' +
      'every 28 days until it is resolved.',
    '',
    '3. If you are not satisfied with this response:',
    '   Please contact [name / contact details] and we will look at it again. ' +
      '[If applicable: this matter can also be referred to your warranty provider\'s ' +
      'dispute resolution service — details: (provider contact).]',
    '',
    ombudsmanBlock(),
    '',
    `If your complaint remains unresolved, we will write to you again by ` +
      `${formatDate(addDays(ctx.issue.startedAt, 56))} (our Eight-Week Letter).`,
    signOff(ctx),
  ].join('\n')
  return {
    milestoneKey: 'assessment_response',
    title: 'Assessment & Response letter (Day 30)',
    subject: `Complaint Assessment and Response (${ref}) — ${ctx.plot.address}`,
    body,
  }
}

/** Day 56 — Eight-Week letter (if unresolved). */
function eightWeek(ctx: LetterContext): LetterDraft {
  const ref = ctx.issue.reference || ctx.issue.id
  const body = [
    header(ctx),
    `Dear ${ctx.plot.customerNames || '[Customer name]'},`,
    '',
    `Re: Eight-Week update on your complaint (${ref})`,
    '',
    'Your complaint has now been open for eight weeks and has not yet been fully ' +
      'resolved. We are sorry that this is the case and want to keep you fully informed.',
    '',
    'Summary of the action we have taken so far:',
    '   [Clear summary of everything done to date.]',
    '',
    'What is still outstanding, and why:',
    '   [List each outstanding item, the reason it is not yet resolved, and the action ' +
      'being taken.]',
    '',
    'When we expect to settle it:',
    '   [Give your realistic expected timescale / target date.]',
    '',
    `We will continue to update you at least once every 28 days (next update by ` +
      `${formatDate(addDays(ctx.issue.startedAt, 84))}) until your complaint is closed.`,
    '',
    ombudsmanBlock(),
    '',
    '   As your complaint has now been open for more than 56 days, you are entitled to ' +
      'refer it to the Ombudsman now, whether or not you wait for us to finish.',
    signOff(ctx),
  ].join('\n')
  return {
    milestoneKey: 'eight_week',
    title: 'Eight-Week letter (Day 56)',
    subject: `Eight-week update — your complaint (${ref}) — ${ctx.plot.address}`,
    body,
  }
}

/** Closure letter (issued when a complaint is resolved/closed). */
function closure(ctx: LetterContext): LetterDraft {
  const ref = ctx.issue.reference || ctx.issue.id
  const body = [
    header(ctx),
    `Dear ${ctx.plot.customerNames || '[Customer name]'},`,
    '',
    `Re: Closure of your complaint (${ref})`,
    '',
    'We are writing to confirm that your complaint is now closed.',
    '',
    'What was resolved:',
    '   [List each item from our Complaint Assessment and Response letter and how it ' +
      'was settled.]',
    `   ${ctx.issue.resolutionNote ? `Summary: ${ctx.issue.resolutionNote}` : ''}`.trimEnd(),
    '',
    `Complaint start date: ${formatDate(ctx.issue.startedAt)}`,
    `Complaint closed: ${formatDate(ctx.issue.resolvedAt || ctx.today)}`,
    '',
    'If you remain dissatisfied:',
    '   You can refer this complaint to the New Homes Ombudsman Service, which is free ' +
      'and independent. To do so, contact:',
    `   ${NHOS_CONTACT}`,
    '',
    'Thank you for giving us the opportunity to put things right.',
    signOff(ctx),
  ].join('\n')
  return {
    milestoneKey: 'closure',
    title: 'Closure letter',
    subject: `Closure of your complaint (${ref}) — ${ctx.plot.address}`,
    body,
  }
}

const GENERATORS: Record<string, (ctx: LetterContext) => LetterDraft> = {
  acknowledgement,
  path_to_resolution: pathToResolution,
  assessment_response: assessmentResponse,
  eight_week: eightWeek,
  closure,
}

/** All standard letters offered for a complaint. */
export const LETTER_MENU: { key: string; label: string }[] = [
  { key: 'acknowledgement', label: 'Acknowledgement (Day 5)' },
  { key: 'path_to_resolution', label: 'Path to Resolution (Day 10)' },
  { key: 'assessment_response', label: 'Assessment & Response (Day 30)' },
  { key: 'eight_week', label: 'Eight-Week (Day 56)' },
  { key: 'closure', label: 'Closure' },
]

export function generateLetter(
  key: string,
  developerName: string,
  plot: Plot,
  issue: Issue
): LetterDraft {
  const gen = GENERATORS[key] || GENERATORS.acknowledgement
  return gen({ developerName, plot, issue, today: todayISO() })
}

// ---------------------------------------------------------------------------
// Journey letters — written notices the Code requires before completion
// ---------------------------------------------------------------------------

function journeyHeader(developerName: string, plot: Plot, today: string): string {
  return [
    developerName || '[Your company name]',
    '',
    `Date: ${formatDate(today)}`,
    '',
    'To:',
    plot.customerNames || '[Customer name(s)]',
    plot.address || '[Property address]',
    '',
  ].join('\n')
}

function journeySignOff(developerName: string): string {
  return [
    '',
    'Yours sincerely,',
    '',
    '[Name]',
    developerName || '[Your company name]',
    '[Contact telephone] · [Contact email]',
  ].join('\n')
}

/**
 * Major change notice — Code 2.9. The Code requires the customer to be told in
 * writing about a major change, their right to cancel within 14 days of
 * receiving the written details (with a full refund), and to be recommended to
 * take legal advice. The notice to complete cannot be served in that window.
 */
export function majorChangeLetter(
  developerName: string,
  plot: Plot,
  change: ChangeRecord
): { title: string; subject: string; body: string } {
  const today = todayISO()
  const cancelBy = majorChangeCancelBy(change)
  const body = [
    journeyHeader(developerName, plot, today),
    `Dear ${plot.customerNames || '[Customer name]'},`,
    '',
    `Re: Notice of a major change to your new home at ${plot.address || '[address]'}`,
    '',
    'We are writing to tell you about a change to your new home that we consider to be a ' +
      'major change — one that significantly and substantially affects the size, appearance ' +
      'or value of the home compared with what you were shown when you reserved.',
    '',
    'The change:',
    `   ${change.description || '[describe the change, and how it differs from what was shown]'}`,
    '   [Add drawings/plans if helpful.]',
    '',
    'Your right to cancel:',
    `   If you find this change unacceptable, you have the right to cancel your ` +
      `Reservation Agreement or contract of sale within 14 days of receiving this ` +
      `letter — that is, by ${formatDate(cancelBy)} — and receive a full refund of your ` +
      'contract deposit, reservation fee and any other payments you have made.',
    '',
    'We recommend that you discuss this letter with your legal adviser before deciding.',
    '',
    'If we do not hear from you by the date above, we will assume you are content to ' +
      'proceed. Please contact us with any questions in the meantime.',
    journeySignOff(developerName),
  ].join('\n')
  return {
    title: 'Major change notice (Code 2.9)',
    subject: `Notice of a major change — ${plot.address}`,
    body,
  }
}

/**
 * Delay / timetable update — Code 2.6 and 2.8: keep the customer informed
 * about when the home is likely to be ready, with updates at appropriate times.
 */
export function delayUpdateLetter(
  developerName: string,
  plot: Plot,
  change: ChangeRecord
): { title: string; subject: string; body: string } {
  const today = todayISO()
  const body = [
    journeyHeader(developerName, plot, today),
    `Dear ${plot.customerNames || '[Customer name]'},`,
    '',
    `Re: Update on the completion timetable for ${plot.address || '[address]'}`,
    '',
    'We are writing to keep you informed about the timetable for your new home.',
    '',
    'What has changed:',
    `   ${change.description || '[explain the delay and its cause]'}`,
    '',
    'Our current expectation:',
    `   Expected completion: ${plot.completionDate ? formatDate(plot.completionDate) : '[updated expected completion date]'}`,
    '   [Set out anything the customer should do, and when you will update them next.]',
    '',
    'Your contract of sale sets out what happens if the home is not ready by the date we ' +
      'said it would be, including the circumstances in which you can cancel. If you have ' +
      'any questions we recommend speaking to your legal adviser.',
    '',
    'We are sorry for the inconvenience and will keep you updated.',
    journeySignOff(developerName),
  ].join('\n')
  return {
    title: 'Completion timetable update (Code 2.6 / 2.8)',
    subject: `Completion timetable update — ${plot.address}`,
    body,
  }
}

/** Reminder shown on a snag: the 30-day put-right note (not a Code letter). */
export function snagReminderText(plot: Plot, issue: Issue, developerName: string): string {
  return [
    `Snag logged ${formatDate(issue.startedAt)} at ${plot.address || '[address]'}.`,
    `Put-right deadline: ${formatDate(addDays(issue.startedAt, SNAG_PUT_RIGHT_DAYS))} ` +
      `(${SNAG_PUT_RIGHT_DAYS} days — the Code requires after-sales issues to be settled ` +
      'within 30 days unless there is a significant reason for delay).',
    `Description: ${issue.description || '[description]'}`,
    developerName ? `Logged by: ${developerName}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
