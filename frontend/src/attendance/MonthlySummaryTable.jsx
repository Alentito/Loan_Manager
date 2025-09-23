// src/attendance/MonthlySummaryTable.jsx
import React, { useState, useEffect } from "react";
import { useGetSummariesQuery } from "../api/attendanceSummaryApi";
import { useSearchParams } from "react-router-dom"; // for reading query params

const getMonthName = (month) =>
  new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(2000, month - 1, 1)
  );

const getDaysInMonth = (year, month) =>
  new Date(year, month, 0).getDate();

export default function MonthlySummaryTable() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("employee_id"); // get employee_id from URL if present

  const { data, isLoading, isError } = useGetSummariesQuery({
    month,
    year,
    employee_id: employeeId,
  });

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);

  const summary = data && data.length > 0 ? data[0] : null;
  const days = getDaysInMonth(year, month);

  return (
    <div className="p-4 space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {getMonthName(m)}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Loading / Error / Empty */}
      {isLoading && <p>Loading summaries...</p>}
      {isError && <p className="text-red-500">Error loading summaries</p>}
      {!isLoading && !isError && !summary && (
        <p className="text-gray-600">No summary available</p>
      )}

      {/* Top summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Present", value: summary.present_count, color: "bg-green-100 text-green-700" },
            { label: "Late", value: summary.late_count, color: "bg-yellow-100 text-yellow-700" },
            { label: "Absent", value: summary.absent_count, color: "bg-red-100 text-red-700" },
            { label: "Leave", value: summary.leave_count, color: "bg-blue-100 text-blue-700" },
            { label: "Early", value: summary.early_count, color: "bg-purple-100 text-purple-700" },
          ].map((card) => (
            <div key={card.label} className={`p-3 rounded shadow text-center ${card.color}`}>
              <div className="text-lg font-bold">{card.value}</div>
              <div className="text-sm">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed day-wise calendar table */}
      {summary && (
        <>
          <h2 className="text-lg font-bold">
            Attendance Calendar – {getMonthName(month)} {year} {employeeId ? `(Employee ID: ${employeeId})` : ""}
          </h2>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Day</th>
                <th className="border px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: days }, (_, i) => {
                const date = new Date(year, month - 1, i + 1);
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                // Find attendance record for this day
                let dayStatus = "–";
                if (summary.attendance_details) {
                  const record = summary.attendance_details.find(
                    (a) => new Date(a.date).getDate() === i + 1
                  );
                  if (record) dayStatus = record.status;
                }

                return (
                  <tr key={i + 1} className={isWeekend ? "bg-gray-200 text-gray-500" : ""}>
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1">{dayName}</td>
                    <td className="border px-2 py-1">{isWeekend ? "Weekend" : dayStatus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
