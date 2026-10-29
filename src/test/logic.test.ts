import { describe, expect, it } from "vitest";
import { assignTeam, createDispatch } from "@/lib/logic";
import { seedIncidents, seedTeams, seedResources, seedDispatches } from "@/lib/data";

describe("rescue rules", () => {
  it("assigning a team marks incident Assigned and team Deployed", () => {
    const r = assignTeam(seedIncidents(), seedTeams(), "SOS-025", "T-03");
    expect(r.incidents.find((i) => i.id === "SOS-025")!.status).toBe("Assigned");
    expect(r.teams.find((t) => t.id === "T-03")!.status).toBe("Deployed");
  });
  it("cannot assign a deployed team", () => {
    expect(() => assignTeam(seedIncidents(), seedTeams(), "SOS-025", "T-02")).toThrow();
  });
  it("dispatch cannot exceed stock", () => {
    expect(() => createDispatch(seedResources(), seedDispatches(), "R6", 15, "X", "")).toThrow();
    const r = createDispatch(seedResources(), seedDispatches(), "R6", 4, "X", "");
    expect(r.resources.find((x) => x.id === "R6")!.stock).toBe(10);
  });
});
