import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays, startOfMonth, isAfter } from 'date-fns';

const SPLIT = [
  { day: 'Monday', muscle: 'Chest + Triceps + Abs', exercises: ['Bench Press','Incline DB Press','Dips','Pushdowns','Overhead DB Extension','Plank','Deadbug','Woodchoppers'] },
  { day: 'Tuesday', muscle: 'Back + Biceps + Abs', exercises: ['Pull-Ups','Barbell Rows','Seated Rows','Barbell Curls','DB Curls','Concentration Curl','Crunches','Hanging Leg Raise'] },
  { day: 'Wednesday', muscle: 'Legs + Shoulders + Abs', exercises: ['Squats','RDLs','Lunges','OHP','Lateral Raises','Rear Delt Flys','Russian Twists','Plank'] },
  { day: 'Thursday', muscle: 'Chest + Triceps + Abs', exercises: ['Incline Bench','Chest Flys','Push-Ups','Skullcrushers','Rope Pushdowns','Dips','Crunches'] },
  { day: 'Friday', muscle: 'Rest', exercises: [] },
  { day: 'Saturday', muscle: 'Back + Biceps + Abs', exercises: ['Lat Pulldown','T-Bar Row','DB Row','Incline DB Curl','Hammer Curl','Cable Curl','Decline Crunch','V-Ups','Cable Crunch'] },
  { day: 'Sunday', muscle: 'Legs + Shoulders + Abs', exercises: ['Leg Press','Leg Extension','Ham Curl','Arnold Press','Front Raise','Cable Lateral Raise','Stretch & Mobility','Plank'] }
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
  const [logs, setLogs] = useState(()=>{
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): []; }catch(e){return []}
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showWeeklyDay, setShowWeeklyDay] = useState(null);
  const [absDays, setAbsDays] = useState(()=> {
    try { const raw = localStorage.getItem('absDays_v1'); return raw? JSON.parse(raw) : {}; } catch(e){ return {}; }
  });

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);
  useEffect(()=>{ localStorage.setItem('absDays_v1', JSON.stringify(absDays)); },[absDays]);

  function openDay(day){ setSelectedDay(day); setSelectedExercise(null); setSetsInput([{set:1,reps:8,weight:0}]); }
  function openExercise(ex){ setSelectedExercise(ex); setSetsInput([{set:1,reps:8,weight:0}]); }
  function addSetRow(){ setSetsInput(prev=>[...prev, {set: prev.length+1, reps:8, weight:0}]); }
  function updateSet(idx, field, val){ const copy=[...setsInput]; copy[idx][field]=val; setSetsInput(copy); }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }

  function saveExercise(){
    if(!selectedExercise) return;
    const newEntries = setsInput.map(s=>({
      id: uid(), date, day: selectedDay, exercise: selectedExercise,
      set: s.set, reps: Number(s.reps), weight: Number(s.weight)
    }));
    setLogs(prev=>[...prev, ...newEntries]);
    setSetsInput([{set:1,reps:8,weight:0}]);
    setSelectedExercise(null);
  }

  function resetLogs(){ if(window.confirm("Reset all logs?")) setLogs([]); }

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

  const firstPerExercise = useMemo(()=>{
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

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date: r.date, weight: r.weight, reps: r.reps }));
    const map = {};
    arr.forEach(a=>{ if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0}; map[a.date].weightSum += a.weight; map[a.date].repsSum += a.reps; map[a.date].count +=1; });
    const out = Object.keys(map).sort().map(d=>({ date:d, weight: Math.round((map[d].weightSum/map[d].count)*100)/100, reps: Math.round((map[d].repsSum/map[d].count)*100)/100 }));
    return out;
  }

  return (
    <div className={`${darkMode?'bg-gray-900 text-white':'bg-gradient-to-r from-indigo-100 via-white to-pink-50'} min-h-screen p-4`}>
      <div className="flex justify-between mb-4">
        <div className="text-xl font-bold">Gym Tracker</div>
        <div>
          <button onClick={()=>setDarkMode(d=>!d)} className="px-3 py-1 border rounded">{darkMode?'Light':'Dark'}</button>
          <button onClick={resetLogs} className="px-3 py-1 border rounded ml-2">Reset Logs</button>
        </div>
      </div>

      <div className="flex space-x-4">
        <button onClick={()=>setTab('dashboard')} className={`${tab==='dashboard'?'font-bold underline':''}`}>Dashboard</button>
        <button onClick={()=>setTab('progress')} className={`${tab==='progress'?'font-bold underline':''}`}>Progress</button>
      </div>

      {tab==='dashboard' && (
        <div className="mt-4 space-y-4">
          {SPLIT.map(d=>(
            <div key={d.day} className="p-2 bg-white dark:bg-gray-800 rounded shadow">
              <div className="flex justify-between items-center cursor-pointer" onClick={()=>openDay(d.day)}>
                <div>
                  <div className="font-semibold">{d.day} ({d.muscle})</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {absDays[d.day]? 'ABS included' : 'ABS not selected'}
                  </div>
                </div>
                <button onClick={e=>{ e.stopPropagation(); setAbsDays(prev=>({...prev,[d.day]: !prev[d.day]}))}} className="px-2 py-1 border rounded text-sm">
                  {absDays[d.day]? 'Remove ABS' : 'Add ABS'}
                </button>
                <button onClick={e=>{ e.stopPropagation(); setShowWeeklyDay(d.day)}} className="px-2 py-1 border rounded text-sm ml-2">Weekly</button>
              </div>
              {selectedDay===d.day && (
                <div className="mt-2 space-y-2">
                  {d.exercises.map(ex=>(
                    <button key={ex} onClick={()=>openExercise(ex)} className="block w-full text-left p-2 bg-indigo-50 dark:bg-gray-700 rounded">{ex}</button>
                  ))}
                </div>
              )}
              {selectedExercise && selectedDay===d.day && (
                <div className="mt-2 space-y-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <div className="font-semibold">{selectedExercise}</div>
                  {setsInput.map((s,i)=>(
                    <div key={i} className="flex items-center space-x-2">
                      <input type="number" value={s.reps} onChange={e=>updateSet(i,'reps',e.target.value)} className="border p-1 w-16" placeholder="Reps"/>
                      <input type="number" value={s.weight} onChange={e=>updateSet(i,'weight',e.target.value)} className="border p-1 w-20" placeholder="Weight"/>
                      <button onClick={()=>removeSet(i)} className="text-red-500">✕</button>
                    </div>
                  ))}
                  <div className="flex space-x-2 mt-1">
                    <button onClick={addSetRow} className="px-3 py-1 bg-gray-200 rounded">+ Set</button>
                    <button onClick={saveExercise} className="px-3 py-1 bg-indigo-500 text-white rounded">Save</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==='progress' && (
        <div className="mt-4 space-y-4">
          {Object.keys(exerciseMap).map(ex=>(
            <div key={ex} className="p-3 bg-white dark:bg-gray-800 rounded shadow">
              <div className="font-semibold mb-1">{ex}</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartDataForExercise(ex)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#6366F1" />
                  <Line type="monotone" dataKey="reps" stroke="#EC4899" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {showWeeklyDay && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-20 z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow max-w-lg w-full">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-lg">{showWeeklyDay} Logs</div>
              <button onClick={()=>setShowWeeklyDay(null)}>✕</button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {SPLIT.find(d=>d.day===showWeeklyDay)?.exercises.map(ex=>{
                const exLogs = logs.filter(l=>l.exercise===ex && l.day===showWeeklyDay);
                return (
                  <div key={ex} className="p-2 rounded bg-gray-100 dark:bg-gray-700">
                    <div className="font-semibold">{ex}</div>
                    {exLogs.map(l=><div key={l.id}>{l.weight}kg × {l.reps} reps ({l.date})</div>)}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
