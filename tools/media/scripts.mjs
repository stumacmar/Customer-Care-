/*
 * Narration for the tour and the fourteen scenario videos.
 *
 * Provenance: the original scripts were lost with the scratch directory (see
 * README, Phase 5.8). These were recovered by transcribing the shipped videos
 * with an offline speech recogniser (tools/media/stt-check.py), correcting the
 * recogniser's errors against the app's own wording, and then applying the
 * rename from Plot Tracker to New Home Tracker. Every line is checked against
 * what the app actually shows and what Code V2 actually says.
 *
 * One entry per beat: `say` is narrated, `cap` is the short caption shown on
 * screen during that beat. The harness records a beat per entry, so the
 * scenario functions in scenarios.mjs must call beat() exactly this many times.
 */

export const TOUR = {
  slug: 'demo',
  title: 'The quick tour',
  lines: [
    { say: 'Welcome to New Home Tracker, from the New Homes Quality Board. It tracks every new home you sell, keeps your customers updated, and helps you keep to the Code. Let me show you around.' },
    { say: 'This is your home screen. Every site at a glance, and the colours tell you what needs your attention.', cap: 'Every site at a glance' },
    { say: 'The plot that needs you next is always at the top. Red means act today.', cap: 'Most urgent first — red means act today' },
    { say: 'Open a plot, and one line tells you the next thing to do. You never have to work out a date yourself.', cap: 'One line: the next thing to do' },
    { say: "The journey runs all the way from reservation to legal completion, and the Code's timescales are tracked for you.", cap: 'Reservation to legal completion' },
    { say: 'If there is a major change, speak to the customer first, then send the written notice and record the day they receive it. Their fourteen day window runs from that day.', cap: 'Major change: notice in writing, 14 days from receipt' },
    { say: 'Every choice, extra, delay, site visit and email is logged in seconds, building your evidence trail.', cap: 'Choices, extras, delays, visits, emails' },
    { say: "Complaints follow the Code's formal timetable. Day five, day ten, day thirty, and day fifty six.", cap: 'Complaints: day 5, 10, 30 and 56' },
    { say: 'The letters are drafted for you, with the right dates already filled in. You check them, complete the brackets, and send.', cap: 'Letters drafted with the right dates' },
    { say: 'Emails with your customer belong in the record too, so the evidence trail is complete.', cap: 'Emails in the record' },
    { say: "When you're ready, share the plot with your customer. It's a private link, and nothing is uploaded anywhere.", cap: 'A private link — nothing is uploaded anywhere' },
    { say: "They get their own app. Their home, their rights under the Code, and everything you've handed over.", cap: 'Your customer’s own app' },
    { say: "If something isn't right, they're guided to the correct process, and it reaches you by email, ready to log with the response timescale already running.", cap: 'Reports arrive ready to log' },
    { say: 'The Code is summarised clause by clause and searchable, with the exact clause to cite.', cap: 'The Code, searchable' },
    { say: 'New Home Tracker, from the New Homes Quality Board. Free. Always accessible. Continued Code compliance. Find it at plot clock dot co dot uk.' },
  ],
}

