import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format, parseISO, subDays, startOfMonth, isAfter } from 'date-fns';

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
  const [showPanel, setShowPanel] = useState(false);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');
  const [absSelected, setAbsSelected] = useState([]);

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);

  function openDay(day){ setSelectedDay(day); setSelectedExercise(null); setShowPanel(true); setSetsInput([{set:1,reps:8,weight:0}]); setAbsSelected([]); }
  function openExercise(ex){ setSelectedExercise(ex); setSetsInput([{set:1,reps:8,weight:0}]); }
  function addSetRow(){ setSetsInput(prev=>[...prev, {set: prev.length+1, reps:8, weight:0}]); }
  function updateSet(idx, field, val){ const copy=[...setsInput]; copy[idx][field]=val; setSetsInput(copy); }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }
  function toggleAbs(ex){ setAbsSelected(prev=> prev.includes(ex)? prev.filter(a=>a!==ex) : [...prev,ex]); }

  function saveExercise(){
    if(!selectedExercise) return;
    const newEntries = setsInput.map(s=>({
      id: uid(), date, day: selectedDay || format(parseISO(date),'EEEE'), exercise: selectedExercise,
      set: s.set, reps: Number(s.reps), weight: Number(s.weight)
    }));
    const absEntries = absSelected.map(ex=>({
      id: uid(), date, day: selectedDay || format(parseISO(date),'EEEE'), exercise: ex,
      set: 1, reps: 0, weight: 0
    }));
    setLogs(prev=>[...prev, ...newEntries, ...absEntries].sort((a,b)=> a.date > b.date ? 1 : -1));
    setSetsInput([{set:1,reps:8,weight:0}]);
    setSelectedExercise(null);
  }

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

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
      const arr = exerciseMap[ex]||[];
      const first = arr.length? arr[0]: {date:null, reps:0, weight:0};
      const avg14 = averageInRange(ex, day14Start);
      const avgMonth = averageInRange(ex, monthStart);
      const pct14 = first.weight? Math.round(((avg14.avgWeight-first.weight)/first.weight)*100*100)/100 : null;
      const pctMonth = first.weight? Math.round(((avgMonth.avgWeight-first.weight)/first.weight)*100*100)/100 : null;
      return {exercise:ex, first, avg14, avgMonth, pct14, pctMonth};
    });
  }, [exerciseMap]);

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date: r.date, weight: r.weight, reps: r.reps }));
    const map = {};
    arr.forEach(a=>{ if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0}; map[a.date].weightSum += a.weight; map[a.date].repsSum += a.reps; map[a.date].count +=1; });
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
        <button onClick={()=>{localStorage.removeItem(STORAGE_KEY); setLogs([]);}} className="w-full p-2 mb-2 rounded bg-red-500 text-white">Reset All</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Dashboard */}
        {tab==='dashboard' && (
          <div>... (same as before)</div>
        )}

        {/* Progress */}
        {tab==='progress' && (
          <div className="space-y-8">
            <div className="text-2xl font-bold">📈 Progress Overview</div>
            {progressSummary.map(item=>(
              <div key={item.exercise} className="p-5 rounded-xl bg-white shadow-md hover:shadow-lg transition">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-lg">{item.exercise}</div>
                  <span className="text-xs text-gray-500">Started: {item.first.date || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-3">
                  <div className="p-2 bg-gray-50 rounded">Start: {item.first.weight}kg × {item.first.reps} reps</div>
                  <div className="p-2 bg-green-50 rounded">14d: {item.avg14.avgWeight}kg ({item.pct14 || 0}%↑)</div>
                  <div className="p-2 bg-blue-50 rounded">Month: {item.avgMonth.avgWeight}kg ({item.pctMonth || 0}%↑)</div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartDataForExercise(item.exercise)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#6366F1" strokeWidth={2} />
                    <Line type="monotone" dataKey="reps" stroke="#EC4899" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {/* Weekly */}
        {tab==='weekly' && (
          <div>... (same as before)</div>
        )}
      </div>
    </div>
  );
}
