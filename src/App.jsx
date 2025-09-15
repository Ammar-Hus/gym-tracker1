{/* Progress */}
{tab === 'progress' && (
  <div className="space-y-6">
    <div className="text-xl font-bold mb-3">Progress Overview</div>

    {/* Filter Tabs */}
    <div className="flex space-x-2 mb-4">
      {['14 Days', 'Monthly', 'All Time'].map(range => (
        <button
          key={range}
          onClick={() => setProgressRange(range)}
          className={`px-3 py-1 rounded-full text-sm ${
            progressRange === range
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {range}
        </button>
      ))}
    </div>

    {/* Exercise Cards */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {progressSummary.map(item => {
        const pct =
          progressRange === '14 Days'
            ? item.pct14
            : progressRange === 'Monthly'
            ? item.pctMonth
            : item.first.weight
            ? Math.round(
                ((item.avgMonth.avgWeight - item.first.weight) /
                  item.first.weight) *
                  100 *
                  100
              ) / 100
            : null;

        return (
          <div
            key={item.exercise}
            className="p-4 rounded-xl bg-white shadow hover:shadow-md transition cursor-pointer"
            onClick={() => setExpandedExercise(expandedExercise === item.exercise ? null : item.exercise)}
          >
            <div className="flex justify-between items-center">
              <div className="font-semibold">{item.exercise}</div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  pct > 0
                    ? 'bg-green-100 text-green-700'
                    : pct < 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {pct ? `${pct > 0 ? '↑' : '↓'}${Math.abs(pct)}%` : 'No Data'}
              </span>
            </div>

            {/* Mini chart */}
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={chartDataForExercise(item.exercise)}>
                <Line type="monotone" dataKey="weight" stroke="#6366F1" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>

            {/* Expand for details */}
            {expandedExercise === item.exercise && (
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <div>First Log: {item.first.weight}kg × {item.first.reps} reps</div>
                <div>14d Avg: {item.avg14.avgWeight}kg × {item.avg14.avgReps} reps</div>
                <div>Monthly Avg: {item.avgMonth.avgWeight}kg × {item.avgMonth.avgReps} reps</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
