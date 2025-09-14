import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subDays, startOfMonth, isAfter } from 'date-fns';

const SPLIT = [
  { day: 'Monday', muscle: 'Chest + Triceps + Abs', exercises: ['Bench Press','Incline DB Press','Dips'] },
  { day: 'Tuesday', muscle: 'Back + Biceps', exercises: ['Pull-Ups','Barbell Rows'] },
  { day: 'Wednesday', muscle: 'Legs + Shoulders', exercises: ['Squats','OHP'] },
  { day: 'Thursday', muscle: 'Chest + Triceps', exercises: ['Incline Bench','Push-Ups'] },
  { day: 'Friday', muscle: 'Rest', exercises: [] },
  { day: 'Saturday', muscle: 'Back + Biceps', exercises: ['Lat Pulldown','DB Row'] },
  { day: 'Sunday', muscle: 'Legs + Shoulders', exercises: ['Leg Press','Arnold Press'] },
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
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): []; }catch(e){return [];}
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);

  function addSetRow(){ setSetsInput(prev=>[...prev,{set: prev.length+1,reps:8,weight:0}]); }
  function updateSet(idx, field, val){ const copy=[...setsInput]; copy[idx][field]=Number(val); setSetsInput(copy); }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }
  function resetProgress(){ if(window.confirm('Reset all progress?')) setLogs([]); }

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

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

  const firstPerExercise = useMemo(()=>{
    const out = {}; Object.keys(exerciseMap).forEach(ex=>{
      const arr = exerciseMap[ex]; if(arr.length){ const first = arr[0]; out[ex]={date:first.date,reps:first.reps,weight:first.weight}; }
    }); return out;
  }, [exerciseMap]);

  function averageInRange(ex, startDate){
    const arr = (exerciseMap[ex]||[]).filter(r=> isAfter(parseISO(r.date), subDays(parseISO(startDate),1)) || r.date===startDate );
    if(!arr.length) return {avgReps:0, avgWeight:0, count:0};
    const reps = arr.reduce((s,r)=>s+r.reps,0)/arr.length;
    const weight = arr.reduce((s,r)=>s+r.weight,0)/arr.length;
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
        first: {date:first? first.date:null, weight:weightFirst, reps:repsFirst},
        avg14: {...avg14}, pct14: {weight:pctIncreaseWeight14,reps:pctIncreaseReps14},
        avgMonth: {...avgMonth}, pctMonth: {weight:pctIncreaseWeightMonth,reps:pctIncreaseRepsMonth}
      };
    });
  }, [exerciseMap, firstPerExercise]);

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date:r.date, weight:r.weight, reps:r.reps }));
    const map = {};
    arr.forEach(a=>{ if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0}; map[a.date].weightSum += a.weight; map[a.date].repsSum += a.reps; map[a.date].count +=1; });
    const out = Object.keys(map).sort().map(d=>({ date:d, weight: Math.round((map[d].weightSum/map[d].count)*100)/100, reps: Math.round((map[d].repsSum/map[d].count)*100)/100 }));
    return out;
  }

  const primary = darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen ${primary} flex flex-col p-4`}>
      {/* Tabs */}
      <div className="flex justify-around border-b sticky top-0 z-10 bg-white dark:bg-gray-800">
        <button onClick={()=>setTab('dashboard')} className={`flex-1 p-3 ${tab==='dashboard'?'font-bold text-indigo-600':'text-gray-600 dark:text-gray-300'}`}>Dashboard</button>
        <button onClick={()=>setTab('progress')} className={`flex-1 p-3 ${tab==='progress'?'font-bold text-indigo-600':'text-gray-600 dark:text-gray-300'}`}>Progress</button>
      </div>

      <div className="flex justify-end space-x-2 mt-2">
        <button onClick={()=>setDarkMode(!darkMode)} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Toggle Dark Mode</button>
        <button onClick={resetProgress} className="px-3 py-1 rounded bg-red-500 text-white">Reset All</button>
      </div>

      {/* Dashboard */}
      {tab==='dashboard' && (
        <div className="p-4 space-y-4">
          <div className="text-xl font-bold">Select a Day</div>
          <div className="grid grid-cols-2 gap-3">
            {SPLIT.map(d=>(
              <button key={d.day} onClick={()=>setSelectedDay(d.day)} className="p-4 rounded-xl shadow bg-white dark:bg-gray-800 text-left">
                <div className="font-semibold">{d.day}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{d.muscle}</div>
              </button>
            ))}
          </div>

          {selectedDay && (
            <div className="mt-4 p-4 rounded-xl shadow bg-white dark:bg-gray-800">
              <div className="font-bold mb-2">{selectedDay} Exercises</div>
              {(SPLIT.find(d=>d.day===selectedDay)?.exercises||[]).map(ex=>(
                <div key={ex} className="mb-2">
                  <button onClick={()=>setSelectedExercise(ex)} className="block w-full text-left p-2 bg-indigo-50 dark:bg-indigo-900 rounded">{ex}</button>
                </div>
              ))}

              {selectedExercise && (
                <div className="mt-2">
                  <div className="font-semibold mb-2">{selectedExercise}</div>
                  {setsInput.map((s,i)=>(
                    <div key={i} className="flex items-center space-x-2 mb-2">
                      <input type="number" value={s.reps} onChange={e=>updateSet(i,'reps',e.target.value)} className="border p-1 w-16 rounded" placeholder="Reps" />
                      <input type="number" value={s.weight} onChange={e=>updateSet(i,'weight',e.target.value)} className="border p-1 w-20 rounded" placeholder="Weight" />
                      <button onClick={()=>removeSet(i)} className="text-red-500">✕</button>
                    </div>
                  ))}
                  <button onClick={addSetRow} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">+ Set</button>
                  <button onClick={saveExercise} className="ml-2 px-3 py-1 bg-indigo-500 text-white rounded">Save</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {tab==='progress' && (
        <div className="p-4 space-y-6">
          <div className="text-xl font-bold">Progress Summary</div>
          <div className="grid gap-3">
            {progressSummary.map(item=>(
              <div key={item.exercise} className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow">
                <div className="font-semibold mb-1">{item.exercise}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">First: {item.first.weight}kg × {item.first.reps} reps</div>
                <div className="text-sm">14d Avg: {item.avg14.avgWeight}kg ({item.pct14.weight||0}% vs start), {item.avg14.avgReps} reps ({item.pct14.reps||0}% vs start)</div>
                <div className="text-sm">Month Avg: {item.avgMonth.avgWeight}kg ({item.pctMonth.weight||0}% vs start), {item.avgMonth.avgReps} reps ({item.pctMonth.reps||0}% vs start)</div>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
