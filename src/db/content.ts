import type { Article, DonationLink, NavigationLink, Page, Product, Video } from "./schema";

// Bootstrap seed data only. Runtime content must be read from Turso through src/db/queries.ts.
// Do not import this module from app routes or components.

type Seed<T> = Omit<T, "id" | "createdAt" | "updatedAt">;
type SeedDonation = Omit<DonationLink, "id" | "createdAt" | "updatedAt">;
type SeedNav = Omit<NavigationLink, "id">;

export const medicalDisclaimer =
  "The content on this site is for educational and informational purposes only and is not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health decisions.";

export const financialDisclaimer =
  "This content is for educational purposes only and is not legal, tax, financial, or insurance advice.";

export const affiliateDisclosure =
  "Some links may be affiliate links. If you purchase through them, the site may receive compensation at no extra cost to you.";

export const seedSettings = [
  { key: "patient_flow_url", value: "https://patientflowwebsites.com" },
  { key: "site_email", value: "hello@example.com" },
  { key: "disclaimer_medical", value: medicalDisclaimer },
  { key: "disclaimer_financial", value: financialDisclaimer },
  { key: "disclaimer_affiliate", value: affiliateDisclosure },
  {
    key: "disclaimer_general",
    value: "External resources are provided for education and context. Inclusion does not imply endorsement of every claim or viewpoint."
  }
];

export const seedNavigation: SeedNav[] = [
  { label: "Home", href: "/", external: false, sortOrder: 0, active: true },
  { label: "My Story", href: "/my-story", external: false, sortOrder: 1, active: true },
  { label: "Videos", href: "/videos", external: false, sortOrder: 2, active: true },
  { label: "Articles", href: "/articles", external: false, sortOrder: 3, active: true },
  { label: "Products", href: "/products", external: false, sortOrder: 4, active: true },
  { label: "Donations", href: "/donations", external: false, sortOrder: 5, active: true },
  { label: "Intake", href: "/intake", external: false, sortOrder: 6, active: true },
  { label: "Contact", href: "/contact", external: false, sortOrder: 7, active: true }
];

export const seedPages: Seed<Page>[] = [
  {
    slug: "my-story",
    title: "A Story Told From the Path",
    subtitle: "Marcus Ellis gathers personal story, reflective questions, and resources for people navigating difficult choices.",
    body: "This page is a personal narrative space. It is not a set of instructions, a protocol, or medical advice. The story invites visitors to listen carefully, ask better questions, and work with qualified professionals when health decisions are involved.",
    heroImage: "/STUDIO%201%20Marcus_E-19%20COWBOY%20%281%29.jpg",
    metaTitle: "My Story | Marcus Ellis",
    metaDescription: "A cinematic personal story page with videos, timeline moments, and careful next steps."
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    subtitle: "How this site handles contact, intake, analytics, and consent.",
    body: "This site collects only the information visitors choose to submit through forms. Intake and contact forms are intentionally limited and should not be used for detailed medical history, diagnosis, medication lists, or urgent needs. Analytics scripts are loaded only after consent when tracking IDs are configured.",
    heroImage: "/IncomingPictures%20005.jpg",
    metaTitle: "Privacy Policy | Marcus Ellis",
    metaDescription: "Privacy policy for Marcus Ellis's educational resource website."
  }
];

