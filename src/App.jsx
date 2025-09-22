import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

const SPLIT = [
  { day: 'Monday', muscle: 'Chest + Triceps + Abs', exercises: ['Bench Press','Incline DB Press','Dips','Pushdowns','Overhead DB Extension','Plank','Deadbug','Woodchoppers'] },
  { day: 'Tuesday', muscle: 'Back + Biceps + Abs', exercises: ['Pull-Ups','Barbell Rows','Seated Rows','Barbell Curls','DB Curls','Concentration Curl','Plank','Hanging Leg Raise'] },
  { day: 'Wednesday', muscle: 'Legs + Shoulders + Abs', exercises: ['Squats','RDLs','Lunges','OHP','Lateral Raises','Rear Delt Flys','Hanging Leg Raise','Russian Twists'] },
  { day: 'Thursday', muscle: 'Chest + Triceps + Abs', exercises: ['Incline Bench','Chest Flys','Push-Ups','Skullcrushers','Rope Pushdowns','Dips','Plank'] },
  { day: 'Friday', muscle: 'Rest', exercises: [] },
  { day: 'Saturday', muscle: 'Back + Biceps + Abs', exercises: ['Lat Pulldown','T-Bar Row','DB Row','Incline DB Curl','Hammer Curl','Cable Curl','Decline Crunch','V-Ups','Cable Crunch'] },
  { day: 'Sunday', muscle: 'Legs + Shoulders + Abs', exercises: ['Leg Press','Leg Extension','Ham Curl','Arnold Press','Front Raise','Cable Lateral Raise','Stretch & Mobility','Plank'] }
];

const STORAGE_KEY = 'gympro_logs_v2';
const CUSTOM_ABS_KEY = 'gympro_custom_abs';
function uid(){ return Math.random().toString(36).slice(2,9); }

function groupByExercise(logs){
  const map = {};
  logs.forEach(l=>{
    if(!map[l.exercise]) map[l.exercise]=[];
    map[l.exercise].push(l);
  });
  Object.keys(map).forEach(k=> 
    map[k].sort((a,b)=> new Date(a.date) - new Date(b.date))
  );
  return map;
}

// 🔹 helper: get week number
function getWeekKey(dateStr){
  const d = new Date(dateStr);
  const firstDay = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - firstDay) / 86400000);
  const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
  return `${d.getFullYear()}-${week}`;
}

