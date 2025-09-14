import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subDays, startOfMonth, isAfter } from 'date-fns';

const SPLIT = [
  { day: 'Monday', muscle: 'Chest + Triceps + Abs', exercises: ['Bench Press','Incline DB Press','Dips','Pushdowns','Overhead DB Extension','Plank','Deadbug','Woodchoppers'] },
  { day: 'Tuesday', muscle: 'Back + Biceps', exercises: ['Pull-Ups','Barbell Rows','Seated Rows','Barbell Curls','DB Curls','Concentration Curl'] },
  { day: 'Wednesday', muscle: 'Legs + Shoulders', exercises: ['Squats','RDLs','Lunges','OHP','Lateral Raises','Rear Delt Flys','Hanging Leg Raise','Russian Twists'] },
  { day: 'Thursday', muscle: 'Chest + Triceps', exercises: ['Incline Bench','Chest Flys','Push-Ups','Skullcrushers','Rope Pushdowns','Dips'] },
  { day: 'Friday', muscle: 'Rest', exercises: [] },
  { day: 'Saturday', muscle: 'Back + Biceps', exercises: ['Lat Pulldown','T-Bar Row','DB Row','Incline DB Curl','Hammer Curl','Cable Curl','Decline Crunch','V-Ups','Cable Crunch'] },
  { day: 'Sunday', muscle: 'Legs + Shoulders', exercises: ['Leg Press','Leg Extension','Ham Curl','Arnold Press','Front Raise','Cable Lateral Raise','Stretch & Mobility'] }
];

const STORAGE_KEY = 'gympro_logs_v2';

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