export const seedArticles: Seed<Article>[] = [
  {
    slug: "viatical-settlements-questions",
    title: "Viatical Settlements: Questions to Ask Before You Sign",
    subtitle: "A careful educational overview inspired by common questions around life insurance, illness, and financial pressure.",
    author: "Marcus Ellis Editorial",
    category: "External Resources",
    body: "Viatical settlements can be complex and emotionally charged. Before acting, visitors should speak with qualified legal, tax, financial, and insurance professionals. This placeholder article is designed to frame questions: What are the long-term consequences? Who is advising you? What alternatives exist? What fees, tax implications, privacy concerns, or eligibility limits apply?",
    heroImage: "/IncomingPictures%20005.jpg",
    externalSourceUrl: "https://thetruthaboutcancer.com/",
    disclaimerType: "financial",
    publishedAt: "2026-01-15",
    featured: true
  },
  {
    slug: "the-path-less-traveled",
    title: "The Path Less Traveled: Making Space for Better Questions",
    subtitle: "A reflective article on courage, uncertainty, and the discipline of seeking grounded information.",
    author: "Marcus Ellis",
    category: "Healing Stories",
    body: "The path metaphor is not about rejecting help. It is about slowing down enough to ask meaningful questions, listen to experience, and invite wise counsel. This article offers reflective prompts for people looking for clarity without sensational claims.",
    heroImage: "/IncomingPictures%20005.jpg",
    externalSourceUrl: null,
    disclaimerType: "medical",
    publishedAt: "2026-01-22",
    featured: true
  },
  {
    slug: "research-links-with-discernment",
    title: "How to Approach Research Links With Discernment",
    subtitle: "A practical guide to reading interviews, articles, and health-related resources without outsourcing your judgment.",
    author: "Marcus Ellis Editorial",
    category: "Research Links",
    body: "A link is a starting point, not a conclusion. Visitors should consider source quality, conflicts of interest, date of publication, medical consensus, and the advice of qualified clinicians. This library is curated as educational material and personal research, not as treatment guidance.",
    heroImage: "/STUDIO%201%20Marcus_E-20%20COWBOY%202%20BEST.jpg",
    externalSourceUrl: null,
    disclaimerType: "medical",
    publishedAt: "2026-02-02",
    featured: false
  },
  {
    slug: "renewal-and-flow",
    title: "Renewal and Flow: Notes From Moving Water",
    subtitle: "A short meditation on clarity, cleansing, and next right steps.",
    author: "Marcus Ellis",
    category: "Healing Stories",
    body: "The Iceland water motif represents movement without panic. This piece pairs reflective writing with a reminder that health, legal, and financial decisions deserve qualified support and patient review.",
    heroImage: "/IncomingPictures%20005.jpg",
    externalSourceUrl: null,
    disclaimerType: "medical",
    publishedAt: "2026-02-14",
    featured: false
  }
];

export const seedVideos: Seed<Video>[] = [
  {
    slug: "my-story-ttac",
    title: "My Story from the TTAC Convention",
    description: "A personal story video presented as a starting point for reflection, not medical instruction.",
    category: "My Story",
    speaker: "Marcus Ellis",
    sourceName: "TTAC Convention",
    externalUrl: "https://example.com/replace-my-story",
    embedUrl: null,
    thumbnailImage: "/_GP_6081.jpg",
    backdropImage: "/IncomingPictures%20005.jpg",
    disclaimerType: "medical",
    featured: true,
    sortOrder: 0
  },
  {
    slug: "red-pill-expo",
    title: "Red Pill Expo Conversation",
    description: "An external talk link for visitors who want to explore wider interviews and viewpoints.",
    category: "Red Pill Expo",
    speaker: "Guest speaker",
    sourceName: "Red Pill Expo",
    externalUrl: "https://example.com/replace-red-pill",
    embedUrl: null,
    thumbnailImage: "/STUDIO%201%20Marcus_E-20%20COWBOY%202%20BEST.jpg",
    backdropImage: "/Cowboy%20Aqua%20at%20home.jpg",
    disclaimerType: "medical",
    featured: true,
    sortOrder: 1
  },
  {
    slug: "the-healing-web",
    title: "The Healing Web",
    description: "A favored interview or presentation collected for educational exploration.",
    category: "Healing Web",
    speaker: "External presenter",
    sourceName: "External video",
    externalUrl: "https://example.com/replace-healing-web",
    embedUrl: null,
    thumbnailImage: "/IncomingPictures%20005.jpg",
    backdropImage: "/IncomingPictures%20005.jpg",
    disclaimerType: "medical",
    featured: true,
    sortOrder: 2
  },
  {
    slug: "keyboard-lecture",
    title: "Thirty-Minute Keyboard Lecture",
    description: "An atmospheric musical backdrop and lecture link that adds warmth and humanity to the collection.",
    category: "Music / Keyboard",
    speaker: "Marcus Ellis",
    sourceName: "Keyboard performance",
    externalUrl: "https://example.com/replace-keyboard",
    embedUrl: null,
    thumbnailImage: "/Pix%20up%20close%20blonde%20guy%21.jpg",
    backdropImage: "/Pix%20up%20close%20blonde%20guy%21.jpg",
    disclaimerType: "general",
    featured: false,
    sortOrder: 3
  },
  {
    slug: "dr-peter-mccullough-interview",
    title: "Dr. Peter McCullough Interview",
    description: "A doctor/researcher video listed as an external educational interview for visitors to evaluate carefully.",
    category: "Featured Doctors / Researchers",
    speaker: "Dr. Peter McCullough",
    sourceName: "External interview",
    externalUrl: "https://example.com/replace-mccullough",
    embedUrl: null,
    thumbnailImage: "/IncomingPictures%20005.jpg",
    backdropImage: "/IncomingPictures%20005.jpg",
    disclaimerType: "medical",
    featured: false,
    sortOrder: 4
  }
];

