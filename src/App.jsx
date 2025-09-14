import React, { useState, useEffect, useMemo } from 'react';
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

const STORAGE_KEY = 'gympro_logs_v1';
function uid(){ return Math.random().toString(36).slice(2,9); }

export default function App(){
  const [logs, setLogs] = useState(()=> {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch(e){ return []; }
  });
  const [selectedDay,setSelectedDay] = useState(null);
  const [selectedExercise,setSelectedExercise] = useState(null);
  const [showPanel,setShowPanel] = useState(false);
  const [setsInput,setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [tab,setTab] = useState('dashboard');
  const [dark,setDark] = useState(false);
  const [showWeeklyDay,setShowWeeklyDay] = useState(null);

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY,JSON.stringify(logs)); },[logs]);

  function openDay(day){ setSelectedDay(day); setSelectedExercise(null); setShowPanel(true); setSetsInput([{set:1,reps:8,weight:0}]); }
  function openExercise(ex){ setSelectedExercise(ex); setSetsInput([{set:1,reps:8,weight:0}]); }
  function addSetRow(){ setSetsInput(prev=>[...prev,{set:prev.length+1,reps:8,weight:0}]); }
  function updateSet(idx,field,val){ const copy=[...setsInput]; copy[idx][field]=val; setSetsInput(copy); }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }
  function saveExercise(){
    if(!selectedExercise) return;
    const newEntries = setsInput.map(s=>({
      id:uid(), date:format(new Date(),'yyyy-MM-dd'), day:selectedDay, exercise:selectedExercise, set:s.set, reps:Number(s.reps), weight:Number(s.weight)
    }));
    setLogs(prev=>[...prev,...newEntries].sort((a,b)=> a.date>b.date?1:-1));
    setSelectedExercise(null); setSetsInput([{set:1,reps:8,weight:0}]);
  }
  function resetLogs(){ if(window.confirm('Reset all progress?')) setLogs([]); }

  const exerciseMap = useMemo(()=>{
    const map={};
    logs.forEach(l=>{ if(!map[l.exercise]) map[l.exercise]=[]; map[l.exercise].push(l); });
    Object.keys(map).forEach(k=> map[k].sort((a,b)=> a.date>b.date?1:-1));
    return map;
  },[logs]);

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date:r.date, weight:r.weight, reps:r.reps }));
    const map = {};
    arr.forEach(a=>{ if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0}; map[a.date].weightSum+=a.weight; map[a.date].repsSum+=a.reps; map[a.date].count+=1; });
    return Object.keys(map).sort().map(d=>({ date:d, weight:Math.round((map[d].weightSum/map[d].count)*100)/100, reps:Math.round((map[d].repsSum/map[d].count)*100)/100 }));
  }

  const firstPerExercise = useMemo(()=>{
    const out = {};
    Object.keys(exerciseMap).forEach(ex=>{
      const arr = exerciseMap[ex]; if(arr.length) out[ex] = arr[0];
    }); return out;
  },[exerciseMap]);

  const progressSummary = useMemo(()=>{
    return Object.keys(exerciseMap).map(ex=>{
      const first = firstPerExercise[ex];
      const last = exerciseMap[ex][exerciseMap[ex].length-1];
      const pctWeight = first.weight? Math.round(((last.weight-first.weight)/first.weight)*100*100)/100 : null;
      const pctReps = first.reps? Math.round(((last.reps-first.reps)/first.reps)*100*100)/100 : null;
      return {exercise:ex,last, pctWeight, pctReps};
    });
  },[exerciseMap,firstPerExercise]);

  const primary = dark?'bg-gray-900 text-white':'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen ${primary} flex flex-col`}>
      {/* Top bar */}
      <div className="flex justify-between items-center p-3 border-b">
        <div className="flex space-x-3">
          <button onClick={()=>setTab('dashboard')} className={`${tab==='dashboard'?'font-bold':'text-gray-500'}`}>Dashboard</button>
          <button onClick={()=>setTab('progress')} className={`${tab==='progress'?'font-bold':'text-gray-500'}`}>Progress</button>
        </div>
        <div className="flex space-x-2">
          <button onClick={()=>setDark(!dark)} className="px-2 py-1 border rounded">{dark?'Light':'Dark'}</button>
          <button onClick={()=>resetLogs()} className="px-2 py-1 border rounded text-red-500">Reset</button>
          <button onClick={()=>setShowWeeklyDay('Monday')} className="px-2 py-1 border rounded">⋮</button>
        </div>
      </div>

      {/* Dashboard */}
      {tab==='dashboard' && (
        <div className="p-4 grid gap-3">
          {SPLIT.map(d=>(
            <button key={d.day} onClick={()=>openDay(d.day)} className="p-4 rounded-xl shadow bg-white dark:bg-gray-700 text-left">
              <div className="font-semibold">{d.day}</div>
              <div className="text-sm text-gray-500 dark:text-gray-300">{d.muscle}</div>
            </button>
          ))}

          {/* Exercise Panel */}
          {showPanel && selectedDay && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-xl shadow space-y-2">
              <div className="text-lg font-bold">{selectedDay} Exercises</div>
              {SPLIT.find(d=>d.day===selectedDay)?.exercises.map(ex=>(
                <button key={ex} onClick={()=>openExercise(ex)} className="p-2 rounded bg-indigo-100 dark:bg-indigo-800 w-full text-left">{ex}</button>
              ))}
              <button onClick={()=>setShowPanel(false)} className="mt-2 text-gray-500 dark:text-gray-300">Close</button>
            </div>
          )}

          {/* Set Input Panel */}
          {selectedExercise && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-xl shadow space-y-2">
              <div className="font-bold text-lg">{selectedExercise} Sets</div>
              {setsInput.map((s,i)=>(
                <div key={i} className="flex space-x-2 items-center">
                  <span>Set {s.set}</span>
                  <input type="number" value={s.reps} onChange={e=>updateSet(i,'reps',Number(e.target.value))} className="w-16 p-1 rounded border"/>
                  <input type="number" value={s.weight} onChange={e=>updateSet(i,'weight',Number(e.target.value))} className="w-20 p-1 rounded border"/>
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
        <div className="p-4 space-y-4">
          {progressSummary.map(ex=>(
            <div key={ex.exercise} className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow">
              <div className="font-semibold">{ex.exercise}</div>
              <div className="text-sm">Last: {ex.last.weight}kg × {ex.last.reps} reps ({ex.pctWeight||0}% ↑ weight, {ex.pctReps||0}% ↑ reps)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartDataForExercise(ex.exercise)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Weight" />
                  <Line type="monotone" dataKey="reps" stroke="#82ca9d" name="Reps" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Modal */}
      {showWeeklyDay && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-20 z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow max-w-lg w-full">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-lg">{showWeeklyDay} Logs</div>
              <button onClick={()=>setShowWeeklyDay(null)}>✕</button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {logs.filter(l=>l.day===showWeeklyDay).map(l=>(
                <div key={l.id} className="p-2 rounded bg-gray-100 dark:bg-gray-700">{l.exercise}: {l.weight}kg × {l.reps} reps</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
