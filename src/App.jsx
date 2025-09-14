import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subDays, startOfMonth, isAfter } from 'date-fns';

const SPLIT = [
  { day: 'Monday', muscle: 'Chest + Triceps + Abs', exercises: ['Bench Press','Incline DB Press','Dips','Pushdowns'] },
  { day: 'Tuesday', muscle: 'Back + Biceps', exercises: ['Pull-Ups','Barbell Rows','Seated Rows','Barbell Curls'] },
  { day: 'Wednesday', muscle: 'Legs + Shoulders', exercises: ['Squats','RDLs','Lunges','OHP'] },
  { day: 'Thursday', muscle: 'Chest + Triceps', exercises: ['Incline Bench','Chest Flys','Push-Ups','Skullcrushers'] },
  { day: 'Friday', muscle: 'Rest', exercises: [] },
  { day: 'Saturday', muscle: 'Back + Biceps', exercises: ['Lat Pulldown','T-Bar Row','DB Row','Incline DB Curl'] },
  { day: 'Sunday', muscle: 'Legs + Shoulders', exercises: ['Leg Press','Leg Extension','Ham Curl','Arnold Press'] }
];

const STORAGE_KEY = 'gympro_logs_v1';
function uid(){ return Math.random().toString(36).slice(2,9); }

export default function App() {
  const [logs, setLogs] = useState(()=>{
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [setsInput, setSetsInput] = useState([{set:1, reps:8, weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);

  function openDay(day){ setSelectedDay(day); setSelectedExercise(null); setShowPanel(true); setSetsInput([{set:1,reps:8,weight:0}]); }
  function openExercise(ex){ setSelectedExercise(ex); setSetsInput([{set:1,reps:8,weight:0}]); }
  function addSetRow(){ setSetsInput(prev=>[...prev,{set:prev.length+1,reps:8,weight:0}]); }
  function updateSet(idx,field,val){ const copy=[...setsInput]; copy[idx][field]=val; setSetsInput(copy); }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }

  function saveExercise(){
    if(!selectedExercise) return;
    const newEntries = setsInput.map(s=>({
      id: uid(), date, day: selectedDay || format(parseISO(date),'EEEE'), exercise: selectedExercise,
      set: s.set, reps: Number(s.reps), weight: Number(s.weight)
    }));
    setLogs(prev=>[...prev,...newEntries].sort((a,b)=> a.date > b.date ? 1 : -1));
    setSetsInput([{set:1,reps:8,weight:0}]);
    setSelectedExercise(null);
  }

  function resetProgress(){
    if(confirm("Are you sure to reset all progress?")) setLogs([]);
  }

  const exerciseMap = useMemo(()=>{
    const map={};
    logs.forEach(l=>{ if(!map[l.exercise]) map[l.exercise]=[]; map[l.exercise].push(l); });
    Object.keys(map).forEach(k=> map[k].sort((a,b)=> a.date > b.date ? 1 : -1));
    return map;
  },[logs]);

  const firstPerExercise = useMemo(()=>{
    const out={};
    Object.keys(exerciseMap).forEach(ex=>{
      const arr = exerciseMap[ex];
      if(arr.length){ const first = arr[0]; out[ex]={date:first.date, reps:first.reps, weight:first.weight}; }
    });
    return out;
  },[exerciseMap]);

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({date:r.date,weight:r.weight,reps:r.reps}));
    const map={};
    arr.forEach(a=>{ 
      if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0};
      map[a.date].weightSum += a.weight; map[a.date].repsSum += a.reps; map[a.date].count +=1;
    });
    return Object.keys(map).sort().map(d=>({date:d, weight: Math.round(map[d].weightSum/map[d].count*100)/100, reps: Math.round(map[d].repsSum/map[d].count*100)/100}));
  }

  const primary = darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen flex flex-col ${primary}`}>
      <div className="flex justify-between items-center border-b bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="flex">
          <button onClick={()=>setTab('dashboard')} className={`p-3 ${tab==='dashboard'?'font-bold text-indigo-600':'text-gray-600'}`}>Dashboard</button>
          <button onClick={()=>setTab('progress')} className={`p-3 ${tab==='progress'?'font-bold text-indigo-600':'text-gray-600'}`}>Progress</button>
        </div>
        <div className="flex items-center space-x-3 p-3">
          <button onClick={resetProgress} className="px-3 py-1 bg-red-500 text-white rounded">Reset</button>
          <button onClick={()=>setDarkMode(!darkMode)} className="px-3 py-1 bg-gray-200 rounded">{darkMode ? 'Light' : 'Dark'}</button>
        </div>
      </div>

      {tab==='dashboard' && (
        <div className="p-4 space-y-4">
          <div className="text-xl font-bold">Select a Day</div>
          <div className="grid grid-cols-2 gap-3">
            {SPLIT.map(d=>(
              <button key={d.day} onClick={()=>openDay(d.day)} className="p-4 rounded-xl shadow bg-white dark:bg-gray-800 text-left">
                <div className="font-semibold">{d.day}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{d.muscle}</div>
              </button>
            ))}
          </div>

          {showPanel && selectedDay && (
            <div className="fixed inset-0 bg-black/40 flex justify-end">
              <div className="bg-white dark:bg-gray-800 w-80 p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold">{selectedDay} Exercises</div>
                  <button onClick={()=>setShowPanel(false)}>✕</button>
                </div>
                {!selectedExercise && (
                  <div className="space-y-2">
                    {(SPLIT.find(d=>d.day===selectedDay)?.exercises||[]).map(ex=>(
                      <button key={ex} onClick={()=>openExercise(ex)} className="block w-full text-left p-2 bg-indigo-50 dark:bg-gray-700 rounded">
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
                {selectedExercise && (
                  <div>
                    <div className="font-semibold mb-2">{selectedExercise}</div>
                    {setsInput.map((s,i)=>(
                      <div key={i} className="flex items-center space-x-2 mb-2">
                        <input type="number" value={s.reps} onChange={e=>updateSet(i,'reps',e.target.value)} className="border p-1 w-16" placeholder="Reps" />
                        <input type="number" value={s.weight} onChange={e=>updateSet(i,'weight',e.target.value)} className="border p-1 w-20" placeholder="Weight" />
                        <button onClick={()=>removeSet(i)} className="text-red-500">✕</button>
                      </div>
                    ))}
                    <button onClick={addSetRow} className="px-3 py-1 bg-gray-200 rounded">+ Set</button>
                    <button onClick={saveExercise} className="ml-2 px-3 py-1 bg-indigo-500 text-white rounded">Save</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='progress' && (
        <div className="p-4 space-y-6">
          <div className="text-xl font-bold">Progress Summary</div>
          <div className="grid gap-3">
            {Object.keys(exerciseMap).map(ex=>(
              <div key={ex} className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow">
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
        </div>
      )}
    </div>
  );
}
