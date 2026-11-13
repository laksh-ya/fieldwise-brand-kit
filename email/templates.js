// Every Fieldwise email: subject, preview text and body blocks.
// kind "plain" = a personal email from your own inbox; "branded" = logo, banner and footer.
// {{tags}} are filled by your mail tool; `sample` holds the values used for the previews.

const groups = [
  ["cold", "Cold outreach"],
  ["replies", "Replies"],
  ["client", "Winning the project"],
  ["project", "During the project"],
  ["billing", "Billing"],
  ["after", "After launch"],
  ["basics", "Basics"],
];

const sample = {
  first_name: "Asha", company: "Sunrise Dental Care", city: "Bhopal",
  sender_name: "Your Name", sender_role: "Co-founder",
  search_term: "dentist in Arera Colony",
  observation: "on the second page, below three clinics with fewer reviews than yours",
  load_time: "7",
  quick_win: "Your Google profile has four photos, and the last reply to a review was in March. Add ten recent photos of the clinic and the team, and reply to your five latest reviews. Both tell Google the clinic is active, and both help people pick you over the clinic down the road.",
  call_link: "https://example.com/book-a-call",
  slot_1: "Tuesday at 11 am", slot_2: "Wednesday at 4 pm",
  price_range: "₹40,000 and ₹80,000",
  check_back: "February",
  work_link: "https://example.com/work",
  topic: "a new website and online bookings",
  rating: "4.7", review_count: "180",
  // calls and proposals
  call_day: "Thursday", call_date: "Thursday, 20 November", call_time: "11:00 am IST", meet_link: "https://meet.google.com/abc-defg-hij",
  proposal_link: "https://example.com/proposal.pdf", valid_until: "5 December",
  item_1: "Website design and build", item_1_note: "6 pages, built for phones first", item_1_price: "₹45,000",
  item_2: "Booking flow", item_2_note: "Form that sends each request to WhatsApp and email", item_2_price: "₹12,000",
  item_3: "Local search setup", item_3_note: "Google Business Profile, photos, hours and reviews", item_3_price: "₹8,000",
  care_price: "₹1,500", total: "₹65,000",
  timeline: "3 weeks from kickoff",
  smallest_piece: "Google profile and the booking form",
  // project
  weeks: "three", upload_link: "https://example.com/upload",
  week: "2", headline: "the home page is ready to review",
  done_1: "Home page designed and built, with your new photos",
  done_2: "Booking form connected to your front desk on WhatsApp",
  done_3: "Google profile updated with hours, services and 18 photos",
  next_1: "Services, team and contact pages",
  next_2: "Speed check on three phones, then fixes",
  needed: "Short bios for Dr. Mehta and Dr. Rao (two or three lines each), by Friday if you can.",
  preview_link: "https://example.com/preview", launch_date: "5 December",
  client_site: "sunrisedental.in", client_url: "https://sunrisedental.in",
  // billing
  invoice_no: "FW-2026-014", invoice_date: "14 November 2026", due_date: "29 November 2026",
  invoice_for: "the first half of the website project",
  amount: "₹32,500", balance: "₹32,500, due at launch",
  line_1: "Website project, first payment", line_1_note: "50% of ₹65,000, on kickoff", line_1_price: "₹32,500",
  upi_id: "fieldwise@upi", bank_name: "HDFC Bank", account_no: "XXXX XXXX 1234", ifsc: "HDFC0000000",
  invoice_link: "https://example.com/invoice.pdf",
  paid_on: "18 November 2026", pay_method: "UPI", pay_ref: "UTR 4321 8765 0987",
  // reports
  month: "October",
  m1: "Website visits", m1_value: "2,410", m1_delta: "+18% on September",
  m2: "Calls from Google", m2_value: "96", m2_delta: "+12% on September",
  m3: "Booking requests", m3_value: "41", m3_delta: "+9 on September",
  m4: "Rank for “dentist near me”", m4_value: "#3", m4_delta: "up from #7",
  did_1: "Added 24 photos and replied to every new review",
  did_2: "Published a page on clear aligners, which now brings in 6 searches a day",
  did_3: "Fixed a slow image on the home page (now 1.4 s on a mid-range phone)",
  plan_1: "A page for teeth whitening, your most asked-about service",
  plan_2: "A reminder that asks happy patients for a review after their visit",
  review_link: "https://example.com/review",
  // newsletter
  nl_title: "Your Google profile is your new front door",
  unsubscribe_link: "https://example.com/unsubscribe",
};

