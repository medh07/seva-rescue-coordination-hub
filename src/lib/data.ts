import flood1 from "@/assets/flood-1.jpg";
import flood2 from "@/assets/flood-2.jpg";

export type Priority = "Critical" | "High" | "Medium" | "Low";
export const STEPS = ["Received", "Verified", "Assigned", "En route", "Rescued", "Medical handover"] as const;
export type Step = (typeof STEPS)[number];

export interface Incident {
  id: string; title: string; details: string; people: number; district: string; grid: string;
  lat: number; lng: number; priority: Priority; reportedAt: number; status: Step;
  teamId?: string; img: string; source: "citizen" | "field"; phone?: string; offline?: boolean;
  needs?: string[]; history: { step: Step; at: number; note: string }[];
}
export interface Team { id: string; name: string; type: "Boat" | "Medical" | "NDRF" | "Air"; status: "Available" | "Deployed"; lat: number; lng: number; district: string; }
export interface Shelter { id: string; name: string; district: string; type: string; capacity: number; occupied: number; water: boolean; accessible: boolean; medical: boolean; lat: number; lng: number; updated: string; open: boolean; }
export interface Medical { id: string; name: string; lat: number; lng: number; district: string; kind: "Hospital" | "Field camp"; }
export interface Org { id: string; name: string; location: string; desc: string; tags: string[]; volunteers: number; logo: "leaf" | "wave" | "cross"; lat: number; lng: number; verified: boolean; requested?: boolean; }
export type TaskStatus = "Available" | "Assigned" | "In progress";
export interface Task { id: string; title: string; location: string; ago: string; tag: string; volunteers: number; status: TaskStatus; icon: "meal" | "home" | "box" | "plus"; lat: number; lng: number; }
export interface Resource { id: string; name: string; unit: string; stock: number; category: string; min: number; }
export type DispatchStatus = "Packed" | "In transit" | "Delivered";
export interface Dispatch { id: string; resourceId: string; qty: number; destination: string; vehicle: string; status: DispatchStatus; createdAt: number; }
export type AlertSource = "VERIFIED" | "GOVT" | "UNVERIFIED";
export interface Alert { id: string; text: string; source: AlertSource; time: string; district: string; severity: "info" | "warning" | "danger"; reporter?: string; }
export type Role = "Operations Lead" | "Field Coordinator" | "NGO Partner" | "Citizen";

