export const TIER1_NICHES = ["Gym","Real Estate","Influencer"];
export const TIER2_NICHES = ["Café","Salon","Clinic","Restaurant","Retail"];
export const STATUS_OPTIONS = ["DM Sent","Trial Sent","Negotiating","Active","Closed","Ghost"];
export const STATUS_COLORS  = {"DM Sent":"#ffcc00","Trial Sent":"#00ff88","Negotiating":"#ff8833","Active":"#00ccff","Closed":"#555","Ghost":"#ff2244"};
export const TIER_COLORS    = {1:"#ffcc00",2:"#4488ff",3:"#888"};
export const DM_TARGET      = 50;

export const SERVICE_TIERS = [
  { id:"basic",   name:"BASIC EDIT",      sarPrice:1200, features:["4 Reels/month","48h delivery","Arabic captions"],                             color:"#4488ff", badge:"ENTRY" },
  { id:"growth",  name:"GROWTH RETAINER", sarPrice:2500, features:["8 Reels/month","Same-day delivery","Arabic + English captions","1 Ad edit"], color:"#00ff88", badge:"POPULAR" },
  { id:"premium", name:"PREMIUM RETAINER",sarPrice:5000, features:["Unlimited Reels","Priority same-day","Full ad package","Monthly strategy call","Dedicated editor"], color:"#ffcc00", badge:"PRO" },
];

export const PHASES = [
  {n:1,focus:"Survival (4–7 Clients)",target:"3k–10k SAR"},
  {n:2,focus:"Scale / Retainers",     target:"10k–30k SAR"},
  {n:3,focus:"Digital Products",      target:"15k–50k SAR"},
  {n:4,focus:"Mini-Agency",           target:"100k SAR"},
];

export const DM_SCRIPTS = {
  arabic:  {label:"Arabic DM",       rtl:true,  script:`السلام عليكم،\n\nشفت محتواكم وعندي فكرة تساعد في زيادة التفاعل على حساباتكم.\n\nأنا متخصص في مونتاج فيديوهات قصيرة للأعمال في السعودية — ريلز، تيك توك، وإعلانات.\n\nبعطيكم ٣ ريلز مجاناً تجربة بدون أي التزام.\n\nيهمكم نجرب؟`},
  english: {label:"English DM",      rtl:false, script:`Hey [Name],\n\nNoticed your content and think I can help you get way more engagement with short-form video.\n\nI'm a video editor specializing in Reels & TikToks for KSA businesses — fast turnaround, Arabic captions included.\n\nI'll edit 3 Reels for FREE, no strings attached.\n\nWorth a quick try?`},
  followup:{label:"Follow-Up (Day 3)",rtl:true,  script:`مرحبا [الاسم]،\n\nبس أتابع معاكم — هل فكرتوا بالموضوع؟\n\nالأوفر لسه موجودة، ٣ ريلز مجاناً.\n\n— [اسمك]`},
  close:   {label:"Trial Close",     rtl:false, script:`Hey [Name],\n\nGlad you liked the trial edits! 🎬\n\nBased on your content volume, I'd suggest the Growth Package:\n• 8 Reels/month • Same-day delivery • Arabic + English captions\n\nInvestment: [X] SAR/month.\n\nWant to lock it in this week?`},
};

export const NON_NEGS = [
  {id:"n1",text:"Reply to ALL messages within 1 hour"},
  {id:"n2",text:"Send 50 DMs (Arabic first)"},
  {id:"n3",text:"Follow up every open lead (3-day rule)"},
  {id:"n4",text:"Deliver all promised edits same-day"},
  {id:"n5",text:"Ask for payment / close 1 deal"},
  {id:"n6",text:"Log every riyal spent today"},
];

export const DEFAULT_TELEMETRY = [
  {id:1,date:"2025-03-02",health:1,dmsSent:50,delivery:1,finLogged:1,finDisc:1,note:""},
  {id:2,date:"2025-03-03",health:1,dmsSent:23,delivery:1,finLogged:1,finDisc:0,note:"Only 23 DMs — distracted"},
];

export const DEFAULT_CLIENTS  = [
  {id:1,name:"Al-Nassr Gym",tier:1,niche:"Gym",status:"Trial Sent",lastContact:"03/02",followUp:"03/04",sar:2500,serviceTier:"growth",notes:"Loves fast edits"},
  {id:2,name:"Jeddah Café", tier:2,niche:"Café",status:"DM Sent",  lastContact:"03/02",followUp:"03/03",sar:1200,serviceTier:"basic", notes:"WhatsApp only"},
];

export const DEFAULT_BUDGET   = [
  {id:1,cat:"Personal",name:"Rent/Utilities",     budget:2000,actual:2000},
  {id:2,cat:"Personal",name:"Groceries (No Apps)",budget:600, actual:430},
  {id:3,cat:"Work",    name:"Adobe/DaVinci/AI",   budget:300, actual:300},
  {id:4,cat:"Work",    name:"Cloud/Storage",      budget:150, actual:120},
];

export const DEFAULT_PROPOSALS = [{id:1,client:"Al-Nassr Gym",value:2500,status:"Sent",date:"03/02",notes:"8 Reels/mo"}];

export const DEFAULT_INVOICES  = [{id:1,client:"Al-Nassr Gym",amount:2500,status:"Pending",issued:"03/02",due:"03/09"}];