const templates = [
  /* ---------------- cold outreach: a four-step sequence plus the note ---------------- */
  {
    id: "cold-1-first-touch", group: "cold", kind: "plain", name: "1 · First email", when: "Day 1. One real observation, one small ask. Send from your own inbox, as plain text if you can.",
    subject: "{{company}} on Google",
    preheader: "I searched {{search_term}} this morning.",
    blocks: [
      { p: "Hi {{first_name}}," },
      { p: "I searched “{{search_term}}” this morning. {{company}} showed up {{observation}}." },
      { p: "Your site also takes about {{load_time}} seconds to open on a phone, which is where most of those searches happen. Many people give up before it loads." },
      { p: "We’re Fieldwise. We build fast websites, sort out Google listings and set up bookings that land on WhatsApp. For a resort in Indore, we built the site, online room booking and event enquiries that go straight to the owner’s phone." },
      { p: "I’ve written a short note on the three changes that would help {{company}} most. Shall I send it over?" },
      { sign: "Thanks," },
      { ps: "P.S. If someone else looks after the website, who should I ask?" },
    ],
  },
  {
    id: "cold-2-follow-up", group: "cold", kind: "plain", name: "2 · Follow-up", when: "Day 3, as a reply in the same thread. Say what’s in the note.",
    subject: "Re: {{company}} on Google",
    preheader: "What the note covers.",
    blocks: [
      { p: "Hi {{first_name}}, bringing this back up in case it got buried." },
      { p: "The note covers:" },
      { ol: ["Why the site is slow on phones, and the fix", "Three changes that move {{company}} up in Google Maps", "A simple way to take bookings on WhatsApp"] },
      { p: "It’s yours either way, no call needed. Want it?" },
      { sign: "Thanks," },
    ],
  },
  {
    id: "cold-3-free-tip", group: "cold", kind: "plain", name: "3 · One free fix", when: "Day 7, new thread. Give away one fix they can do themselves.",
    subject: "One thing for {{company}} this week",
    preheader: "A fix you can make today, no help needed.",
    blocks: [
      { p: "Hi {{first_name}}," },
      { p: "Here’s one change from the note that you can make today, without us:" },
      { p: "{{quick_win}}" },
      { p: "The other two take a bit more work. I can walk you through them in a 15-minute call, or just send them over. Whichever is easier." },
      { sign: "Thanks," },
    ],
  },
  {
    id: "cold-4-last-note", group: "cold", kind: "plain", name: "4 · Last note", when: "Day 14. Close the loop politely and leave the door open.",
    subject: "Closing the loop",
    preheader: "I’ll stop here.",
    blocks: [
      { p: "Hi {{first_name}}," },
      { p: "I’ll stop here so I’m not filling your inbox." },
      { p: "If more bookings from Google moves up the list later, reply “later” and I’ll check back in three months. The note stays ready whenever you want it." },
      { p: "Wishing {{company}} a busy season." },
      { sign: "Best," },
    ],
  },
  {
    id: "cold-5-the-note", group: "cold", kind: "branded", name: "5 · The note", when: "When they say yes. The short audit you promised, in order of impact.",
    subject: "The note for {{company}}",
    preheader: "Three changes, in the order we’d make them.",
    label: "for {{company}}",
    blocks: [
      { h: "Three changes for {{company}}" },
      { p: "Hi {{first_name}}, here’s the note I mentioned. I looked at your website, your Google profile and how a new patient books today." },
      { status: [
        ["good", "Your reviews are strong", "{{rating}} stars from {{review_count}} patients. That’s the hardest part to build, and you already have it."],
        ["work", "The site is slow on phones", "It takes {{load_time}} seconds to open on a mid-range phone, mostly because of large photos and a heavy theme. <b>Fix:</b> rebuild the main pages lean, so they open in under two seconds."],
        ["work", "You’re on page two for “{{search_term}}”", "The clinics above you post photos often and reply to reviews. <b>Fix:</b> complete the Google profile, add photos every month, and reply to every review."],
        ["missing", "Booking still starts with a phone call", "If nobody picks up, the patient calls the next clinic. <b>Fix:</b> a short booking form that sends each request to your front desk on WhatsApp and email."],
      ] },
      { kv: [["Time", "About three weeks for all three"], ["Your time", "Around two hours: one call, one review, one sign-off"], ["Price", "Between {{price_range}}, depending on pages"]], title: "What it would take" },
      { btn: ["Book a 15-minute call", "{{call_link}}"] },
      { p: "Or reply here with any questions. Happy to go through any of it." },
      { sign: "Thanks," },
    ],
  },

  /* ---------------- replies to cold emails ---------------- */
  {
    id: "reply-interested", group: "replies", kind: "plain", name: "They’re interested", when: "They replied yes or asked to talk.",
    subject: "Re: {{company}} on Google", preheader: "Two times that work this week.",
    blocks: [
      { p: "Hi {{first_name}}, great to hear." },
      { p: "Would {{slot_1}} or {{slot_2}} work for a 15-minute call? Or pick any time here: <a href=\"{{call_link}}\">{{call_link}}</a>" },
      { p: "I’ll share my screen and show you the three changes on your own site, so there’s nothing to prepare." },
      { sign: "Thanks," },
    ],
  },
  {
    id: "reply-pricing", group: "replies", kind: "plain", name: "“How much?”", when: "They asked for a price before a call.",
    subject: "Re: {{company}} on Google", preheader: "A straight answer on price.",
    blocks: [
      { p: "Hi {{first_name}}, fair question." },
      { p: "Most projects like this come to between {{price_range}} for the website, with the Google profile work included. After launch, hosting and care is {{care_price}} a month, and you can stop that any time." },
      { p: "I can give you an exact number after a 15-minute call, once I know which pages you need. Does {{slot_1}} work?" },
      { sign: "Thanks," },
    ],
  },
  {
    id: "reply-send-info", group: "replies", kind: "plain", name: "“Send me details”", when: "They asked for more information first.",
    subject: "Re: {{company}} on Google", preheader: "What we do, in four lines.",
    blocks: [
      { p: "Hi {{first_name}}, here’s the short version." },
      { ol: ["<b>Websites</b> that open in under two seconds on a phone and are easy for your team to update", "<b>Google and Maps</b>: a complete profile, photos, reviews and the searches you should show up for", "<b>Bookings and enquiries</b> that reach you on WhatsApp and email, so none get missed", "<b>Care</b> after launch: hosting, fixes, and a one-page note each month on what moved"] },
      { p: "Some of our recent work: <a href=\"{{work_link}}\">{{work_link}}</a>" },
      { p: "I can also send the note for {{company}}: three specific changes, in the order we’d make them. Want it?" },
      { sign: "Thanks," },
    ],
  },
  {
    id: "reply-not-now", group: "replies", kind: "plain", name: "“Not right now”", when: "They said it’s not the right time.",
    subject: "Re: {{company}} on Google", preheader: "No problem, I’ll check back.",
    blocks: [
      { p: "Hi {{first_name}}, no problem at all, thanks for letting me know." },
      { p: "I’ll check back in {{check_back}}. If anything changes before then, just reply here." },
      { sign: "Best," },
    ],
  },
  {
    id: "reply-wrong-person", group: "replies", kind: "plain", name: "Wrong person", when: "They said someone else handles it.",
    subject: "Re: {{company}} on Google", preheader: "Who should I speak to?",
    blocks: [
      { p: "Hi {{first_name}}, thanks for the reply." },
      { p: "Would you mind pointing me to whoever handles the website or marketing? I’ll keep it short with them, and I’m happy to mention you suggested it." },
      { sign: "Thanks," },
    ],
  },

  /* ---------------- winning the project ---------------- */
  {
    id: "enquiry-reply", group: "client", kind: "plain", name: "Reply to an enquiry", when: "Someone filled in the form on the website. Reply within a working day.",
    subject: "Re: your enquiry", preheader: "Thanks for getting in touch. Here’s the next step.",
    blocks: [
      { p: "Hi {{first_name}}," },
      { p: "Thanks for getting in touch about {{topic}}." },
      { p: "The best next step is a 20-minute call, so we can understand what you need before we suggest anything. You can pick a time here: <a href=\"{{call_link}}\">{{call_link}}</a>" },
      { p: "Before we talk, it helps to know:" },
      { ol: ["Your current website, if you have one", "What you’d like more of: calls, bookings, enquiries or sales", "When you’d like it done"] },
      { p: "If it’s easier, reply here or message me on WhatsApp at +91 92014 79878." },
      { sign: "Thanks," },
    ],
  },
  {
    id: "call-confirmed", group: "client", kind: "branded", name: "Call booked", when: "Right after a call is booked.",
    subject: "Call booked: {{call_date}}", preheader: "The link, and what we’ll cover.", label: "call booked",
    blocks: [
      { h: "See you on {{call_day}}." },
      { p: "Hi {{first_name}}, thanks for making the time. Here are the details." },
      { kv: [["When", "{{call_date}}, {{call_time}}"], ["How long", "20 minutes"], ["Where", "Google Meet, no download needed"]] },
      { btn: ["Join the call", "{{meet_link}}"], tight: true },
      { h2: "What we’ll cover" },
      { list: ["Where your customers find you today", "What’s slowing them down before they call or book", "What we’d do first, how long it takes and what it costs"] },
      { p: "Need a different time? Reply to this email and I’ll move it." },
      { sign: "See you then," },
    ],
  },
  {
    id: "proposal", group: "client", kind: "branded", name: "Proposal", when: "Within two days of the call. The short version, with the full proposal linked.",
    subject: "Your proposal from Fieldwise", preheader: "Scope, price and timeline for {{company}}.", banner: "banner-proposal", label: "proposal",
    blocks: [
      { h: "Here’s the plan for {{company}}." },
      { p: "Hi {{first_name}}, thanks for the call on {{call_day}}. This is the short version; the full proposal is linked below." },
      { h2: "What we’ll do" },
      { table: { head: ["Work", "Price"], rows: [["{{item_1}}", "{{item_1_note}}", "{{item_1_price}}"], ["{{item_2}}", "{{item_2_note}}", "{{item_2_price}}"], ["{{item_3}}", "{{item_3_note}}", "{{item_3_price}}"]], foot: [["Hosting and care, after launch", "{{care_price}} a month"], ["Total to build", "{{total}}"]] } },
      { kv: [["Timeline", "{{timeline}}"], ["Payment", "Half to start, half at launch"], ["Valid until", "{{valid_until}}"]] },
      { btn: ["Read the full proposal", "{{proposal_link}}"] },
      { p: "Reply with any changes and I’ll update it the same day. When you’re ready, reply “let’s go” and we’ll send the first invoice and a kickoff date." },
      { sign: "Thanks," },
    ],
  },
  {
    id: "proposal-follow-up", group: "client", kind: "plain", name: "Proposal follow-up", when: "Four or five days after the proposal, if there’s no reply.",
    subject: "Re: Your proposal from Fieldwise", preheader: "Happy to change anything in it.",
    blocks: [
      { p: "Hi {{first_name}}," },
      { p: "Checking whether you had a chance to look at the proposal." },
      { p: "If anything doesn’t fit, whether it’s budget, timing or scope, tell me and I’ll rework it. We can also start with just the {{smallest_piece}} and add the rest later." },
      { sign: "Thanks," },
    ],
  },

  /* ---------------- during the project ---------------- */
  {
    id: "welcome", group: "project", kind: "branded", name: "Welcome and kickoff", when: "The day the project is confirmed.",
    subject: "Welcome to Fieldwise, {{first_name}}", preheader: "How the next {{weeks}} weeks go, and what we need from you.", banner: "banner-welcome",
    blocks: [
      { h: "Welcome aboard." },
      { p: "Hi {{first_name}}, we’re glad to be working on {{company}}. Here’s how the next {{weeks}} weeks go." },
      { h2: "The plan" },
      { list: [["Week 1", "We collect what we need and design the home page."], ["Week 2", "You review the design. We build the rest of the site."], ["Week 3", "Final checks on real phones, then we go live."]] },
      { h2: "What we need from you" },
      { list: ["Your logo, in any format you have", "10 to 20 photos of the place, the people and the work", "Logins for your domain and current website, or the name of whoever manages them", "Access to your Google Business Profile", "Links to any websites you like the look of"], stone: "stone-2" },
      { btn: ["Upload your files", "{{upload_link}}"] },
      { kv: [["Your contact", "{{sender_name}}, +91 92014 79878"], ["Email", "fieldwisesolutions1@gmail.com"], ["Replies", "Within one working day"]] },
      { p: "Questions at any point, just reply here." },
      { sign: "Talk soon," },
    ],
  },
  {
    id: "project-update", group: "project", kind: "branded", name: "Weekly update", when: "Every Friday during the project.",
    subject: "{{company}}: week {{week}} update", preheader: "Done this week, next week, and one thing we need.", label: "week {{week}}",
    blocks: [
      { h: "Week {{week}}: {{headline}}" },
      { p: "Hi {{first_name}}, here’s where things are." },
      { h2: "Done" },
      { list: ["{{done_1}}", "{{done_2}}", "{{done_3}}"], stone: "stone-1" },
      { h2: "Next week" },
      { list: ["{{next_1}}", "{{next_2}}"], stone: "stone-grey" },
      { h2: "Needed from you" },
      { note: "{{needed}}" },
      { btn: ["See the preview", "{{preview_link}}"] },
      { kv: [["Status", "On track"], ["Launch", "{{launch_date}}"]] },
      { sign: "Thanks," },
    ],
  },
  {
    id: "launch", group: "project", kind: "branded", name: "Site is live", when: "Launch day.",
    subject: "Your new website is live", preheader: "{{client_site}} went live this morning.", banner: "banner-live",
    blocks: [
      { h: "Your new website is live." },
      { p: "Hi {{first_name}}, {{client_site}} went live this morning. It opens in under two seconds on a mid-range phone, and every booking request now reaches your team on WhatsApp and email." },
      { btn: ["Visit your site", "{{client_url}}"] },
      { h2: "What happens next" },
      { list: [["This week", "We watch the first bookings come in and fix anything that feels slow."], ["In two weeks", "Your Google Business Profile updates with the new hours and photos."], ["Every month", "A one-page note on what moved and what didn’t."]] },
      { p: "Reply to this email with anything you’d like changed." },
      { sign: "Congratulations," },
    ],
  },

  /* ---------------- billing ---------------- */
  {
    id: "invoice", group: "billing", kind: "branded", name: "Invoice", when: "With every invoice. Attach the PDF too.",
    subject: "Invoice {{invoice_no}} from Fieldwise", preheader: "{{amount}} due by {{due_date}}.", label: "invoice",
    blocks: [
      { h: "Invoice {{invoice_no}}" },
      { p: "Hi {{first_name}}, here’s the invoice for {{invoice_for}}." },
      { kv: [["Invoice", "{{invoice_no}}"], ["Date", "{{invoice_date}}"], ["Due", "{{due_date}}"]] },
      { table: { head: ["Item", "Amount"], rows: [["{{line_1}}", "{{line_1_note}}", "{{line_1_price}}"]], foot: [["Total due", "{{amount}}"]] } },
      { kv: [["UPI", "{{upi_id}}"], ["Bank", "{{bank_name}}"], ["Account name", "Fieldwise"], ["Account no.", "{{account_no}}"], ["IFSC", "{{ifsc}}"]], title: "How to pay" },
      { btn: ["Download the invoice", "{{invoice_link}}"] },
      { p: "Once it’s paid, we’ll send a receipt the same day." },
      { sign: "Thanks," },
    ],
  },
  {
    id: "payment-reminder", group: "billing", kind: "plain", name: "Payment reminder", when: "A few days after the due date. Keep it light.",
    subject: "Re: Invoice {{invoice_no}} from Fieldwise", preheader: "A quick reminder.",
    blocks: [
      { p: "Hi {{first_name}}," },
      { p: "A quick reminder that invoice {{invoice_no}} for {{amount}} was due on {{due_date}}. The payment details are in the original email, and I’ve attached the invoice again." },
      { p: "If it’s already on its way, thank you, and please ignore this." },
      { sign: "Thanks," },
    ],
  },
  {
    id: "payment-received", group: "billing", kind: "branded", name: "Payment received", when: "The day a payment arrives.",
    subject: "Payment received, thank you", preheader: "{{amount}} for invoice {{invoice_no}}.", label: "receipt",
    blocks: [
      { h: "Thank you, we’ve received {{amount}}." },
      { p: "Hi {{first_name}}, this confirms your payment. Keep this email for your records; the PDF receipt is attached." },
      { kv: [["Invoice", "{{invoice_no}}"], ["Amount", "{{amount}}"], ["Paid on", "{{paid_on}}"], ["Method", "{{pay_method}}"], ["Reference", "{{pay_ref}}"]] },
      { note: "<b>Balance:</b> {{balance}}" },
      { sign: "Thanks," },
    ],
  },

  /* ---------------- after launch ---------------- */
  {
    id: "monthly-report", group: "after", kind: "branded", name: "Monthly report", when: "First week of each month, for care-plan clients.",
    subject: "{{company}}: {{month}} report", preheader: "Visits, calls, bookings and where you rank.", banner: "banner-report", label: "{{month}}",
    blocks: [
      { h: "{{month}} at a glance" },
      { p: "Hi {{first_name}}, here’s what moved last month." },
      { metrics: [["{{m1}}", "{{m1_value}}", "{{m1_delta}}"], ["{{m2}}", "{{m2_value}}", "{{m2_delta}}"], ["{{m3}}", "{{m3_value}}", "{{m3_delta}}"], ["{{m4}}", "{{m4_value}}", "{{m4_delta}}"]] },
      { h2: "What we did" },
      { list: ["{{did_1}}", "{{did_2}}", "{{did_3}}"], stone: "stone-1" },
      { h2: "Next month" },
      { list: ["{{plan_1}}", "{{plan_2}}"], stone: "stone-grey" },
      { p: "Questions about any of it? Reply here." },
      { sign: "Thanks," },
    ],
  },
  {
    id: "review-request", group: "after", kind: "branded", name: "Review request", when: "About a month after launch, once they’ve seen results.",
    subject: "A small favour, {{first_name}}", preheader: "Two minutes, and it helps more than you’d think.", banner: "banner-thanks",
    blocks: [
      { h: "Would you leave us a review?" },
      { p: "Hi {{first_name}}, it’s been a month since {{client_site}} went live. If you’re happy with the work, a short Google review helps other business owners find us." },
      { btn: ["Leave a review", "{{review_link}}"] },
      { p: "A line or two is plenty. If something isn’t right, reply to this email instead and we’ll fix it first." },
      { sign: "Thank you," },
    ],
  },
  {
    id: "newsletter", group: "after", kind: "branded", name: "Monthly newsletter", when: "Once a month, to clients and anyone who signed up.",
    subject: "{{month}} notes from Fieldwise", preheader: "One idea, three quick wins, and what we shipped.", banner: "banner-news", label: "{{month}} notes",
    footer: "You&rsquo;re receiving this because you signed up or worked with us. <a href=\"{{unsubscribe_link}}\" style=\"color:#8A918B;\">Unsubscribe</a>",
    blocks: [
      { h: "{{nl_title}}" },
      { p: "For most local businesses, the first thing a new customer sees isn’t the website. It’s the Google profile: photos, hours, reviews and a call button. Plenty of people call straight from there and never open the site." },
      { p: "So the profile deserves the same care as the homepage. Up-to-date photos, the right hours and replies to reviews tell people you’re open, active and worth choosing." },
      { h2: "Three things to do this month" },
      { list: [["Add ten new photos", "Real ones: the place, the team, the work. Skip stock images."], ["Reply to every review", "Thank the good ones, and answer the bad ones calmly and briefly."], ["Check your hours", "Including holidays. Wrong hours are the quickest way to lose a customer."]] },
      { h2: "What we shipped" },
      { list: [["A resort in Indore", "New website, online room booking, and event enquiries that go straight to WhatsApp."], ["OffPay", "11,700+ people used it in its first eight weeks, and two in three found it through Google search."]] },
      { btn: ["Start a project", "mailto:fieldwisesolutions1@gmail.com?subject=New%20project"] },
      { sign: "Until next month," },
    ],
  },
];

module.exports = { groups, sample, templates };
