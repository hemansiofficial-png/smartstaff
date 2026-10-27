import { parseRequest, validateBooking } from "../src/lib/booking";
import { scorePartners } from "../src/lib/matching";
import { partners } from "../src/data/partners";

describe("required regression tests",()=>{
  it("validates parsed booking output and rejects invalid quantities",()=>{
    const parsed=parseRequest("Need 2 Chinese chefs Saturday 6 PM to 11 PM, Connaught Place");
    expect(validateBooking(parsed).success).toBe(true);
    expect(validateBooking({...parsed,roles:[{...parsed.roles[0],count:0}]}).success).toBe(false);
  });
  it("ranks available partners in descending order with component-based explanations",()=>{
    const booking=parseRequest("Need a Chinese chef Saturday 6 PM to 11 PM, Connaught Place");
    const ranked=scorePartners(booking,partners);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.length).toBeLessThanOrEqual(5);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[ranked.length-1].score);
    expect(ranked[0].explanation).toContain("reliability");
    expect(ranked[0].components.skill).toBe(1);
  });
});