export const TOWNS: [string, number, number][] = [
  ["Dhubri", 26.02, 89.98], ["Bongaigaon", 26.48, 90.56], ["Goalpara", 26.17, 90.62], ["Barpeta", 26.32, 91.0],
  ["Nalbari", 26.44, 91.44], ["Guwahati", 26.14, 91.74], ["Morigaon", 26.25, 92.34], ["Nagaon", 26.35, 92.68],
  ["Tezpur", 26.63, 92.8], ["Golaghat", 26.52, 93.96], ["Jorhat", 26.75, 94.2], ["Dibrugarh", 27.48, 94.91],
  ["Silchar", 24.83, 92.78], ["Lakhimpur", 27.23, 94.1], ["Sibsagar", 26.98, 94.64],
];
export const DISTRICTS = ["Barpeta", "Bongaigaon", "Darrang", "Dhubri", "Dibrugarh", "Goalpara", "Golaghat", "Jorhat", "Kamrup", "Lakhimpur", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur"];

export const RIVER: [number, number][] = [
  [27.48, 94.9], [27.2, 94.6], [26.9, 94.25], [26.78, 93.95], [26.7, 93.6], [26.62, 93.2], [26.6, 92.8],
  [26.42, 92.3], [26.25, 92.0], [26.19, 91.74], [26.22, 91.3], [26.25, 90.95], [26.2, 90.6], [26.1, 90.25], [26.02, 89.98],
];

const m = (min: number) => Date.now() - min * 60000;

export function seedIncidents(): Incident[] {
  const mk = (i: Omit<Incident, "history" | "reportedAt"> & { ago: number }): Incident => {
    const { ago, ...rest } = i;
    const idx = STEPS.indexOf(rest.status);
    return { ...rest, reportedAt: m(ago), history: STEPS.slice(0, idx + 1).map((s, k) => ({ step: s, at: m(ago - k * 13), note: k === 0 ? "SOS from citizen" : k === 1 ? "Location confirmed" : k === 2 ? "Team assigned" : "Field update" })) };
  };
  return [
    mk({ id: "SOS-024", title: "4 people stranded", details: "Family stranded on rooftop due to rising water levels. Requires immediate evacuation. One member has a medical condition (asthma) — medical support needed at pick-up point.", people: 4, district: "Morigaon", grid: "B4", lat: 26.27, lng: 92.36, priority: "High", ago: 78, status: "Verified", img: flood1, source: "citizen", needs: ["Medical"] }),
    mk({ id: "SOS-025", title: "12 people stranded on rooftop", details: "12 people stranded on rooftop (including 3 children). Water still rising.", people: 12, district: "Golaghat", grid: "A6", lat: 26.6, lng: 93.75, priority: "Critical", ago: 12, status: "Received", img: flood2, source: "citizen", needs: ["Boat", "Food"] }),
    mk({ id: "SOS-023", title: "Marooned families", details: "Boat required for marooned families in low-lying area near the riverbank.", people: 9, district: "Dhubri", grid: "C1", lat: 26.05, lng: 90.05, priority: "Critical", ago: 36, status: "Received", img: flood1, source: "field", needs: ["Boat"] }),
    mk({ id: "SOS-021", title: "Elderly couple trapped", details: "Elderly couple stranded, need medical aid. Ground floor submerged.", people: 2, district: "Nagaon", grid: "C3", lat: 26.38, lng: 92.7, priority: "Medium", ago: 126, status: "Verified", img: flood2, source: "citizen", needs: ["Medical"] }),
    mk({ id: "SOS-020", title: "Village evacuation needed", details: "Water entering village, 40+ people need evacuation.", people: 40, district: "Nagaon", grid: "D5", lat: 26.45, lng: 92.9, priority: "High", ago: 63, status: "Received", img: flood1, source: "field", needs: ["Boat", "Shelter"] }),
    mk({ id: "SOS-017", title: "Family with child", details: "Family with a 2-year-old on raised platform. Food running out.", people: 3, district: "Kamrup (R)", grid: "A5", lat: 26.2, lng: 91.55, priority: "High", ago: 204, status: "Assigned", teamId: "T-02", img: flood2, source: "citizen", needs: ["Food"] }),
    mk({ id: "SOS-015", title: "Child with fever", details: "Child with fever, requires medical team.", people: 1, district: "Barpeta", grid: "B2", lat: 26.33, lng: 91.02, priority: "Medium", ago: 95, status: "Verified", img: flood1, source: "citizen", needs: ["Medical"] }),
    mk({ id: "SOS-013", title: "Isolated village (6 people)", details: "Isolated village, road cut off. Supplies needed.", people: 6, district: "Barpeta", grid: "D2", lat: 26.28, lng: 91.12, priority: "Low", ago: 251, status: "En route", teamId: "T-04", img: flood2, source: "field", needs: ["Food"] }),
    mk({ id: "SOS-009", title: "Fisherman rescued", details: "Two fishermen clinging to a tree, rescued by boat.", people: 2, district: "Jorhat", grid: "A8", lat: 26.82, lng: 94.22, priority: "High", ago: 420, status: "Rescued", teamId: "T-05", img: flood1, source: "field" }),
    mk({ id: "SOS-006", title: "Pregnant woman evacuated", details: "Handed over to Nagaon civil hospital.", people: 1, district: "Nagaon", grid: "E3", lat: 26.33, lng: 92.6, priority: "Critical", ago: 600, status: "Medical handover", teamId: "T-06", img: flood2, source: "citizen" }),
  ];
}

export const seedTeams = (): Team[] => [
  { id: "T-03", name: "Boat Team 03", type: "Boat", status: "Available", lat: 26.5, lng: 92.2, district: "Morigaon" },
  { id: "T-01", name: "NDRF Unit 1", type: "NDRF", status: "Available", lat: 26.18, lng: 91.8, district: "Kamrup" },
  { id: "T-02", name: "Boat Team 02", type: "Boat", status: "Deployed", lat: 26.25, lng: 91.5, district: "Kamrup" },
  { id: "T-04", name: "SDRF Boat 04", type: "Boat", status: "Deployed", lat: 26.3, lng: 91.0, district: "Barpeta" },
  { id: "T-05", name: "Boat Team 05", type: "Boat", status: "Available", lat: 26.8, lng: 94.1, district: "Jorhat" },
  { id: "T-06", name: "Medical Team A", type: "Medical", status: "Available", lat: 26.36, lng: 92.66, district: "Nagaon" },
  { id: "T-07", name: "Medical Team B", type: "Medical", status: "Available", lat: 26.1, lng: 90.3, district: "Dhubri" },
  { id: "T-08", name: "IAF Heli 1", type: "Air", status: "Available", lat: 26.1, lng: 91.6, district: "Kamrup" },
];

export const seedShelters = (): Shelter[] => [
  { id: "S1", name: "North School", district: "Nagaon", type: "School", capacity: 200, occupied: 120, water: true, accessible: true, medical: true, lat: 26.37, lng: 92.69, updated: "14 Oct 2024, 10:30 AM", open: true },
  { id: "S2", name: "Kaliabor College Shelter", district: "Nagaon", type: "College", capacity: 150, occupied: 90, water: true, accessible: true, medical: true, lat: 26.55, lng: 92.98, updated: "14 Oct 2024, 09:15 AM", open: true },
  { id: "S3", name: "Rupahi Community Hall", district: "Nagaon", type: "Community Hall", capacity: 100, occupied: 35, water: true, accessible: false, medical: true, lat: 26.3, lng: 92.45, updated: "14 Oct 2024, 08:40 AM", open: true },
  { id: "S4", name: "Bongaigaon HS School", district: "Bongaigaon", type: "School", capacity: 250, occupied: 210, water: true, accessible: true, medical: false, lat: 26.47, lng: 90.58, updated: "14 Oct 2024, 10:08 AM", open: true },
  { id: "S5", name: "Nalbari Relief Camp", district: "Nalbari", type: "Relief Camp", capacity: 300, occupied: 300, water: true, accessible: false, medical: true, lat: 26.45, lng: 91.42, updated: "14 Oct 2024, 09:50 AM", open: false },
  { id: "S6", name: "Dibrugarh Town Hall", district: "Dibrugarh", type: "Community Hall", capacity: 180, occupied: 60, water: true, accessible: true, medical: false, lat: 27.47, lng: 94.93, updated: "14 Oct 2024, 07:30 AM", open: true },
  { id: "S7", name: "Jorhat Girls School", district: "Jorhat", type: "School", capacity: 160, occupied: 72, water: false, accessible: true, medical: true, lat: 26.76, lng: 94.18, updated: "14 Oct 2024, 08:10 AM", open: true },
  { id: "S8", name: "Goalpara Stadium Camp", district: "Goalpara", type: "Relief Camp", capacity: 400, occupied: 180, water: true, accessible: true, medical: true, lat: 26.16, lng: 90.64, updated: "14 Oct 2024, 09:00 AM", open: true },
  { id: "S9", name: "Tezpur Univ. Hostel", district: "Sonitpur", type: "College", capacity: 220, occupied: 95, water: true, accessible: true, medical: false, lat: 26.7, lng: 92.83, updated: "14 Oct 2024, 08:00 AM", open: true },
];

export const MEDICAL: Medical[] = [
  { id: "M1", name: "Nagaon Civil Hospital", lat: 26.34, lng: 92.67, district: "Nagaon", kind: "Hospital" },
  { id: "M2", name: "GMCH Guwahati", lat: 26.16, lng: 91.77, district: "Kamrup", kind: "Hospital" },
  { id: "M3", name: "Assam Medical College", lat: 27.46, lng: 94.88, district: "Dibrugarh", kind: "Hospital" },
  { id: "M4", name: "Barpeta Field Camp", lat: 26.33, lng: 91.0, district: "Barpeta", kind: "Field camp" },
  { id: "M5", name: "Jorhat Medical College", lat: 26.73, lng: 94.22, district: "Jorhat", kind: "Hospital" },
  { id: "M6", name: "Silchar Medical College", lat: 24.8, lng: 92.8, district: "Cachar", kind: "Hospital" },
];

export const seedOrgs = (): Org[] => [
  { id: "O1", name: "Community Relief Network", location: "Guwahati, Assam", desc: "Grassroots network providing food, shelter and emergency supplies across flood-affected districts.", tags: ["Food Distribution", "Relief Supplies", "Community Support"], volunteers: 12, logo: "leaf", lat: 26.14, lng: 91.74, verified: true },
  { id: "O2", name: "River Support Collective", location: "Dibrugarh, Assam", desc: "Volunteer group focused on riverine rescue, boat support and stranded community assistance.", tags: ["Boat Operations", "Rescue Support", "Logistics"], volunteers: 18, logo: "wave", lat: 27.48, lng: 94.91, verified: true },
  { id: "O3", name: "Seva Medical Volunteers", location: "Jorhat, Assam", desc: "Medical professionals and trained volunteers providing on-ground healthcare and first aid.", tags: ["Medical Aid", "First Response", "Health Camps"], volunteers: 24, logo: "cross", lat: 26.75, lng: 94.2, verified: true },
  { id: "O4", name: "Brahmaputra Youth Forum", location: "Tezpur, Assam", desc: "Youth volunteers for shelter setup and supply packing.", tags: ["Shelter Support", "Logistics"], volunteers: 30, logo: "leaf", lat: 26.63, lng: 92.8, verified: true },
  { id: "O5", name: "Lower Assam Aid Trust", location: "Dhubri, Assam", desc: "Community kitchens and relief kits for lower Assam.", tags: ["Food Distribution"], volunteers: 9, logo: "wave", lat: 26.02, lng: 89.98, verified: true },
];

export const seedTasks = (): Task[] => [
  { id: "K1", title: "Meal distribution", location: "Kamrup, Assam", ago: "2 hrs ago", tag: "Food Distribution", volunteers: 10, status: "Available", icon: "meal", lat: 26.3, lng: 91.6 },
  { id: "K2", title: "Shelter support setup", location: "Nagaon, Assam", ago: "4 hrs ago", tag: "Shelter Setup", volunteers: 8, status: "Available", icon: "home", lat: 26.35, lng: 92.68 },
  { id: "K3", title: "Relief supply packing", location: "Guwahati, Assam", ago: "6 hrs ago", tag: "Logistics", volunteers: 6, status: "Available", icon: "box", lat: 26.14, lng: 91.74 },
  { id: "K4", title: "Water purification drive", location: "Barpeta, Assam", ago: "1 hr ago", tag: "Medical Aid", volunteers: 4, status: "Available", icon: "plus", lat: 26.32, lng: 91.0 },
  { id: "K5", title: "Boat fuel transport", location: "Morigaon, Assam", ago: "30 min ago", tag: "Logistics", volunteers: 3, status: "Available", icon: "box", lat: 26.25, lng: 92.34 },
  { id: "K6", title: "Cooked meal delivery", location: "Morigaon, Assam", ago: "1 hr ago", tag: "Food Distribution", volunteers: 5, status: "Assigned", icon: "meal", lat: 26.25, lng: 92.4 },
  { id: "K7", title: "Evacuation centre support", location: "Darrang, Assam", ago: "2 hrs ago", tag: "Shelter Support", volunteers: 8, status: "Assigned", icon: "home", lat: 26.45, lng: 92.03 },
  { id: "K8", title: "Medical camp assistance", location: "Tezpur, Assam", ago: "3 hrs ago", tag: "Medical Aid", volunteers: 6, status: "Assigned", icon: "plus", lat: 26.63, lng: 92.8 },
  { id: "K9", title: "Child-friendly space", location: "Goalpara, Assam", ago: "3 hrs ago", tag: "Community Support", volunteers: 4, status: "Assigned", icon: "home", lat: 26.17, lng: 90.62 },
  { id: "K10", title: "Shelter setup at school", location: "Lakhimpur, Assam", ago: "Started 1 hr ago", tag: "Shelter Support", volunteers: 12, status: "In progress", icon: "home", lat: 27.23, lng: 94.1 },
  { id: "K11", title: "Relief kit distribution", location: "Dibrugarh, Assam", ago: "Started 2 hrs ago", tag: "Relief Supplies", volunteers: 10, status: "In progress", icon: "box", lat: 27.48, lng: 94.91 },
  { id: "K12", title: "Community kitchen support", location: "Sivasagar, Assam", ago: "Started 3 hrs ago", tag: "Food Distribution", volunteers: 8, status: "In progress", icon: "meal", lat: 26.98, lng: 94.64 },
];

export const seedResources = (): Resource[] => [
  { id: "R1", name: "Food packets", unit: "packets", stock: 4200, category: "Food", min: 1000 },
  { id: "R2", name: "Drinking water", unit: "litres", stock: 18000, category: "Water", min: 5000 },
  { id: "R3", name: "Medical kits", unit: "kits", stock: 340, category: "Medical", min: 150 },
  { id: "R4", name: "Life jackets", unit: "units", stock: 210, category: "Rescue", min: 100 },
  { id: "R5", name: "Tarpaulin sheets", unit: "sheets", stock: 90, category: "Shelter", min: 120 },
  { id: "R6", name: "Rescue boats", unit: "boats", stock: 14, category: "Rescue", min: 5 },
  { id: "R7", name: "ORS sachets", unit: "sachets", stock: 6000, category: "Medical", min: 2000 },
  { id: "R8", name: "Blankets", unit: "units", stock: 760, category: "Shelter", min: 300 },
];

export const seedDispatches = (): Dispatch[] => [
  { id: "D-118", resourceId: "R1", qty: 800, destination: "North School, Nagaon", vehicle: "Truck AS-01-4421", status: "In transit", createdAt: m(55) },
  { id: "D-117", resourceId: "R3", qty: 40, destination: "Barpeta Field Camp", vehicle: "Van AS-15-1102", status: "In transit", createdAt: m(90) },
  { id: "D-116", resourceId: "R2", qty: 3000, destination: "Goalpara Stadium Camp", vehicle: "Tanker AS-18-0077", status: "Delivered", createdAt: m(240) },
  { id: "D-115", resourceId: "R4", qty: 60, destination: "Boat Team 03, Morigaon", vehicle: "Pickup AS-02-9921", status: "Packed", createdAt: m(15) },
];

export const seedAlerts = (): Alert[] => [
  { id: "A1", text: "Relief camp operational at Bongaigaon Higher Secondary School.", source: "VERIFIED", time: "10:08 AM", district: "Bongaigaon", severity: "info" },
  { id: "A2", text: "Water level rising in Dhubri. Avoid non-essential travel.", source: "GOVT", time: "09:46 AM", district: "Dhubri", severity: "warning" },
  { id: "A3", text: "NH-27 partially closed near Nagaon due to waterlogging.", source: "VERIFIED", time: "09:20 AM", district: "Nagaon", severity: "warning" },
  { id: "A4", text: "Assam State Disaster Management issues orange alert for next 24 hours.", source: "GOVT", time: "08:55 AM", district: "All", severity: "danger" },
  { id: "A5", text: "Embankment breach reported near Majuli ghat — awaiting confirmation.", source: "UNVERIFIED", time: "08:41 AM", district: "Jorhat", severity: "danger", reporter: "Citizen report" },
  { id: "A6", text: "Free medical camp at Kaliabor College today 9 AM – 5 PM.", source: "VERIFIED", time: "08:15 AM", district: "Nagaon", severity: "info" },
  { id: "A7", text: "Message forwarded: 'Dam gates opened, evacuate now' — source unknown.", source: "UNVERIFIED", time: "07:58 AM", district: "Kamrup", severity: "warning", reporter: "WhatsApp forward" },
];

/* Risk grid: 6 rows (A-F) x 8 cols over Morigaon–Nagaon–Tezpur */
export const GRID_BOUNDS = { north: 26.9, south: 26.05, west: 92.0, east: 93.4 };
export type Risk = "Critical" | "High" | "Medium" | "Low" | "None";
export interface Cell { id: string; row: number; col: number; risk: Risk; population: number; depth: string; sos: number; damage: number; access: "Open" | "Limited" | "Blocked"; issue: string; updated: string; source: string; confidence: "High" | "Moderate" | "Low"; }
const R: Record<string, Risk> = { A2: "Medium", B2: "High", B3: "High", B4: "Critical", B5: "High", B6: "High", B7: "High", C2: "Critical", C3: "High", C4: "Medium", C5: "High", C6: "Medium", D3: "Medium", D5: "High", D6: "Critical", A1: "Low", A3: "Low", A4: "Low", A5: "Low", A6: "Low", A7: "Low", B1: "Low", B8: "Low", C1: "Low", D1: "Low", D2: "Low", D4: "Low" };
export function seedCells(): Cell[] {
  const cells: Cell[] = [];
  "ABCDEF".split("").forEach((r, ri) => {
    for (let c = 1; c <= 8; c++) {
      const id = `${r}${c}`;
      const risk = R[id] ?? "None";
      const seed = (ri * 8 + c) * 37;
      const pop = risk === "Critical" ? 520 + (seed % 200) : risk === "High" ? 300 + (seed % 180) : risk === "Medium" ? 180 + (seed % 140) : risk === "Low" ? 60 + (seed % 90) : 0;
      cells.push({
        id, row: ri, col: c - 1, risk, population: id === "B4" ? 640 : id === "C3" ? 420 : id === "A2" ? 310 : pop,
        depth: risk === "Critical" ? "2–4 m" : risk === "High" ? "1–2 m" : risk === "Medium" ? "0.5–1 m" : risk === "Low" ? "< 0.5 m" : "Unknown",
        sos: id === "B4" ? 7 : id === "C3" ? 4 : id === "A2" ? 2 : risk === "Critical" ? 5 : risk === "High" ? 3 : risk === "Medium" ? 1 : 0,
        damage: risk === "Critical" ? 12 : risk === "High" ? 6 : risk === "Medium" ? 2 : 0,
        access: id === "B4" ? "Blocked" : risk === "Critical" || risk === "High" ? "Limited" : "Open",
        issue: id === "B4" ? "Bridge blockage, high flood depth" : id === "C3" ? "Inundation, limited access" : id === "A2" ? "Rising water levels" : risk === "Critical" ? "Severe inundation" : risk === "High" ? "Inundation, road damage" : risk === "Medium" ? "Waterlogging" : "No major issue",
        updated: id === "B4" ? "18 Jun 2024 14:20" : id === "C3" ? "18 Jun 2024 12:10" : "18 Jun 2024 11:45",
        source: id === "A2" ? "Satellite + Citizen Reports" : id === "C3" ? "Satellite Analysis" : "Satellite + Field Reports",
        confidence: risk === "Critical" || risk === "High" ? "Moderate" : risk === "None" ? "Low" : "High",
      });
    }
  });
  return cells;
}
