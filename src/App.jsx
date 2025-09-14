// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subDays, startOfMonth, isAfter } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
const THEME_KEY = 'gympro_theme_v1';

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
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw) : []; } catch(e){ return []; }
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(()=> localStorage.getItem(THEME_KEY)==='dark');

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);
  useEffect(()=>{ localStorage.setItem(THEME_KEY, darkMode?'dark':'light'); },[darkMode]);

  function openDay(day){ setSelectedDay(day); setSelectedExercise(null); setShowPanel(true); setSetsInput([{set:1,reps:8,weight:0}]); }
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

  function resetProgress(){ if(window.confirm('Are you sure? This will delete all logs.')) setLogs([]); }

  function totalStrengthData(){
    const map={};
    logs.forEach(l=>{
      if(!map[l.date]) map[l.date]={strength:0,count:0,weightSum:0,repsSum:0};
      map[l.date].strength += l.weight*l.reps;
      map[l.date].weightSum += l.weight;
      map[l.date].repsSum += l.reps;
      map[l.date].count +=1;
    });
    return Object.keys(map).sort().map(d=>({
      date:d,
      strength: map[d].strength,
      avgWeight: Math.round(map[d].weightSum/map[d].count*100)/100,
      avgReps: Math.round(map[d].repsSum/map[d].count*100)/100
    }));
  }

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

  const firstPerExercise = useMemo(()=>{
    const out = {}; Object.keys(exerciseMap).forEach(ex=>{
      const arr = exerciseMap[ex]; if(arr.length){ const first = arr[0]; out[ex] = {date:first.date, reps:first.reps, weight:first.weight}; }
    }); return out;
  }, [exerciseMap]);

  const day14Start = format(subDays(new Date(),13),'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()),'yyyy-MM-dd');

  function averageInRange(ex, startDate){
    const arr = (exerciseMap[ex]||[]).filter(r=> isAfter(parseISO(r.date), subDays(parseISO(startDate),1)) || r.date===startDate );
    if(!arr.length) return {avgReps:0, avgWeight:0, count:0};
    const reps = arr.reduce((s,r)=>s + r.reps,0)/arr.length;
    const weight = arr.reduce((s,r)=>s + r.weight,0)/arr.length;
    return {avgReps: Math.round(reps*100)/100, avgWeight: Math.round(weight*100)/100, count: arr.length};
  }

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
    return Object.keys(map).sort().map(d=>({ date:d, weight: Math.round((map[d].weightSum/map[d].count)*100)/100, reps: Math.round((map[d].repsSum/map[d].count)*100)/100 }));
  }

  function exportPDF(){
    const input = document.getElementById('export-area');
    html2canvas(input).then(canvas=>{
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p','mm','a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = imgProps.height * pdfWidth / imgProps.width;
      pdf.addImage(imgData,'PNG',0,0,pdfWidth,pdfHeight);
      pdf.save("gym_logs.pdf");
    });
  }

  const primary = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen ${primary} flex flex-col`}>
      {/* Tabs */}
      <div className={`flex justify-around border-b ${darkMode?'bg-gray-800':'bg-white'} sticky top-0 z-10`}>
        <button onClick={()=>setTab('dashboard')} className={`flex-1 p-3 ${tab==='dashboard'?'font-bold text-indigo-500':'text-gray-600'}`}>Dashboard</button>
        <button onClick={()=>setTab('progress')} className={`flex-1 p-3 ${tab==='progress'?'font-bold text-indigo-500':'text-gray-600'}`}>Progress</button>
        <button onClick={()=>setTab('weekly')} className={`flex-1 p-3 ${tab==='weekly'?'font-bold text-indigo-500':'text-gray-600'}`}>Weekly Log</button>
        <button onClick={()=>setTab('strength')} className={`flex-1 p-3 ${tab==='strength'?'font-bold text-indigo-500':'text-gray-600'}`}>Body Strength</button>
      </div>

      {/* Dark Mode & Reset */}
      <div className="p-2 flex justify-end gap-2">
        <button onClick={()=>setDarkMode(prev=>!prev)} className="px-2 py-1 border rounded">{darkMode?'Light Mode':'Dark Mode'}</button>
        <button onClick={resetProgress} className="px-2 py-1 border rounded text-red-500">Reset Progress</button>
        <button onClick={exportPDF} className="px-2 py-1 border rounded text-green-500">Export PDF</button>
      </div>

      <div id="export-area" className="p-4 space-y-4">
        {/* Dashboard */}
        {tab==='dashboard' && (
          <div className="space-y-4">
            <div className="text-xl font-bold">Select a Day</div>
            <div className="grid grid-cols-2 gap-3">
              {SPLIT.map(d=>(
                <button key={d.day} onClick={()=>openDay(d.day)} className="p-4 rounded-xl shadow bg-white text-left">
                  <div className="font-semibold">{d.day}</div>
                  <div className="text-xs text-gray-500">{d.muscle}</div>
                </button>
              ))}
            </div>
            {/* Slide-in Panel */}
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
                        <button key={ex} onClick={()=>openExercise(ex)} className="block w-full text-left p-2 bg-indigo-50 rounded">
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

        {/* Progress */}
        {tab==='progress' && (
          <div className="space-y-4">
            <div className="text-xl font-bold">Progress Summary</div>
            <div className="grid gap-3">
              {progressSummary.map(item=>{
                const last = exerciseMap[item.exercise]?.slice(-1)[0]||{weight:0,reps:0};
                const pct = {
                  weightPct: item.first.weight? Math.round(((last.weight - item.first.weight)/item.first.weight)*100*100)/100 : 0,
                  repsPct: item.first.reps? Math.round(((last.reps - item.first.reps)/item.first.reps)*100*100)/100 : 0
                };
                return (
                  <div key={item.exercise} className="p-3 rounded-xl bg-white shadow dark:bg-gray-800">
                    <div className="font-semibold mb-1">{item.exercise}</div>
                    <div className="text-sm text-gray-500">First: {item.first.weight}kg × {item.first.reps} reps</div>
                    <div className="text-sm text-green-600">Increase: {pct.weightPct}% weight, {pct.repsPct}% reps</div>
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
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Log */}
        {tab==='weekly' && (
          <div>
            <div className="text-xl font-bold mb-4">Weekly Log</div>
            {SPLIT.map(day=>{
              const dayLogs = logs.filter(l=>l.day===day.day);
              return (
                <div key={day.day} className="p-3 rounded-xl bg-white shadow mb-3 dark:bg-gray-800">
                  <div className="font-semibold">{day.day} ({day.muscle})</div>
                  {dayLogs.length ? dayLogs.map(l=>(
                    <div key={l.id} className="text-sm">{l.exercise}: {l.weight}kg × {l.reps} reps</div>
                  )) : <div className="text-gray-400 text-sm">No logs yet</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Body Strength */}
        {tab==='strength' && (
          <div>
            <div className="text-xl font-bold mb-4">Total Body Strength</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={totalStrengthData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} />
                <YAxis />
                <Tooltip formatter={(value,key)=>[value,key==='strength'?'Total Strength':key==='avgWeight'?'Avg Weight':'Avg Reps']} />
                <Line type="monotone" dataKey="strength" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="avgWeight" stroke="#6366F1" strokeWidth={2} />
                <Line type="monotone" dataKey="avgReps" stroke="#EC4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
