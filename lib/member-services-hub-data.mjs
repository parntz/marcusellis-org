/** Curated “mega” sections for /member-services — URLs align with primary nav + benefits hub. */

export const HUB_INSTRUMENT_INSURANCE_PDF =
  "/_downloaded/sites/default/files/Media%20Root/HUBInstrumentInsurance2024.pdf";

export const TTCU_SERVICES_PDF =
  "/_downloaded/sites/default/files/Media%20Root/300210%20TTCU%20Look%20Services_MAIN.pdf";

export const MEMBER_SERVICES_MEGA_SECTIONS = [
  {
    id: "sound-healthcare",
    kicker: "Healthcare & financial wellness",
    title: "Sound Healthcare & Financial",
    body: [
      "Programs built around the realities of freelance and gig work: coverage questions, planning, and support that speaks musician—not corporate HR boilerplate.",
      "If you are sorting health options or need a steady hand on long-term money questions, start here and use the resources Sound Healthcare puts in one place.",
    ],
    primary: { label: "Open Sound Healthcare", href: "http://soundhealthcare.org", external: true },
  },
  {
    id: "ttcu",
    kicker: "Banking built for members",
    title: "The Tennessee Credit Union",
    body: [
      "Credit union services are a practical union benefit: competitive rates, member-owned structure, and products that fit everyday money moves between tours, sessions, and slow weeks.",
      "Review the current services overview (PDF) to see what is available and how to connect as a member.",
    ],
    primary: { label: "Download TTCU services overview (PDF)", href: TTCU_SERVICES_PDF, external: true },
  },
  {
    id: "afm-pension",
    kicker: "Retirement from covered work",
    title: "AFM Pension Info",
    body: [
      "The AFM-EP Fund is a major piece of long-term security for musicians who earn covered contributions. Eligibility, vesting, and plan details all live on the official fund site.",
      "Whether you are new to the fund or catching up after years on the road, the pension portal is the authoritative source for forms and plan communication.",
    ],
    primary: { label: "Visit AFM-EP Fund", href: "https://www.afm-epf.org", external: true },
  },
  {
    id: "rehearsal-hall",
    kicker: "On-site at Local 257",
    title: "Free Rehearsal Hall",
    body: [
      "The Cooper Rehearsal Hall is free for current Local 257 members: a real room with stage, lighting, P.A., and hours that match working bands—not a closet with a folding chair.",
      "Book time, see what is included, and plan your next rehearsal without renting a strip-mall unit by the hour.",
    ],
    primary: { label: "Rehearsal hall details & booking", href: "/free-rehearsal-hall", external: false },
  },
  {
    id: "instrument-insurance",
    kicker: "Coverage for your livelihood",
    title: "Instrument Insurance",
    body: [
      "Your instruments and rigs are how you pay rent. Local 257 routes members toward instrument and equipment coverage, liability options, and related plans that match real stage and studio risk.",
      "The benefits hub gathers the full insurance picture in one place—so you are not hunting PDFs across three different menus.",
    ],
    primary: { label: "Insurance & benefits overview", href: "/benefits-union-members", external: false },
    secondary: { label: "HUB instrument insurance PDF", href: HUB_INSTRUMENT_INSURANCE_PDF, external: true },
  },
  {
    id: "hub-insurance",
    kicker: "Carrier overview",
    title: "HUB Insurance",
    body: [
      "HUB’s instrument program is the document many members hand to their accountant or spouse when someone asks, “Is the rig actually covered?”",
      "Download the current overview for coverage highlights, then loop back to the benefits page if you want the full menu of union-access plans.",
    ],
    primary: { label: "Open HUB instrument insurance (PDF)", href: HUB_INSTRUMENT_INSURANCE_PDF, external: true },
    secondary: { label: "Full benefits & insurance hub", href: "/benefits-union-members", external: false },
  },
  {
    id: "other-discounts",
    kicker: "Local 257 extras",
    title: "Other AFM 257 Discounts",
    body: [
      "Beyond the headline programs, the union stacks member-only savings and partner offers—think everyday costs, not just a single coupon code.",
      "The benefits hub is the index for what is active, how to redeem, and what requires a quick call to the hall.",
    ],
    primary: { label: "Browse discounts on the benefits hub", href: "/benefits-union-members", external: false },
    secondary: { label: "Union Plus perks & savings", href: "/union-plus-program", external: false },
  },
  {
    id: "union-plus",
    kicker: "National union member perks",
    title: "Union Plus Program",
    body: [
      "Union Plus extends the relationship past the gig: legal help, travel, retail savings, and programs designed for union households.",
      "It is one of the easiest ways to remind folks why card-carrying membership matters on a Tuesday afternoon—not only on the picket line.",
    ],
    primary: { label: "Explore Union Plus", href: "/union-plus-program", external: false },
  },
  {
    id: "member-site-links",
    kicker: "Tools & member web presence",
    title: "Member Site Links",
    body: [
      "A curated directory of member sites, tools, and practical bookmarks—sorted for browsing when you need a player, a teacher, or inspiration from peers who keep their pages current.",
      "If you maintain a public site as a 257 member, this is where the local points the wider world.",
    ],
    primary: { label: "Open the member links directory", href: "/member-site-links", external: false },
  },
];
