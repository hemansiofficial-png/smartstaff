import { z } from "zod";

export const BookingSchema = z.object({
  roles: z.array(z.object({
    role: z.enum(["chef", "cook", "helper", "waiter", "cleaner"]),
    subcategory: z.string().default(""),
    count: z.number().int().min(1).max(50),
    dateLabel: z.string().default(""),
    startHour: z.number().min(0).max(23).nullable(),
    endHour: z.number().min(0).max(24).nullable()
  })).min(1),
  dateLabel: z.string().default(""),
  startHour: z.number().min(0).max(23).nullable(),
  endHour: z.number().min(0).max(24).nullable(),
  location: z.string().default(""),
  budgetPerDay: z.number().positive().nullable().default(null),
  notes: z.string().default(""),
  confidence: z.number().min(0).max(1),
  missingFields: z.array(z.string()),
  clarification: z.string().nullable().default(null),
  intent: z.enum(["book", "cancel_and_book", "cancel"]).default("book")
});
export type Booking = z.infer<typeof BookingSchema>;

const rolePatterns: Array<{ pattern: RegExp; role: Booking["roles"][number]["role"]; subcategory: string }> = [
  {pattern:/chinese/i,role:"chef",subcategory:"Chinese Chef"},
  {pattern:/tandoor/i,role:"chef",subcategory:"Tandoor Chef"},
  {pattern:/pastry/i,role:"chef",subcategory:"Pastry Chef"},
  {pattern:/continental/i,role:"chef",subcategory:"Continental Chef"},
  {pattern:/north indian/i,role:"chef",subcategory:"North Indian Chef"},
  {pattern:/deep clean|cleaning crew/i,role:"cleaner",subcategory:"Deep Cleaning"},
  {pattern:/cleaner|cleaning/i,role:"cleaner",subcategory:"Cleaner"},
  {pattern:/waiter/i,role:"waiter",subcategory:"Waiter"},
  {pattern:/helper/i,role:"helper",subcategory:"Helper"},
  {pattern:/cook/i,role:"cook",subcategory:"Cook"},
  {pattern:/chef/i,role:"chef",subcategory:"Chef"}
];

function parseHour(text: string): number | null {
  const s = text.toLowerCase().replace(/\./g,"");
  const match = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3] === "pm") hour += 12;
  return hour;
}
function locationFrom(text: string): string {
  const areas = ["Connaught Place","CP","Rajouri Garden","Pitampura","Karol Bagh","Saket","Lajpat Nagar"];
  for (const area of areas) {
    if (new RegExp(`\\b${area.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&")}\\b`,"i").test(text)) {
      return area.toLowerCase() === "cp" ? "Connaught Place" : area;
    }
  }
  return "";
}
export function parseRequest(input: string): Booking {
  const text = input.trim();
  const lower = text.toLowerCase();
  const roles: Booking["roles"] = [];
  const used = new Set<string>();
  for (const item of rolePatterns) {
    const found = item.pattern.test(text);
    if (!found || used.has(item.subcategory)) continue;
    // Avoid adding a duplicate generic "Chef" when a specific chef subtype was detected.
    if (item.subcategory === "Chef" && roles.some(r => r.role === "chef")) continue;
    // "Deep cleaning" already represents the cleaning subtype; avoid duplicate generic Cleaner.
    if (item.subcategory === "Cleaner" && roles.some(r => r.subcategory === "Deep Cleaning")) continue;
    // Quantity immediately before a role, with default one.
    const escaped = item.pattern.source;
    const before = text.match(new RegExp(`(\\d+)\\s+(?:[\\w-]+\\s+){0,2}${escaped}`, "i"));
    const crewCount = item.subcategory === "Deep Cleaning" ? text.match(/(?:crew|team)\s+of\s+(\d+)/i) : null;
    const count = crewCount ? Number(crewCount[1]) : before ? Number(before[1]) : 1;
    roles.push({role:item.role,subcategory:item.subcategory,count: Number.isFinite(count) ? count : 1,dateLabel:"",startHour:null,endHour:null});
    used.add(item.subcategory);
  }
  const dateLabel = /tomorrow/i.test(text) ? "Tomorrow" :
    /this weekend|weekend/i.test(text) ? "This weekend" :
    /next week/i.test(text) ? "Next week" :
    /sunday/i.test(text) ? "Sunday" :
    /saturday|\bsat\b/i.test(text) ? "Saturday" :
    /friday|\bfri\b/i.test(text) ? "Friday" :
    (text.match(/\b(?:\d{1,2}\s*(?:st|nd|rd|th)?\s*(?:october|november|december|january|february|march|april|may|june|july|august|september)|\d{1,2}\s*(?:to|se)\s*\d{1,2}\s+\w+)\b/i)?.[0] ?? "");
  const hours = [...text.matchAll(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi)].map(m=>parseHour(m[0])).filter((n):n is number=>n!==null);
  let startHour = hours.length ? hours[0] : null;
  let endHour = hours.length > 1 ? hours[1] : null;
  if (/morning/i.test(text) && startHour === null) startHour = 8;
  if (/evening|shaam/i.test(text) && startHour === null) startHour = 18;
  const loc = locationFrom(text);
  const budgetMatch = text.match(/(?:budget|max(?:imum)?|under)\s*(?:₹|rs\.?\s*)?([\d,]+)/i);
  const budgetPerDay = budgetMatch ? Number(budgetMatch[1].replace(/,/g,"")) : null;
  const intent = /cancel/i.test(lower) && /book|instead/i.test(lower) ? "cancel_and_book" : /cancel/i.test(lower) ? "cancel" : "book";
  const missingFields: string[] = [];
  if (!roles.length) missingFields.push("staff role");
  if (!dateLabel) missingFields.push("date");
  if (startHour === null) missingFields.push("start time");
  if (!loc) missingFields.push("location");
  const clarification = missingFields.length ? `Please confirm ${missingFields.join(", ")}.` : null;
  return BookingSchema.parse({
    roles, dateLabel, startHour, endHour, location:loc, budgetPerDay,
    notes: /party/i.test(text) ? "Party/event request" : "",
    confidence: Math.max(0.25, 1 - missingFields.length * 0.16),
    missingFields, clarification, intent
  });
}

export function validateBooking(value: unknown): { success: boolean; errors: string[] } {
  const result = BookingSchema.safeParse(value);
  if (result.success) return {success:true,errors:[]};
  return {success:false,errors:result.error.issues.map(i=>`${i.path.join(".") || "booking"}: ${i.message}`)};
}
