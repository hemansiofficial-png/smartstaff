import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { requireOptionalNativeModule } from "expo";
import type { ExpoSpeechRecognitionModuleType } from "expo-speech-recognition/build/ExpoSpeechRecognitionModule.types";
import { parseRequest, Booking } from "./src/lib/booking";
import { scorePartners, RankedPartner } from "./src/lib/matching";
import { partners } from "./src/data/partners";
import { testRequests } from "./src/data/testRequests";

const speechRecognition= requireOptionalNativeModule<ExpoSpeechRecognitionModuleType>("ExpoSpeechRecognition");

type RequestRecord = { id:string; text:string; booking:Booking; status:"Draft"|"Confirmed"; partner?:string };
const examples = ["Need 2 Chinese chefs and 1 helper for Saturday 6 PM to 11 PM, Connaught Place area.","Need someone for tomorrow evening.","Cancel my last request and book a pastry chef instead for Friday."];

export default function App() {
 const [prompt,setPrompt]=useState("");
 const [booking,setBooking]=useState<Booking|null>(null);
 const [requestText,setRequestText]=useState("");
 const [step,setStep]=useState<"home"|"review"|"matches"|"requests">("home");
 const [records,setRecords]=useState<RequestRecord[]>([]);
 const [selected,setSelected]=useState<RankedPartner|null>(null);
 const [showTests,setShowTests]=useState(false);
 const [isListening,setIsListening]=useState(false);
 const voiceBase=useRef("");
 const [editedLocation,setEditedLocation]=useState("");
 const [editedDate,setEditedDate]=useState("");
 const [editedStart,setEditedStart]=useState("");
 const [editedEnd,setEditedEnd]=useState("");
 const [editedRoles,setEditedRoles]=useState("");
 const [aiMode,setAiMode]=useState<"demo"|"api">("demo");

 useEffect(()=>{
   if(!speechRecognition)return;
   const subscriptions=[
     speechRecognition.addListener("start",()=>setIsListening(true)),
     speechRecognition.addListener("end",()=>setIsListening(false)),
     speechRecognition.addListener("result",event=>{
       const transcript=event.results[0]?.transcript;
       if(!transcript)return;
       const base=voiceBase.current;
       setPrompt(`${base}${base&&!/\s$/.test(base)?" ":""}${transcript}`);
     }),
     speechRecognition.addListener("error",event=>{
       setIsListening(false);
       Alert.alert("Voice input error",event.message||event.error);
     })
   ];
   return ()=>subscriptions.forEach(subscription=>subscription.remove());
 },[]);

 const ranked=useMemo(()=>booking ? scorePartners(booking,partners) : [],[booking]);
 const startVoiceInput=async()=>{
   if(!speechRecognition){
     Alert.alert("Voice input needs a development build","Expo Go does not include speech recognition. Use your keyboard's microphone to dictate text, or run this app in a development build to test the Speak request button.");
     return;
   }
   voiceBase.current=prompt.trim();
   try {
     const permission=await speechRecognition.requestPermissionsAsync();
     if(!permission.granted){Alert.alert("Permission needed","Allow microphone and speech-recognition access to dictate your request.");return;}
     setIsListening(true);
     speechRecognition.start({lang:"en-IN",interimResults:true,continuous:false});
   } catch(error) {
     setIsListening(false);
     Alert.alert("Voice input unavailable",error instanceof Error?error.message:"Could not start speech recognition.");
   }
 };
 const parse=()=> {
   if(!prompt.trim()){Alert.alert("Add a request","Describe the staff you need first.");return;}
   const parsed=parseRequest(prompt);
   setBooking(parsed);setRequestText(prompt);
   setEditedLocation(parsed.location);setEditedDate(parsed.dateLabel);
   setEditedStart(parsed.startHour===null?"":String(parsed.startHour));
   setEditedEnd(parsed.endHour===null?"":String(parsed.endHour));
   setEditedRoles(parsed.roles.map(r=>`${r.count} × ${r.subcategory}`).join(", "));
   setStep("review");
 };
 const saveReview=()=>{
   if(!booking)return;
   const start=editedStart===""?null:Number(editedStart), end=editedEnd===""?null:Number(editedEnd);
   if((start!==null && (start<0||start>23))||(end!==null&&(end<0||end>24))){Alert.alert("Check time","Enter hours using 0–23 for start and 0–24 for end.");return;}
   const updated={...booking,location:editedLocation,dateLabel:editedDate,startHour:start,endHour:end,
     missingFields:[...(!booking.roles.length?["staff role"]:[]),...(!editedDate?["date"]:[]),...(start===null?["start time"]:[]),...(!editedLocation?["location"]:[])],
     clarification:null};
   if(updated.missingFields.length){Alert.alert("One more detail needed",`Please complete: ${updated.missingFields.join(", ")}.`);setBooking(updated);return;}
   setBooking(updated);setStep("matches");
 };
 const confirm=()=>{
   if(!booking||!selected)return;
   const record:RequestRecord={id:String(Date.now()),text:requestText,booking,status:"Confirmed",partner:selected.partner.name};
   setRecords(old=>[record,...old]);setStep("requests");setSelected(null);
   Alert.alert("Request confirmed",`${selected.partner.name} has been selected in this demo. No real notification was sent.`);
 };
 const startNew=()=>{setPrompt("");setBooking(null);setSelected(null);setStep("home");};
 const field=(label:string,value:string,onChangeText:(v:string)=>void,placeholder:string)=> <View style={s.field} key={label}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA4B2" style={s.input}/></View>;
 const button=(label:string,onPress:()=>void,secondary=false)=><Pressable onPress={onPress} style={[s.button,secondary&&s.secondary]}><Text style={[s.buttonText,secondary&&s.secondaryText]}>{label}</Text></Pressable>;
 const header=<View style={s.header}><View style={s.brandMark}><Text style={s.brandMarkText}>S</Text></View><View><Text style={s.brand}>Smart Staff</Text><Text style={s.subbrand}>On-demand restaurant staffing</Text></View><View style={s.demoPill}><Text style={s.demoText}>DEMO</Text></View></View>;
 return <SafeAreaView style={s.safe}><StatusBar style="dark"/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>{header}
 <View style={s.nav}>{(["home","requests"] as const).map(tab=><Pressable key={tab} onPress={()=>setStep(tab)} style={[s.navItem,step===tab&&s.navActive]}><Text style={[s.navText,step===tab&&s.navTextActive]}>{tab==="home"?"New request":`My requests${records.length?` (${records.length})`:""}`}</Text></Pressable>)}</View>
 <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
 {step==="home"&&<><View style={s.hero}><Text style={s.eyebrow}>STAFFING, SIMPLIFIED</Text><Text style={s.heroTitle}>Who do you need{"\n"}for your next shift?</Text><Text style={s.body}>Describe the role, time and location. We'll structure the request and find suitable available partners.</Text></View>
 <View style={s.card}><Text style={s.sectionTitle}>Describe your requirement</Text><TextInput multiline value={prompt} onChangeText={setPrompt} placeholder="e.g. Need 2 Chinese chefs for Saturday, 6 PM–11 PM, Connaught Place" placeholderTextColor="#9AA4B2" style={s.promptInput}/><View style={v.voiceRow}><Pressable accessibilityRole="button" accessibilityLabel={isListening?"Stop voice input":"Start voice input"} onPress={isListening?()=>speechRecognition?.stop():startVoiceInput} style={[v.voiceButton,isListening&&v.voiceButtonActive]}><Text style={[v.voiceButtonText,isListening&&v.voiceButtonTextActive]}>{isListening?"■ Stop listening":"🎙 Speak request"}</Text></Pressable><Text style={v.voiceStatus}>{isListening?"Listening…":speechRecognition?"Dictate or type; you can edit the transcript.":"Expo Go: use your keyboard microphone to dictate here."}</Text></View><Text style={s.helper}>Plain English or Hinglish works. Missing details will be flagged for review.</Text>{button("Understand request  →",parse)}<Text style={s.label}>TRY AN EXAMPLE</Text>{examples.map(ex=><Pressable key={ex} onPress={()=>setPrompt(ex)} style={s.example}><Text style={s.exampleText}>{ex}</Text><Text style={s.chevron}>↗</Text></Pressable>)}</View>
 <Pressable onPress={()=>setShowTests(!showTests)} style={s.testToggle}><Text style={s.link}>{showTests?"Hide":"Show"} all 10 assignment test prompts</Text></Pressable>{showTests&&<View style={s.card}>{testRequests.map((t,i)=><Pressable key={t} onPress={()=>setPrompt(t)} style={s.testRow}><Text style={s.testNumber}>{String(i+1).padStart(2,"0")}</Text><Text style={s.testText}>{t}</Text></Pressable>)}</View>}
 <View style={s.note}><Text style={s.noteTitle}>Demo mode</Text><Text style={s.noteText}>This build uses a deterministic local parser so it runs without API credentials. It is not an LLM integration and should be upgraded before production use.</Text></View></>}
 {step==="review"&&booking&&<><Text style={s.eyebrow}>STEP 2 OF 3</Text><Text style={s.pageTitle}>Review your request</Text><Text style={s.body}>Check every detail before we look for partners. Fields that need attention are marked.</Text>
 <View style={s.statusCard}><Text style={s.statusTitle}>{booking.missingFields.length?"A few details need attention":"Ready for review"}</Text><Text style={s.statusBody}>{booking.missingFields.length?`Missing or uncertain: ${booking.missingFields.join(", ")}.`:"We found the key details. Please verify before continuing."}</Text></View>
 <View style={s.card}>{field("Staff required",editedRoles,v=>{setEditedRoles(v);setBooking({...booking,confidence:booking.confidence});},"e.g. 2 × Chinese Chef, 1 × Helper")}{field("Date or date range",editedDate,setEditedDate,"e.g. Saturday, 25 October")}{field("Start hour (24-hour format)",editedStart,setEditedStart,"e.g. 18")}{field("End hour (24-hour format)",editedEnd,setEditedEnd,"e.g. 23")}{field("Location",editedLocation,setEditedLocation,"e.g. Connaught Place")}
 {booking.budgetPerDay!==null&&<View style={s.budgetChip}><Text style={s.budgetText}>Budget detected: ₹{booking.budgetPerDay.toLocaleString("en-IN")}/day</Text></View>}
 {booking.intent==="cancel_and_book"&&<View style={s.warning}><Text style={s.warningText}>Cancellation intent detected. This demo does not actually cancel an existing request. Confirm the new booking separately.</Text></View>}
 <Text style={s.helper}>The role text is editable, but this prototype does not re-parse edits to role names. Verify role and quantity carefully.</Text>{button("Find matching partners  →",saveReview,true)}{button("Back",()=>setStep("home"),true)}</View></>}
 {step==="matches"&&booking&&<><Text style={s.eyebrow}>STEP 3 OF 3</Text><Text style={s.pageTitle}>Best-fit partners</Text><Text style={s.body}>Ranked using skill fit (40%), distance (20%), availability (25%) and reliability (15%). Explanations are derived from the scoring components.</Text><View style={s.requestSummary}><Text style={s.summaryTitle}>{booking.roles.map(r=>`${r.count} × ${r.subcategory}`).join(", ")}</Text><Text style={s.summaryMeta}>{booking.dateLabel} · {booking.startHour!==null?`${booking.startHour}:00`:"Time TBD"}{booking.endHour!==null?`–${booking.endHour}:00`:""} · {booking.location}</Text></View>
 {ranked.length===0?<View style={s.card}><Text style={s.sectionTitle}>No exact available matches</Text><Text style={s.body}>Try a different date or time, or change the role/location. We won't recommend unavailable partners.</Text></View>:ranked.map((r,i)=><Pressable key={r.partner.id} onPress={()=>setSelected(r)} style={[s.partnerCard,selected?.partner.id===r.partner.id&&s.partnerSelected]}><View style={s.partnerTop}><View style={s.avatar}><Text style={s.avatarText}>{r.partner.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</Text></View><View style={{flex:1}}><Text style={s.partnerName}>{r.partner.name}</Text><Text style={s.partnerRole}>{r.partner.subcategory} · {r.partner.area}</Text></View><View style={s.scoreBadge}><Text style={s.scoreText}>{r.score}</Text><Text style={s.scoreCaption}>MATCH</Text></View></View><Text style={s.explanation}>{i===0?"★ TOP MATCH · ":""}{r.explanation}</Text>{selected?.partner.id===r.partner.id&&<Text style={s.selectedText}>Selected for this request</Text>}</Pressable>)}
 {ranked.length>0&&button(selected?"Confirm selected partner":"Select a partner to continue",selected?confirm:()=>Alert.alert("Select a partner","Tap a partner card first."),!selected)}{button("Edit request",()=>setStep("review"),true)}</>}
 {step==="requests"&&<><Text style={s.eyebrow}>YOUR ACTIVITY</Text><Text style={s.pageTitle}>My requests</Text><Text style={s.body}>Track the requests you've confirmed in this session.</Text>{records.length===0?<View style={s.card}><Text style={s.sectionTitle}>No requests yet</Text><Text style={s.body}>Your confirmed bookings will appear here.</Text>{button("Create a request",startNew)}</View>:records.map(r=><View key={r.id} style={s.card}><View style={s.recordHeader}><Text style={s.sectionTitle}>{r.booking.roles.map(x=>`${x.count} × ${x.subcategory}`).join(", ")}</Text><Text style={s.confirmed}>CONFIRMED</Text></View><Text style={s.body}>{r.booking.dateLabel} · {r.booking.location}</Text><Text style={s.recordPartner}>Partner: {r.partner}</Text><Text style={s.helper}>Original request: {r.text}</Text></View>)}{button("+ New request",startNew)}</>}
 <Text style={s.footer}>SMART STAFF · OWNER FLOW PROTOTYPE</Text></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#FFF8F3"},header:{paddingHorizontal:20,paddingTop:12,paddingBottom:14,flexDirection:"row",alignItems:"center",gap:10},brandMark:{width:40,height:40,borderRadius:14,backgroundColor:"#F15A24",alignItems:"center",justifyContent:"center"},brandMarkText:{fontSize:21,fontWeight:"800",color:"#fff"},brand:{fontSize:18,fontWeight:"800",color:"#20262E"},subbrand:{fontSize:11,color:"#7D7772",marginTop:2},demoPill:{marginLeft:"auto",backgroundColor:"#FFF0E7",paddingHorizontal:9,paddingVertical:5,borderRadius:8},demoText:{fontSize:10,fontWeight:"800",color:"#F15A24",letterSpacing:1},nav:{flexDirection:"row",marginHorizontal:20,backgroundColor:"#F5E9E0",borderRadius:12,padding:4},navItem:{flex:1,padding:10,borderRadius:9,alignItems:"center"},navActive:{backgroundColor:"#fff",elevation:1},navText:{fontSize:13,color:"#778195",fontWeight:"600"},navTextActive:{color:"#20262E"},content:{padding:20,paddingBottom:44},hero:{paddingTop:12,paddingBottom:22},eyebrow:{fontSize:10,fontWeight:"800",color:"#E85B2A",letterSpacing:1.8,marginBottom:10},heroTitle:{fontSize:32,lineHeight:38,fontWeight:"800",color:"#20262E",letterSpacing:-.8},pageTitle:{fontSize:28,fontWeight:"800",color:"#20262E",marginBottom:8},body:{fontSize:13,lineHeight:20,color:"#756F6A",marginBottom:14},card:{backgroundColor:"#fff",borderRadius:20,padding:17,marginBottom:14,borderWidth:1,borderColor:"#F0E4DB"},sectionTitle:{fontSize:16,fontWeight:"800",color:"#292D32",marginBottom:12},promptInput:{minHeight:116,textAlignVertical:"top",backgroundColor:"#FFFBF8",borderWidth:1,borderColor:"#EADBD0",borderRadius:13,padding:13,fontSize:14,color:"#292D32",lineHeight:21},helper:{fontSize:11,lineHeight:17,color:"#8B817A",marginTop:8,marginBottom:13},button:{backgroundColor:"#F15A24",borderRadius:13,paddingVertical:15,paddingHorizontal:14,alignItems:"center",marginTop:5,marginBottom:8},buttonText:{fontSize:14,fontWeight:"800",color:"#fff"},secondary:{backgroundColor:"#fff",borderWidth:1,borderColor:"#E8D9CF"},secondaryText:{color:"#45403C"},label:{fontSize:11,fontWeight:"800",color:"#7D7067",letterSpacing:1,marginTop:13,marginBottom:8},example:{flexDirection:"row",alignItems:"center",paddingVertical:12,borderTopWidth:1,borderTopColor:"#F3E8E0"},exampleText:{flex:1,fontSize:12,lineHeight:18,color:"#504944"},chevron:{fontSize:17,color:"#9A8D84",paddingLeft:8},testToggle:{alignItems:"center",padding:12},link:{fontSize:12,fontWeight:"700",color:"#D94A1E"},testRow:{flexDirection:"row",gap:10,paddingVertical:11,borderBottomWidth:1,borderBottomColor:"#F3E8E0"},testNumber:{fontSize:11,fontWeight:"800",color:"#5167D8",width:24},testText:{flex:1,fontSize:12,lineHeight:18,color:"#504944"},note:{backgroundColor:"#FFF0E7",borderRadius:14,padding:14,marginTop:5},noteTitle:{fontWeight:"800",fontSize:12,color:"#B9401B",marginBottom:4},noteText:{fontSize:12,lineHeight:18,color:"#75645A"},field:{marginBottom:13},input:{borderWidth:1,borderColor:"#E8D9CF",backgroundColor:"#FAFBFD",borderRadius:11,paddingHorizontal:12,paddingVertical:12,fontSize:14,color:"#292D32"},statusCard:{backgroundColor:"#FFF4E5",borderWidth:1,borderColor:"#F3D5B8",padding:14,borderRadius:14,marginBottom:14},statusTitle:{fontWeight:"800",fontSize:14,color:"#80502B",marginBottom:4},statusBody:{fontSize:12,lineHeight:18,color:"#886647"},budgetChip:{backgroundColor:"#ECF8F1",padding:10,borderRadius:10,marginBottom:12},budgetText:{color:"#167449",fontSize:12,fontWeight:"700"},warning:{backgroundColor:"#FFF0F0",padding:12,borderRadius:10,marginBottom:12},warningText:{color:"#9B3535",fontSize:12,lineHeight:18},requestSummary:{backgroundColor:"#FFF0E7",padding:14,borderRadius:14,marginBottom:12},summaryTitle:{fontWeight:"800",fontSize:14,color:"#B9401B",marginBottom:5},summaryMeta:{fontSize:12,color:"#8C5945"},partnerCard:{backgroundColor:"#fff",borderWidth:1,borderColor:"#F0E4DB",borderRadius:17,padding:14,marginBottom:10},partnerSelected:{borderColor:"#F15A24",backgroundColor:"#FFF5EF"},partnerTop:{flexDirection:"row",alignItems:"center",gap:10},avatar:{width:42,height:42,borderRadius:14,backgroundColor:"#FFE6D9",alignItems:"center",justifyContent:"center"},avatarText:{fontWeight:"800",fontSize:13,color:"#D94A1E"},partnerName:{fontWeight:"800",fontSize:14,color:"#292D32"},partnerRole:{fontSize:11,color:"#82776F",marginTop:3},scoreBadge:{backgroundColor:"#E8F7EF",borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:"center"},scoreText:{fontWeight:"900",fontSize:17,color:"#15734A"},scoreCaption:{fontSize:8,fontWeight:"800",color:"#15734A",letterSpacing:1},explanation:{fontSize:11,lineHeight:17,color:"#68758B",marginTop:12},selectedText:{fontSize:11,fontWeight:"800",color:"#D94A1E",marginTop:7},recordHeader:{flexDirection:"row",justifyContent:"space-between",gap:8,alignItems:"flex-start"},confirmed:{fontSize:9,fontWeight:"900",color:"#16804E",backgroundColor:"#E8F7EF",padding:6,borderRadius:6,overflow:"hidden"},recordPartner:{fontSize:13,fontWeight:"700",color:"#45403C",marginBottom:8},footer:{textAlign:"center",fontSize:9,color:"#B1A39A",letterSpacing:1.5,marginTop:18}
});
const v=StyleSheet.create({
 voiceRow:{flexDirection:"row",alignItems:"center",gap:10,marginTop:10},
 voiceButton:{backgroundColor:"#FFF0E7",borderWidth:1,borderColor:"#F3D0BE",borderRadius:10,paddingHorizontal:13,paddingVertical:10},
 voiceButtonActive:{backgroundColor:"#F15A24",borderColor:"#F15A24"},
 voiceButtonText:{fontSize:12,fontWeight:"800",color:"#B9401B"},
 voiceButtonTextActive:{color:"#fff"},
 voiceStatus:{flex:1,fontSize:11,lineHeight:16,color:"#8B817A"}
});