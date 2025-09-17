import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subDays, isAfter } from 'date-fns';

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
  Object.keys(map).forEach(k=> map[k].sort((a,b)=> a.date > b.date ? 1 : -1));
  return map;
}

// ---- Suggestion logic ----
function getNextSuggestion(latest) {
  if (!latest) return null;
  if (latest.reps >= 10) {
    return `Next time: Add +2.5kg (you managed ${latest.reps} reps at ${latest.weight}kg)`;
  }
  if (latest.reps <= 6) {
    return `Next time: Keep same weight, push for more reps (only ${latest.reps} reps done)`;
  }
  return `Next time: Maintain weight, target 8–10 reps`;
}

// ---- Monthly growth ----
function getMonthlyGrowth(logs, exercise) {
  const today = new Date();
  const monthAgo = subDays(today, 30);
  const arr = logs.filter(l => l.exercise === exercise && isAfter(parseISO(l.date), monthAgo));
  if (arr.length < 2) return null;
  const first = arr[0];
  const last = arr[arr.length - 1];
  const weightPct = first.weight ? Math.round(((last.weight - first.weight) / first.weight) * 100) : 0;
  const repsPct = first.reps ? Math.round(((last.reps - first.reps) / first.reps) * 100) : 0;
  return { weightPct, repsPct };
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
  function updateSet(idx, field, val){ const copy=[...setsInput]; copy[idx][field]=val; setSetsInput(copy); }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }

  function saveExercise(){
    if(!selectedExercise) return;
    const newEntries = setsInput.map(s=>({
      id: uid(), date, day: selectedDay || format(parseISO(date),'EEEE'), exercise: selectedExercise,
      set: s.set, reps: Number(s.reps), weight: Number(s.weight)
    }));
    setLogs(prev=>[...prev, ...newEntries].sort((a,b)=> a.date > b.date ? 1 : -1));
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
        {tab==='dashboard' && (
          <div className="space-y-4">
            <div className="text-xl font-bold">Select a Day</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SPLIT.map(d=>(
                <button key={d.day} onClick={()=>openDay(d.day)} className="p-4 rounded-xl shadow bg-white text-left">
                  <div className="font-semibold">{d.day}</div>
                  <div className="text-xs text-gray-500">{d.muscle}</div>
                </button>
              ))}
            </div>
            {/* same dashboard code as original ... */}
          </div>
        )}

        {/* Progress */}
        {tab==='progress' && (
          <div className="space-y-6">
            <div className="text-xl font-bold">Progress Summary</div>
            <div className="grid gap-3">
              {progressSummary.map(item=>{
                const monthly = getMonthlyGrowth(logs, item.exercise);
                const suggestion = getNextSuggestion(item.latest);
                return (
                <div key={item.exercise} className="p-3 rounded-xl bg-white shadow overflow-x-auto">
                  <div className="font-semibold mb-1">{item.exercise}</div>
                  {item.first && item.latest ? (
                    <>
                      <div className="text-sm text-gray-500">First: {item.first.weight}kg × {item.first.reps} reps</div>
                      <div className="text-sm text-gray-500">Latest: {item.latest.weight}kg × {item.latest.reps} reps</div>
                      <div className="text-sm">Weight Change: {item.weightDiff}kg ({item.pctWeight || 0}%)</div>
                      <div className="text-sm">Reps Change: {item.repsDiff} reps ({item.pctReps || 0}%)</div>
                      {monthly && <div className="text-sm text-blue-600">30d Growth → Weight: {monthly.weightPct}% | Reps: {monthly.repsPct}%</div>}
                      {suggestion && <div className="text-sm text-green-600 font-medium">💡 {suggestion}</div>}

                      {/* Edit/Delete logs */}
                      <div className="mt-2 space-y-1">
                        {logs.filter(l=>l.exercise===item.exercise).map(l=>(
                          <div key={l.id} className="flex items-center gap-2 text-sm">
                            <div>{l.date} - Set {l.set}: {l.weight}kg × {l.reps} reps</div>
                            <button onClick={()=>deleteLog(l.id)} className="text-red-500">✕</button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400">No logs yet</div>
                  )}
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartDataForExercise(item.exercise)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#6366F1" />
                      <Line type="monotone" dataKey="reps" stroke="#EC4899" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* Weekly Strength (same as original) */}
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
                    const arr = logs.filter(l=>l.exercise===ex && l.day===day.day);
                    if(!arr.length) return null;
                    const first = arr[0];
                    const last = arr[arr.length-1];
                    const pctWeight = first.weight ? Math.round(((last.weight - first.weight)/first.weight)*100*100)/100 : null;
                    const pctReps = first.reps ? Math.round(((last.reps - first.reps)/first.reps)*100*100)/100 : null;
                    return (
                      <div key={ex} className="text-sm text-gray-700">
                        {ex}: {last.weight}kg × {last.reps} reps ({pctWeight? pctWeight+'% ↑':'New'}, {pctReps? pctReps+'% ↑':'New'})
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