export const seedProducts: Seed<Product>[] = [
  {
    slug: "b17-research-links",
    name: "B17 Research Links",
    category: "B17",
    description: "A cautious collection of external educational links for personal research and discussion with qualified professionals.",
    externalUrl: "https://example.com/replace-b17",
    image: "/STUDIO%201%20Marcus_E-20%20COWBOY%202%20BEST.jpg",
    affiliate: false,
    disclaimer: medicalDisclaimer,
    featured: true,
    sortOrder: 0
  },
  {
    slug: "b15-educational-resource",
    name: "B15 Educational Resource",
    category: "B15",
    description: "An informational resource link. No product listed here should be read as a medical recommendation.",
    externalUrl: "https://example.com/replace-b15",
    image: "/IncomingPictures%20005.jpg",
    affiliate: true,
    disclaimer: affiliateDisclosure,
    featured: false,
    sortOrder: 1
  },
  {
    slug: "pancreatic-support-reading",
    name: "Pancreatic Support Reading List",
    category: "Pancreatic support resources",
    description: "Books, interviews, and external articles visitors may use as discussion starters with licensed clinicians.",
    externalUrl: "https://example.com/replace-pancreatic",
    image: "/IncomingPictures%20005.jpg",
    affiliate: false,
    disclaimer: medicalDisclaimer,
    featured: true,
    sortOrder: 2
  },
  {
    slug: "chlorine-dioxide-information",
    name: "Chlorine Dioxide Information Links",
    category: "Chlorine dioxide resources",
    description: "Neutral external information links for careful review. This site does not make health claims about chlorine dioxide.",
    externalUrl: "https://example.com/replace-cd",
    image: "/Cowboy%20Aqua%20at%20home.jpg",
    affiliate: false,
    disclaimer: medicalDisclaimer,
    featured: false,
    sortOrder: 3
  }
];

export const seedDonationLinks: SeedDonation[] = [
  {
    label: "Support the Resource Library",
    provider: "Stripe Payment Link",
    url: "https://example.com/replace-stripe",
    description: "Helps maintain the video library, article collection, hosting, and careful editorial work.",
    active: true,
    sortOrder: 0
  },
  {
    label: "Make a One-Time Gift",
    provider: "PayPal",
    url: "https://example.com/replace-paypal",
    description: "A simple external donation link. Replace this with the client-approved provider URL.",
    active: true,
    sortOrder: 1
  }
];
