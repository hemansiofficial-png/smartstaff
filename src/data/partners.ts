export type Partner = {
  id: string; name: string; subcategory: string; roles: string[];
  area: string; lat: number; lng: number; availableDays: string[];
  startHour: number; endHour: number; reliability: number; jobsCompleted: number;
};

export const partners: Partner[] = [
 {id:"p01",name:"Aman Kumar",subcategory:"Chinese Chef",roles:["chef"],area:"Connaught Place",lat:28.6315,lng:77.2167,availableDays:["Saturday","Sunday","Friday"],startHour:16,endHour:23,reliability:4.8,jobsCompleted:142},
 {id:"p02",name:"Rohit Verma",subcategory:"Chinese Chef",roles:["chef"],area:"Karol Bagh",lat:28.6514,lng:77.1907,availableDays:["Saturday","Friday"],startHour:17,endHour:23,reliability:4.6,jobsCompleted:96},
 {id:"p03",name:"Sanjay Pal",subcategory:"Tandoor Chef",roles:["chef"],area:"Rajouri Garden",lat:28.6469,lng:77.1225,availableDays:["Saturday","Sunday","Monday"],startHour:10,endHour:18,reliability:4.9,jobsCompleted:211},
 {id:"p04",name:"Vikas Sharma",subcategory:"North Indian Chef",roles:["chef","cook"],area:"Pitampura",lat:28.7033,lng:77.1322,availableDays:["Sunday","Saturday"],startHour:9,endHour:22,reliability:4.5,jobsCompleted:88},
 {id:"p05",name:"Neeraj Singh",subcategory:"Pastry Chef",roles:["chef"],area:"Saket",lat:28.5245,lng:77.2066,availableDays:["Friday","Saturday"],startHour:12,endHour:23,reliability:4.7,jobsCompleted:127},
 {id:"p06",name:"Imran Ali",subcategory:"Helper",roles:["helper"],area:"Connaught Place",lat:28.6330,lng:77.2190,availableDays:["Saturday","Sunday","Friday"],startHour:15,endHour:23,reliability:4.4,jobsCompleted:73},
 {id:"p07",name:"Deepak Yadav",subcategory:"Helper",roles:["helper"],area:"Lajpat Nagar",lat:28.5677,lng:77.2433,availableDays:["Saturday","Sunday"],startHour:14,endHour:22,reliability:4.6,jobsCompleted:81},
 {id:"p08",name:"Karan Mehta",subcategory:"Waiter",roles:["waiter"],area:"Karol Bagh",lat:28.6510,lng:77.1890,availableDays:["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"],startHour:16,endHour:24,reliability:4.8,jobsCompleted:190},
 {id:"p09",name:"Rakesh Kumar",subcategory:"Waiter",roles:["waiter"],area:"Connaught Place",lat:28.6302,lng:77.2171,availableDays:["Saturday","Friday"],startHour:17,endHour:23,reliability:4.3,jobsCompleted:51},
 {id:"p10",name:"Mohan Lal",subcategory:"Deep Cleaning",roles:["cleaner"],area:"Pitampura",lat:28.7040,lng:77.1310,availableDays:["Sunday","Monday","Tuesday"],startHour:6,endHour:14,reliability:4.7,jobsCompleted:134},
 {id:"p11",name:"Arun Das",subcategory:"Deep Cleaning",roles:["cleaner"],area:"Saket",lat:28.5260,lng:77.2080,availableDays:["Sunday","Saturday"],startHour:6,endHour:16,reliability:4.5,jobsCompleted:104},
 {id:"p12",name:"Manish Saini",subcategory:"Deep Cleaning",roles:["cleaner"],area:"Rajouri Garden",lat:28.6475,lng:77.1210,availableDays:["Sunday","Monday"],startHour:7,endHour:15,reliability:4.6,jobsCompleted:117},
 {id:"p13",name:"Pankaj Rao",subcategory:"Continental Chef",roles:["chef","cook"],area:"Lajpat Nagar",lat:28.5682,lng:77.2420,availableDays:["Saturday","Sunday","Friday"],startHour:11,endHour:23,reliability:4.8,jobsCompleted:167},
 {id:"p14",name:"Nitin Bansal",subcategory:"Chinese Chef",roles:["chef"],area:"Saket",lat:28.5250,lng:77.2070,availableDays:["Saturday","Friday"],startHour:15,endHour:23,reliability:4.2,jobsCompleted:45},
 {id:"p15",name:"Salman Khan",subcategory:"Tandoor Chef",roles:["chef"],area:"Karol Bagh",lat:28.6520,lng:77.1910,availableDays:["Saturday","Sunday","Friday"],startHour:10,endHour:20,reliability:4.7,jobsCompleted:153},
 {id:"p16",name:"Ajay Rawat",subcategory:"Cleaner",roles:["cleaner"],area:"Saket",lat:28.5230,lng:77.2050,availableDays:["Sunday","Saturday"],startHour:7,endHour:18,reliability:4.3,jobsCompleted:63},
 {id:"p17",name:"Gaurav Jain",subcategory:"Pastry Chef",roles:["chef"],area:"Connaught Place",lat:28.6320,lng:77.2150,availableDays:["Friday","Saturday"],startHour:13,endHour:23,reliability:4.9,jobsCompleted:230},
 {id:"p18",name:"Suresh Pal",subcategory:"Helper",roles:["helper"],area:"Rajouri Garden",lat:28.6460,lng:77.1230,availableDays:["Saturday","Sunday"],startHour:12,endHour:22,reliability:4.1,jobsCompleted:39},
 {id:"p19",name:"Vivek Anand",subcategory:"North Indian Chef",roles:["chef","cook"],area:"Connaught Place",lat:28.6340,lng:77.2200,availableDays:["Saturday","Sunday"],startHour:16,endHour:23,reliability:4.6,jobsCompleted:112},
 {id:"p20",name:"Harish Rawat",subcategory:"Cleaner",roles:["cleaner"],area:"Lajpat Nagar",lat:28.5688,lng:77.2440,availableDays:["Sunday","Saturday"],startHour:6,endHour:17,reliability:4.5,jobsCompleted:90}
];