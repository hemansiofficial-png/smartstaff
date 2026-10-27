import { Partner } from "../data/partners";
import { Booking } from "./booking";

export type RankedPartner = { partner: Partner; score: number; explanation: string; components: { skill:number; distance:number; availability:number; reliability:number } };
const coords: Record<string,{lat:number;lng:number}> = {
 "Connaught Place":{lat:28.6315,lng:77.2167},"Rajouri Garden":{lat:28.6469,lng:77.1225},
 "Pitampura":{lat:28.7033,lng:77.1322},"Karol Bagh":{lat:28.6514,lng:77.1907},
 "Saket":{lat:28.5245,lng:77.2066},"Lajpat Nagar":{lat:28.5677,lng:77.2433}
};
export function distanceKm(a:{lat:number;lng:number},b:{lat:number;lng:number}):number {
 const rad=(n:number)=>n*Math.PI/180;
 const dLat=rad(b.lat-a.lat), dLng=rad(b.lng-a.lng);
 const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
export function scorePartners(booking: Booking, partners: Partner[], dayOverride?: string): RankedPartner[] {
 const role = booking.roles[0];
 if (!role) return [];
 const day = dayOverride || booking.dateLabel;
 const origin = coords[booking.location] || coords["Connaught Place"];
 return partners.map(partner=>{
   const exact = partner.subcategory.toLowerCase() === role.subcategory.toLowerCase();
   const roleFit = partner.roles.includes(role.role);
   const skill = exact ? 1 : roleFit ? 0.58 : 0;
   const km = distanceKm(origin,{lat:partner.lat,lng:partner.lng});
   const distance = Math.max(0,1-km/15);
   const dayMatch = !day || /tomorrow|weekend|next week/i.test(day) || partner.availableDays.some(d=>day.toLowerCase().includes(d.toLowerCase()));
   const timeMatch = booking.startHour === null || (partner.startHour <= booking.startHour && partner.endHour >= (booking.endHour ?? booking.startHour+1));
   const availability = dayMatch && timeMatch ? 1 : 0;
   const reliability = partner.reliability/5;
   const total = skill*0.4 + distance*0.2 + availability*0.25 + reliability*0.15;
   const explanation = `${exact?"Exact skill match":roleFit?"Related role":"Role mismatch"} · ${km.toFixed(1)} km away · ${availability?"Available for requested window":"Availability needs checking"} · ${partner.reliability.toFixed(1)}/5 reliability`;
   return {partner,score:Math.round(total*100),explanation,components:{skill,distance,availability,reliability}};
 }).filter(x=>x.components.skill>0 && x.components.availability>0).sort((a,b)=>b.score-a.score).slice(0,5);
}