// Minimal string table. Structured so `hi` and `mr` dictionaries can be added
// later without touching any screen: add the key set and switch `lang`.
export type Lang = "en" | "hi" | "mr";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

const en = {
  appName: "DhatuSetu",
  tagline: "Collector to authorised recycler",
  chooseLanguage: "Choose language",
  start: "Start",
  home: "Home",
  createLot: "Create Lot",
  priceBoard: "Price Board",
  findBuyers: "Find Buyers",
  myKhata: "My Khata",
  safety: "Safety",
  online: "Online",
  offline: "Offline",
  totalEarnings: "Total earnings",
  paid: "Paid",
  pending: "Pending",
  latest: "Latest",

  // Role entry
  iAmCollector: "I am a Collector",
  iAmRecycler: "I am a Recycler",
  chooseRole: "Choose your role",
  signIn: "Sign in",
  signUp: "Create account",
  signOut: "Sign out",
  email: "Email",
  password: "Password",

  // Recycler
  recycler: "Recycler",
  recyclerHome: "Recycler Home",
  availableLots: "Available Lots",
  myOffers: "My Offers",
  activePickups: "Active Pickups",
  transactions: "Transactions",
  myFacility: "My Facility",
  verification: "Verification",
  newLotRequests: "New lot requests",
  activeLots: "Active lots",
  acceptedLots: "Accepted lots",
  completedTransactions: "Completed transactions",
  totalMaterialReceived: "Total material received",
  pendingPayments: "Pending payments",
  submitOffer: "Submit Offer",
  offeredRate: "Offered rate per kg",
  estimatedTotal: "Estimated total",
  pickupAvailable: "Pickup available",
  pickupDateTime: "Pickup date & time",
  note: "Note",
  finalWeight: "Final weight",
  finalPrice: "Final price",
  handover: "Handover",
  payment: "Payment",
  registrationRequired: "Registration Required",
  demoData: "Demo / Prototype Data",
} as const;

export type StringKey = keyof typeof en;

const dictionaries: Record<Lang, Record<StringKey, string>> = {
  en,
  hi: en,
  mr: en,
};

export function t(key: StringKey, lang: Lang = "en") {
  return dictionaries[lang][key];
}