export default function App(){
  const [logs, setLogs] = useState(()=>{ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): []; }catch(e){return []} });
  const [customAbs, setCustomAbs] = useState(()=>{ try{ const raw = localStorage.getItem(CUSTOM_ABS_KEY); return raw? JSON.parse(raw): []; }catch(e){return []} });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');
  const [addingAbs, setAddingAbs] = useState(false);
  const [newAbsName, setNewAbsName] = useState("");

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);
  useEffect(()=>{ localStorage.setItem(CUSTOM_ABS_KEY, JSON.stringify(customAbs)); },[customAbs]);

  function openDay(day){ 
    setSelectedDay(day); 
    setSelectedExercise(null); 
    setShowPanel(true); 
    setSetsInput([{set:1,reps:8,weight:0}]); 
  }
  function openExercise(ex){ 
    setSelectedExercise(ex); 
    setSetsInput([{set:1,reps:8,weight:0}]); 
  }
  function addSetRow(){ setSetsInput(prev=>[...prev, {set: prev.length+1, reps:8, weight:0}]); }
  function updateSet(idx, field, val){ 
    const copy=[...setsInput]; 
    copy[idx][field]=Number(val) || 0; 
    setSetsInput(copy); 
  }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }

  function saveExercise(){
    if(!selectedExercise) return;
    const newEntries = setsInput.map(s=>({
      id: uid(), date, day: selectedDay || format(parseISO(date),'EEEE'), exercise: selectedExercise,
      set: s.set, reps: Number(s.reps), weight: Number(s.weight)
    }));
    setLogs(prev=>[...prev, ...newEntries].sort((a,b)=> new Date(a.date) - new Date(b.date)));
    setSetsInput([{set:1,reps:8,weight:0}]);
    setSelectedExercise(null);
  }

  function addCustomAbs(){
    if(newAbsName.trim()){
      setCustomAbs(prev=>[...prev,newAbsName.trim()]);
      setNewAbsName("");
      setAddingAbs(false);
    }
  }
  function deleteCustomAbs(name){
    setCustomAbs(prev=> prev.filter(x=>x!==name));
  }

  function deleteLog(id){ setLogs(prev=> prev.filter(l=>l.id!==id)); }

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

  const progressSummary = useMemo(()=>{
    const exs = Object.keys(exerciseMap).length ? Object.keys(exerciseMap) : SPLIT.flatMap(s=>s.exercises);
    return exs.map(ex=>{
      const arr = exerciseMap[ex]||[];
      if(!arr.length) return {exercise:ex, first:null, latest:null, weightDiff:null, repsDiff:null, pctWeight:null, pctReps:null};
      const first = arr[0];
      const latest = arr[arr.length-1];
      const weightDiff = latest.weight - first.weight;
      const repsDiff = latest.reps - first.reps;
      const pctWeight = first.weight? Math.round((weightDiff/first.weight)*100*100)/100 : null;
      const pctReps = first.reps? Math.round((repsDiff/first.reps)*100*100)/100 : null;
      return {exercise:ex, first, latest, weightDiff, repsDiff, pctWeight, pctReps};
    });
  }, [exerciseMap]);

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date: r.date, weight: r.weight, reps: r.reps }));
    const map = {};
    arr.forEach(a=>{
      if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0};
      map[a.date].weightSum += a.weight;
      map[a.date].repsSum += a.reps;
      map[a.date].count +=1;
    });
    return Object.keys(map).sort().map(d=>({ date:d, weight: Math.round((map[d].weightSum/map[d].count)*100)/100, reps: Math.round((map[d].repsSum/map[d].count)*100)/100 }));
  }

  function getSuggestion(ex){
    const arr = exerciseMap[ex]||[];
    if(arr.length < 2) return "No suggestion yet, keep logging!";
    const last = arr[arr.length-1];
    const prev = arr[arr.length-2];
    if(last.reps >= prev.reps && last.weight === prev.weight){
      return "Next time: add +2.5kg";
    } else if(last.weight > prev.weight){
      return "Maintain this weight, solid progress!";
    } else {
      return "Repeat same weight until consistent.";
    }
  }

  const primary = 'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen ${primary} flex flex-col md:flex-row`}>
      {/* Sidebar */}
      <div className="md:w-64 p-4 bg-white shadow-md flex-shrink-0">
        <div className="text-xl font-bold mb-4 text-center">Gym Tracker</div>
        <button onClick={()=>setTab('dashboard')} className={`w-full p-2 mb-2 rounded ${tab==='dashboard'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Dashboard</button>
        <button onClick={()=>setTab('progress')} className={`w-full p-2 mb-2 rounded ${tab==='progress'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Progress</button>
        <button onClick={()=>setTab('weekly')} className={`w-full p-2 mb-2 rounded ${tab==='weekly'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Weekly Strength</button>
        <button onClick={()=>{localStorage.removeItem(STORAGE_KEY); setLogs([]); localStorage.removeItem(CUSTOM_ABS_KEY); setCustomAbs([]);}} className="w-full p-2 mb-2 rounded bg-red-500 text-white">Reset All</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Dashboard */}
        {/* ... (unchanged Dashboard + Progress sections) ... */}

        {/* Weekly Strength */}
        {tab==='weekly' && (
          <div>
            <div className="text-xl font-bold mb-3">Weekly Strength Overview</div>
            {SPLIT.map(day=>{
              const defaultExercises = day.exercises || [];
              const customExercisesLogged = logs
                .filter(log => log.day === day.day && !defaultExercises.includes(log.exercise))
                .map(log => log.exercise);
              const uniqueCustomExercises = [...new Set(customExercisesLogged)];
              const allExercises = [...defaultExercises, ...uniqueCustomExercises];

              return (
                <div key={day.day} className="mb-4 p-3 rounded-xl bg-white shadow">
                  <div className="font-semibold">{day.day} ({day.muscle})</div>
                  {allExercises.map(ex=>{
                    const arr = logs
                      .filter(l=>l.exercise===ex && l.day===day.day)
                      .sort((a,b)=> new Date(a.date) - new Date(b.date));

                    if(!arr.length) return null;

                    // group logs by week
                    const byWeek = {};
                    arr.forEach(l=>{
                      const key = getWeekKey(l.date);
                      if(!byWeek[key]) byWeek[key] = [];
                      byWeek[key].push(l);
                    });

                    const weeks = Object.keys(byWeek).sort();
                    if(weeks.length < 2) {
                      return (
                        <div key={ex} className="text-sm text-gray-500">
                          {ex}: Not enough weekly data yet
                        </div>
                      );
                    }

                    const lastWeek = weeks[weeks.length-2];
                    const thisWeek = weeks[weeks.length-1];

                    const prevEntry = byWeek[lastWeek][byWeek[lastWeek].length-1];
                    const currEntry = byWeek[thisWeek][byWeek[thisWeek].length-1];

                    const pctWeight = prevEntry.weight ? Math.round(((currEntry.weight - prevEntry.weight)/prevEntry.weight)*100*100)/100 : null;
                    const pctReps = prevEntry.reps ? Math.round(((currEntry.reps - prevEntry.reps)/prevEntry.reps)*100*100)/100 : null;

                    return (
                      <div key={ex} className="text-sm text-gray-700">
                        {ex}: {currEntry.weight}kg × {currEntry.reps} reps 
                        ({pctWeight !== null ? `${pctWeight}%` : "New"} in weight, 
                         {pctReps !== null ? `${pctReps}%` : "New"} in reps)
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
