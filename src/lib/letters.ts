/*
 * Auto-generated complaint letters (Code 3.4).
 *
 * The Code specifies exact required content for five letters. For a one- or
 * two-person developer, drafting these correctly under time pressure is the
 * single biggest compliance-failure risk. Each generator here pre-fills the
 * customer name, address, reference and the correct legal deadline dates, and
 * lays out the Code's required content as editable fields — never a black-box
 * auto-send. The user reviews, tweaks the [bracketed] prompts, and sends.
 */

import { addDays, formatDate, todayISO } from './dates'
import { SNAG_PUT_RIGHT_DAYS } from './code'
import type { Issue, MilestoneKey, Plot } from '../types'

export interface LetterContext {
  developerName: string
  plot: Plot
  issue: Issue
  today: string
}

export interface LetterDraft {
  milestoneKey: MilestoneKey
  title: string
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
    `  • Complaint received: ${formatDate(ctx.issue.startedAt)}`,
    `  • Summary: ${ctx.issue.description || '[summary of the complaint]'}`,
    '',
    'What happens next:',
    `  • We will write to you again by ${formatDate(addDays(ctx.issue.startedAt, 10))} ` +
      'setting out how we intend to resolve your complaint (our Path to Resolution).',
    `  • We aim to provide a full assessment and response by ` +
      `${formatDate(addDays(ctx.issue.startedAt, 30))}.`,
    '',
    'Your point of contact for this complaint is [name], who can be reached on ' +
      '[telephone] or [email].',
    '',
    'A copy of our complaints procedure is enclosed / was provided with your home ' +
      'information pack.',
    signOff(ctx),
  ].join('\n')
  return { milestoneKey: 'acknowledgement', title: 'Acknowledgement letter (Day 5)', body }
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
    'Further to our acknowledgement, this letter sets out how we intend to ' +
      'investigate and resolve your complaint.',
    '',
    'Our proposed path to resolution:',
    '  • What we will do: [describe the investigation / inspection / works planned]',
    '  • Who is responsible: [name and role]',
    '  • Expected steps and timescales: [e.g. inspection by DD/MM, works by DD/MM]',
    '',
    `We expect to provide our full Complaint Assessment and Response by ` +
      `${formatDate(addDays(ctx.issue.startedAt, 30))}. If we need longer than this, we ` +
      'will tell you why and give you a revised date.',
    '',
    'If at any point you are unhappy with how your complaint is being handled, ' +
      'you can [describe internal escalation], and you retain the right to refer the ' +
      'matter as set out in our complaints procedure.',
    signOff(ctx),
  ].join('\n')
  return { milestoneKey: 'path_to_resolution', title: 'Path to Resolution letter (Day 10)', body }
}

/**
 * Day 30 — Complaint Assessment and Response.
 * Code-required content: what is settled, timescale if not settled, the dispute
 * resolution route, and Ombudsman referral information.
 */
function assessmentResponse(ctx: LetterContext): LetterDraft {
  const ref = ctx.issue.reference || ctx.issue.id
  const body = [
    header(ctx),
    `Dear ${ctx.plot.customerNames || '[Customer name]'},`,
    '',
    `Re: Complaint Assessment and Response (${ref})`,
    '',
    'We have now assessed your complaint. This letter sets out our response.',
    '',
    '1. Our assessment / what has been settled:',
    '   [Set out each point of the complaint and how it has been resolved, or the ' +
      'conclusion reached.]',
    '',
    '2. Anything not yet settled, and the timescale to resolve it:',
    '   [If any element is outstanding, describe it and give a clear target date. ' +
      'Write "None — all matters resolved" if fully settled.]',
    '',
    '3. If you are not satisfied — how the dispute can be resolved:',
    '   You may continue to raise this with us at [contact]. If we cannot resolve ' +
      'matters between us, you have the right to refer your complaint to independent ' +
      'dispute resolution.',
    '',
    '4. Ombudsman referral information:',
    '   Once our complaints process is complete (or after 8 weeks if unresolved), you ' +
      'may refer your complaint to the New Homes Ombudsman Service. Details of how to ' +
      'do this are in the complaints procedure provided with your home, and available ' +
      'from the New Homes Quality Board.',
    '',
    `If your complaint remains unresolved, we will write to you again by ` +
      `${formatDate(addDays(ctx.issue.startedAt, 56))} (our Eight-Week letter).`,
    signOff(ctx),
  ].join('\n')
  return {
    milestoneKey: 'assessment_response',
    title: 'Assessment & Response letter (Day 30)',
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
      'resolved. We are sorry that this is the case and want to keep you informed.',
    '',
    'Current position:',
    '  • What has been done so far: [summary]',
    '  • What remains outstanding: [summary]',
    '  • Our revised timescale to resolve it: [target date]',
    '',
    'Your right to refer to the New Homes Ombudsman:',
    '  Because your complaint has been open for more than eight weeks, you are now ' +
      'entitled to refer it to the New Homes Ombudsman Service, whether or not you ' +
      'wait for us to finish. Details of how to refer are in the complaints procedure ' +
      'provided with your home.',
    '',
    `We will continue to update you at least every 28 days (next update by ` +
      `${formatDate(addDays(ctx.issue.startedAt, 84))}) until your complaint is closed.`,
    signOff(ctx),
  ].join('\n')
  return { milestoneKey: 'eight_week', title: 'Eight-Week letter (Day 56)', body }
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
    'Summary of resolution:',
    `   ${ctx.issue.resolutionNote || '[Describe what was agreed / put right and any works completed.]'}`,
    '',
    `Complaint opened: ${formatDate(ctx.issue.startedAt)}`,
    `Complaint closed: ${formatDate(ctx.issue.resolvedAt || ctx.today)}`,
    '',
    'If you remain dissatisfied:',
    '   You retain the right to refer this complaint to the New Homes Ombudsman ' +
      'Service. Details of how to do so are in the complaints procedure provided with ' +
      'your home.',
    '',
    'Thank you for giving us the opportunity to put things right.',
    signOff(ctx),
  ].join('\n')
  return { milestoneKey: 'closure', title: 'Closure letter', body }
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

/** Reminder shown on a snag: the 30-day put-right note (not a Code letter). */
export function snagReminderText(plot: Plot, issue: Issue, developerName: string): string {
  return [
    `Snag logged ${formatDate(issue.startedAt)} at ${plot.address || '[address]'}.`,
    `Put-right deadline: ${formatDate(addDays(issue.startedAt, SNAG_PUT_RIGHT_DAYS))} ` +
      `(${SNAG_PUT_RIGHT_DAYS} days — Code 3.3).`,
    `Description: ${issue.description || '[description]'}`,
    developerName ? `Logged by: ${developerName}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