export const SCENARIOS = {
  setup: {
    title: 'First setup',
    code: 'Settings',
    lines: [
      { say: 'First setup. Two minutes, once.' },
      { say: 'New Home Tracker is free to NHQB registered developers. Enter the access code from the NHQB developer portal. It stays on your phone, and nothing is sent to NHQB.', cap: 'The access code from the developer portal' },
      { say: 'Open Settings. Your company name goes on every letter and export, and your email is where customer reports arrive.', cap: 'Company name and email' },
      { say: 'Take a backup from here too. Everything lives on this device only, so keep the file somewhere safe, like your email or Drive.', cap: 'Back up — it lives on this device only' },
      { say: 'On your phone, choose Add to Home Screen. It then works like any other app, with no signal, standing outside a house.', cap: 'Add to Home Screen — works with no signal' },
      { say: 'That is all. Everything else is recorded on the day it happens.', cap: 'Log it the day it happens' },
    ],
  },
  reservation: {
    title: 'Reservation day',
    code: 'Code 2.2 · 2.3',
    lines: [
      { say: "Reservation day. The customer has just signed, and this is where the Code's journey starts." },
      { say: 'Add the plot: address, customer, and the reservation date. That is all the typing.', cap: 'Address, customer, reservation date' },
      { say: 'The fourteen day cooling-off period starts by itself, and the exchange-by date is set at the Code minimum of six weeks.', cap: 'Cooling-off and exchange-by, set for you' },
      { say: 'The checklist asks only for what is due now: the signed Reservation Agreement and the Affordability Schedule.', cap: 'Only what is due at this stage' },
      { say: 'Then share the plot. It is a private link, and nothing is uploaded anywhere.', cap: 'Share — a private link' },
      { say: 'Now, your customer.' },
      { say: 'They see their home, the day the cooling-off ends, and their rights, including a full refund if they change their mind in time.', cap: 'Their home, their cooling-off, their rights' },
      { say: 'Reservation done. The deadlines are running, and both of you can see them.', cap: 'Both of you see the same dates' },
    ],
  },
  'cooling-off-cancellation': {
    title: 'If the sale falls through',
    code: 'Code 2.3 · 2.4 · 2.13',
    lines: [
      { say: 'If the sale falls through. The Code sets the refund timescales.' },
      { say: 'Open the plot, then Edit details and dates, and scroll to If the customer pulls out.', cap: 'Edit details & dates → If the customer pulls out' },
      { say: 'Record the cancellation. The plot and all its evidence stay, and the refund deadline starts.', cap: 'The refund deadline starts' },
      { say: 'Within cooling-off the reservation fee is refunded in full. After cooling-off, the fee less any deductions set out in the Reservation Agreement, within fourteen days. After exchange, the contract deposit within twenty eight days.', cap: 'In full in cooling-off · 14 days · 28 days after exchange' },
      { say: 'Mark the refund paid when it is done, and the plot archives itself with its record intact.', cap: 'Mark refund paid — the record is kept' },
    ],
  },
  exchange: {
    title: 'Exchange of contracts',
    code: 'Code 2.2 · 2.6 · 2.7',
    lines: [
      { say: 'Exchange of contracts. The reservation becomes a binding sale.' },
      { say: "Before exchange, the checklist asks for the pre-contract information, sent to the customer's solicitor or conveyancer, and for the contract terms to be confirmed compliant.", cap: 'Pre-contract information · contract terms' },
      { say: 'When contracts exchange, record the date under Edit details. The journey moves on, and the next deadlines follow.', cap: 'Record the exchange date' },
      { say: 'Now, your customer.' },
      { say: 'The app shows the stage they have reached, and that their solicitor or conveyancer will guide them from here. Exchanged. From here, the Code turns to the build, changes, and completion.', cap: 'Exchanged — on to the build' },
    ],
  },
  choices: {
    title: 'Choices, extras and site visits',
    code: 'Code 2.2 · 2.9',
    lines: [
      { say: 'Choices, extras and site visits. The evidence trail for the build.' },
      { say: 'A choice takes one line and an optional photo. Front door colour confirmed.', cap: 'One line, optional photo' },
      { say: 'Worktop upgrade, paid. Ten seconds.', cap: 'Extras: what was agreed, and the price' },
      { say: 'Site visits too. Who came, when, and whether they attended, got no access, or were turned away. This is your evidence if attendance is ever disputed.', cap: 'Attended · no access · turned away' },
      { say: 'Now, your customer.' },
      { say: 'They see the choices in their own app, so what was agreed is on record for both sides.', cap: 'On record for both sides' },
      { say: 'And if it did not happen as arranged, they can report a missed appointment, and it comes back to you ready to log.', cap: 'A missed appointment, reported in their words' },
      { say: 'Log it the day it happens, so the record is made at the time.', cap: 'Log it the day it happens' },
    ],
  },
  'major-change': {
    title: 'A major change',
    code: 'Code 2.9',
    lines: [
      { say: 'A major change. A change you are responsible for that significantly and substantially affects the size, appearance or value of the home, including its internal layout.' },
      { say: 'Log it as a major change. Speak to the customer first and have the conversation. Then the app drafts the written notice the Code requires. Check it, complete the brackets, and send.', cap: 'Speak to the customer, then the written notice' },
      { say: 'Record the day the customer receives it. Their fourteen day window runs from that day, and the app warns you not to serve notice to complete during it.', cap: '14 days from the day they receive it' },
      { say: 'Now, your customer.' },
      { say: 'They see the change, the date the window closes, and their right to cancel and receive all their money back.', cap: 'Their right to cancel, with the date' },
      { say: 'When the window ends, record whether they accepted or cancelled. Either way, the record is complete.', cap: 'Record the outcome' },
    ],
  },
  delay: {
    title: 'A delay',
    code: 'Code 2.7 · 2.8',
    lines: [
      { say: 'A delay. Completion is slipping, and the Code asks you to keep the customer up to date on the timetable.' },
      { say: 'Log it as a delay. One line: what moved, and why.', cap: 'What moved, and why' },
      { say: 'A timetable update letter drafts itself. Check it, complete the brackets, and send.', cap: 'The update letter, drafted' },
      { say: 'Then update the expected completion date under Edit details, so everything that hangs off it moves too.', cap: 'Update the expected completion date' },
      { say: 'Now, your customer.' },
      { say: 'The app shows the revised completion and the delay in their record, so nobody is surprised. Delays can happen. The Code requires that the customer is kept informed.', cap: 'Kept informed — nobody is surprised' },
    ],
  },
  'notice-inspection': {
    title: 'Notice to complete and inspection',
    code: 'Code 2.8',
    lines: [
      { say: 'Notice to complete, and the pre-completion inspection.' },
      { say: 'When you serve notice, record the date. The app checks there are at least fourteen calendar days before completion.', cap: 'At least 14 calendar days before completion' },
      { say: 'It then prompts you to offer the pre-completion inspection.', cap: 'Offer the pre-completion inspection' },
      { say: 'The customer can attend themselves, or send a suitably qualified professional, using the NHQB checklist.', cap: 'Themselves, or a suitably qualified professional' },
      { say: 'Anything the inspection finds that falls short of warranty standards: log it as a snag or defect, to put right before completion, or within thirty days.', cap: 'Findings logged as snags or defects' },
      { say: 'Now, your customer.' },
      { say: 'They see that notice has been served, and their right to the inspection.', cap: 'Their right to the inspection' },
      { say: 'Notice served, inspection offered, findings logged. Completion can go ahead on a home that is ready.', cap: 'A home that is ready' },
    ],
  },
  completion: {
    title: 'Completion and handover',
    code: 'Code 2.11 · 2.12 · 3.1',
    lines: [
      { say: 'Completion. Legal completion, and the after-sales period begins.' },
      { say: 'Record the legal completion date. From today, the after-sales service, at least two years, runs, and the checklist moves to the handover pack.', cap: 'After-sales: at least two years from today' },
      { say: 'Work down it as you hand things over: the schedules of incomplete work, home demonstration, warranty documents, the complaints procedure, the health and safety file, and your after-sales statement. Now, your customer.', cap: 'The handover pack, ticked off as you go' },
      { say: 'They see every document they have received, and the date their after-sales service runs to.', cap: 'Every document, and the after-sales date' },
      { say: 'Handover complete. Everything you were given, and when, is on the record.', cap: 'Everything given, and when, on the record' },
    ],
  },
  snag: {
    title: 'A snag or defect',
    code: 'Code 3.3',
    lines: [
      { say: 'A snag or defect. A snag is a minor imperfection or fault that does not meet the expected quality or finish. A defect is incomplete work, or a fault in completed work, that does not meet the expected quality or finish. Under the Code they may be found at the pre-completion inspection or after legal completion.' },
      { say: 'Your customer reports it from their app. They describe the problem, and because the home is completed, the app routes it as a snag or defect.', cap: 'Reported from their app, in their words' },
      { say: 'It reaches you by email. Tap the link at the foot of it, and New Home Tracker opens on the right plot with the report filled in. One tap logs it, with their words and their date.', cap: 'Tap the link in their email — it arrives filled in' },
      { say: 'The thirty day deadline runs from when they raised it. If it cannot be met, the app reminds you to update them at least monthly, with the reason, until it is put right.', cap: '30 days from the day they raised it' },
      { say: 'And back on their side, they can see the same deadline. Thirty days, or a monthly update. Nothing to work out.', cap: 'They see the fix deadline you are working to' },
    ],
  },
  complaint: {
    title: 'A formal complaint',
    code: 'Code 3.4 · 3.5',
    lines: [
      { say: "A formal complaint. The Code's timetable is fixed, and it runs from the complaint start date." },
      { say: "Your customer does not need to know the Code's vocabulary. They say what it is about, and the app routes it to the complaints process.", cap: 'They say what it is about; the app routes it' },
      { say: 'Tap the link in their email. Look at the timetable. The complaint start date is the first business day after you received it. Acknowledgement by day five. Path to Resolution by day ten.', cap: 'Day 5 acknowledgement · day 10 Path to Resolution' },
      { say: 'Assessment and Response by day thirty. The Eight-Week Letter by day fifty six. Then updates every twenty eight days.', cap: 'Day 30 · day 56 · then every 28 days' },
      { say: 'Each step has a Draft button, and the letter comes with the right dates already in it.', cap: 'Draft — the dates are already in it' },
      { say: 'Your customer sees the same timetable: what they should receive, and by when. Follow the steps, and the dates take care of themselves. And after fifty six days, resolved or not, they can go to the Ombudsman.', cap: 'They see the same timetable' },
    ],
  },
  emergency: {
    title: 'An emergency',
    code: 'Code 3.1 · 3.3 · glossary',
    lines: [
      { say: 'An emergency. The Code defines it as an immediate threat to safety, security, health or well-being. Your after-sales statement says what qualifies; typically a door that will not lock, an uncontainable leak, no heating and hot water, or no power.' },
      { say: "In the customer's app, the emergency option appears only after completion, and it tells them to phone you first, not to wait for an email.", cap: 'Phone first — do not wait for an email' },
      { say: 'Then they send the written record, so there is no dispute later about when it was raised.', cap: 'A written record of when it was raised' },
      { say: 'On your side it is flagged urgent and sits at the top of everything. It never queues behind routine work.', cap: 'Urgent — at the top of everything' },
      { say: 'Emergencies are not snags. If the customer is unhappy with how one was handled, they can make a formal complaint.', cap: 'Not a snag — handled under after-sales' },
    ],
  },
  emails: {
    title: 'Emails in the record',
    code: 'The evidence trail',
    lines: [
      { say: 'Emails in the record. If a dispute arises, the correspondence needs to be in the record, not only in your inbox.' },
      { say: 'Every plot has a Correspondence section. Tap the log button, pick Email, paste the email, and mark whether it was to or from the customer.', cap: 'Pick Email, paste, to or from' },
      { say: 'Keep the date it was actually sent, not the day you pasted it. That is the date that matters.', cap: 'The date it was actually sent' },
      { say: 'It joins the timeline and the export, so the file you hand the Ombudsman carries the correspondence alongside everything else.', cap: 'In the timeline and the export' },
      { say: 'On Android, share an email straight from your mail app to New Home Tracker, and the form arrives filled in. On iPhone, copy and paste.', cap: 'Android: share from your mail app' },
    ],
  },
  ombudsman: {
    title: 'Formal complaints to the Ombudsman',
    code: 'Code 3.5',
    lines: [
      { say: 'Formal complaints to the Ombudsman.' },
      { say: 'From fifty six days after the complaint start date, the customer can take it to the New Homes Ombudsman Service.', cap: 'From 56 days after the complaint start date' },
      { say: "Your customer's app tells them so, with the timetable and the contact details.", cap: 'Their app tells them' },
      { say: 'Your record is your evidence. Export PDF gives you every date, document, change, email, letter and timeline event in one clean file. That is the bundle you hand to the Ombudsman, the NHQB compliance team, or your insurer.', cap: 'Export PDF — the whole record in one file' },
      { say: 'Log things the moment they happen, and an escalation is simply a matter of exporting the record.', cap: 'Log it as it happens; export when asked' },
    ],
  },
}

/** Journey order, as the Guide shows them. */
export const ORDER = [
  'setup',
  'reservation',
  'exchange',
  'choices',
  'major-change',
  'delay',
  'notice-inspection',
  'completion',
  'cooling-off-cancellation',
  'snag',
  'complaint',
  'emergency',
  'emails',
  'ombudsman',
]