export default function App(){
  const [logs, setLogs] = useState(()=> {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): []; } catch(e){ return []; }
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showWeeklyDay, setShowWeeklyDay] = useState(null);

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);

  function openDay(day){ 
    setSelectedDay(day); setSelectedExercise(null); setShowPanel(true); 
    setSetsInput([{set:1,reps:8,weight:0}]); 
  }

  function openExercise(ex){ setSelectedExercise(ex); setSetsInput([{set:1,reps:8,weight:0}]); }

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

  function resetLogs(){ if(window.confirm("Are you sure you want to reset all progress?")) setLogs([]); }

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

  // first entry per exercise
  const firstPerExercise = useMemo(()=> {
    const out = {}; Object.keys(exerciseMap).forEach(ex=>{
      const arr = exerciseMap[ex]; if(arr.length){ const first = arr[0]; out[ex] = {date:first.date, reps:first.reps, weight:first.weight}; }
    }); return out;
  }, [exerciseMap]);

  function averageInRange(ex, startDate){
    const arr = (exerciseMap[ex]||[]).filter(r=> isAfter(parseISO(r.date), subDays(parseISO(startDate),1)) || r.date===startDate );
    if(!arr.length) return {avgReps:0, avgWeight:0, count:0};
    const reps = arr.reduce((s,r)=>s + r.reps,0)/arr.length;
    const weight = arr.reduce((s,r)=>s + r.weight,0)/arr.length;
    return {avgReps: Math.round(reps*100)/100, avgWeight: Math.round(weight*100)/100, count: arr.length};
  }

  const day14Start = format(subDays(new Date(),13),'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()),'yyyy-MM-dd');

  const progressSummary = useMemo(()=>{
    const exs = Object.keys(exerciseMap).length ? Object.keys(exerciseMap) : SPLIT.flatMap(s=>s.exercises);
    return exs.map(ex=>{
      const first = firstPerExercise[ex] || null;
      const avg14 = averageInRange(ex, day14Start);
      const avgMonth = averageInRange(ex, monthStart);
      const weightFirst = first? first.weight : 0; const repsFirst = first? first.reps : 0;
      const weight14 = avg14.avgWeight; const reps14 = avg14.avgReps;
      const weightMonth = avgMonth.avgWeight; const repsMonth = avgMonth.avgReps;
      const pctIncreaseWeight14 = weightFirst? Math.round(((weight14 - weightFirst)/weightFirst)*100*100)/100 : null;
      const pctIncreaseReps14 = repsFirst? Math.round(((reps14 - repsFirst)/repsFirst)*100*100)/100 : null;
      const pctIncreaseWeightMonth = weightFirst? Math.round(((weightMonth - weightFirst)/weightFirst)*100*100)/100 : null;
      const pctIncreaseRepsMonth = repsFirst? Math.round(((repsMonth - repsFirst)/repsFirst)*100*100)/100 : null;
      return {
        exercise: ex,
        first: {date: first? first.date : null, weight: weightFirst, reps: repsFirst},
        avg14: { ...avg14 }, pct14: { weight: pctIncreaseWeight14, reps: pctIncreaseReps14 },
        avgMonth: { ...avgMonth }, pctMonth: { weight: pctIncreaseWeightMonth, reps: pctIncreaseRepsMonth }
      };
    });
  }, [exerciseMap, firstPerExercise]);

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date: r.date, weight: r.weight, reps: r.reps }));
    const map = {};
    arr.forEach(a=>{ if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0}; map[a.date].weightSum += a.weight; map[a.date].repsSum += a.reps; map[a.date].count +=1; });
    const out = Object.keys(map).sort().map(d=>({ date:d, weight: Math.round((map[d].weightSum/map[d].count)*100)/100, reps: Math.round((map[d].repsSum/map[d].count)*100)/100 }));
    return out;
  }

  const primary = darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen flex flex-col ${primary}`}>
      {/* Tabs */}
      <div className="flex justify-around border-b bg-white dark:bg-gray-800 sticky top-0 z-10">
        <button onClick={()=>setTab('dashboard')} className={`flex-1 p-3 ${tab==='dashboard'?'font-bold text-indigo-600':'text-gray-600 dark:text-gray-300'}`}>Dashboard</button>
        <button onClick={()=>setTab('progress')} className={`flex-1 p-3 ${tab==='progress'?'font-bold text-indigo-600':'text-gray-600 dark:text-gray-300'}`}>Progress</button>
        <button onClick={()=>setDarkMode(prev=>!prev)} className="flex-1 p-3">{darkMode?'🌙 Dark':'☀️ Light'}</button>
        <button onClick={resetLogs} className="flex-1 p-3 text-red-500">Reset All</button>
      </div>

      {/* Dashboard */}
      {tab==='dashboard' && (
        <div className="p-4 space-y-4">
          <div className="text-xl font-bold">Select a Day</div>
          <div className="grid grid-cols-2 gap-3">
            {SPLIT.map(d=>(
              <div key={d.day} className="relative">
                <button onClick={()=>openDay(d.day)} className="p-4 rounded-xl shadow bg-white dark:bg-gray-700 text-left w-full">
                  <div className="font-semibold">{d.day}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">{d.muscle}</div>
                </button>
                <button onClick={()=>setShowWeeklyDay(d.day)} className="absolute top-2 right-2 text-gray-500 dark:text-gray-200">⋮</button>
              </div>
            ))}
          </div>

          {/* Weekly Day Modal */}
          {showWeeklyDay && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-24">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl w-11/12 max-w-md space-y-3">
                <div className="flex justify-between">
                  <div className="font-bold text-lg">{showWeeklyDay} Weekly Recap</div>
                  <button onClick={()=>setShowWeeklyDay(null)}>✕</button>
                </div>
                {SPLIT.find(d=>d.day===showWeeklyDay)?.exercises.map(ex=>{
                  const exLogs = (exerciseMap[ex]||[]);
                  return (
                    <div key={ex} className="border-b pb-1 mb-1">
                      <div className="font-semibold">{ex}</div>
                      {exLogs.map(l=><div key={l.id} className="text-sm">{l.date}: {l.reps} reps × {l.weight}kg</div>)}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Exercise Panel */}
          {showPanel && selectedDay && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-xl shadow space-y-2">
              <div className="text-lg font-bold">{selectedDay} Exercises</div>
              {SPLIT.find(d=>d.day===selectedDay)?.exercises.map(ex=>{
                return (
                  <button key={ex} onClick={()=>openExercise(ex)} className="p-2 rounded bg-indigo-100 dark:bg-indigo-800 w-full text-left">{ex}</button>
                )
              })}
              <button onClick={()=>setShowPanel(false)} className="mt-2 text-gray-500">Close</button>
            </div>
          )}

          {/* Set Input Panel */}
          {selectedExercise && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-xl shadow space-y-2">
              <div className="font-bold text-lg">{selectedExercise} Sets</div>
              {setsInput.map((s,i)=>(
                <div key={i} className="flex space-x-2 items-center">
                  <span>Set {s.set}</span>
                  <input type="number" value={s.reps} onChange={e=>updateSet(i,'reps',Number(e.target.value))} className="w-16 p-1 rounded border" />
                  <input type="number" value={s.weight} onChange={e=>updateSet(i,'weight',Number(e.target.value))} className="w-20 p-1 rounded border" />
                  <button onClick={()=>removeSet(i)} className="text-red-500">✕</button>
                </div>
              ))}
              <div className="flex space-x-2 mt-2">
                <button onClick={addSetRow} className="bg-green-500 text-white px-2 py-1 rounded">Add Set</button>
                <button onClick={saveExercise} className="bg-blue-500 text-white px-2 py-1 rounded">Save</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {tab==='progress' && (
        <div className="p-4 space-y-6">
          <div className="text-xl font-bold mb-2">Exercise Progress</div>
          {progressSummary.map(ex=>(
            <div key={ex.exercise} className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow">
              <div className="font-semibold">{ex.exercise}</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartDataForExercise(ex.exercise)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Weight(kg)" />
                  <Line type="monotone" dataKey="reps" stroke="#82ca9d" name="Reps" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
