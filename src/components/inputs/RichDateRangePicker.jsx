import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// --- HELPER 1: Convert ISO (from Backend) to YYYY-MM-DD (for Calendar Display) ---
// Handles: "2025-12-31T18:30:00Z" -> "2026-01-01" (Visual correction for IST)
const toDisplayDate = (isoString, isEndDate) => {
  if (!isoString) return "";
  // If it's already simple YYYY-MM-DD, return it
  if (isoString.length === 10) return isoString;

  const date = new Date(isoString);
  // Add 5 hours 30 mins to shift 18:30 UTC -> 00:00 IST next day
  // Or simply: rely on the fact that 18:30 previous day represents the *start* of the target day.

  if (!isEndDate) {
    // Start Date: If 18:30 prev day, we want to show Next Day.
    // Quick hack: Add 6 hours to push it into the correct visual day
    date.setHours(date.getHours() + 6);
  }

  // Format to YYYY-MM-DD
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

// --- HELPER 2: Convert YYYY-MM-DD (from Click) to ISO 18:30 offset (for API) ---
const toApiDate = (dateStr, isEndDate) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);

  if (isEndDate) {
    // End Date: Current Day 23:59:59 IST -> Current Day 18:29:59 UTC
    // We set UTC hours directly to match your backend requirement
    date.setUTCHours(18, 29, 59, 999);
    return date.toISOString();
  } else {
    // Start Date: Current Day 00:00:00 IST -> Previous Day 18:30:00 UTC
    date.setDate(date.getDate() - 1); // Go back 1 day
    date.setUTCHours(18, 30, 0, 0); // Set to 18:30 UTC
    return date.toISOString();
  }
};

const RichDateRangePicker = ({ startDate, endDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Use display dates for internal calendar logic
  const displayStart = toDisplayDate(startDate, false);
  const displayEnd = toDisplayDate(endDate, true);

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync calendar view when opening
  useEffect(() => {
    if (isOpen && displayStart) {
      const d = new Date(displayStart);
      if (!isNaN(d.getTime())) setCurrentDate(d);
    }
  }, [isOpen, displayStart]);

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDateClick = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const clickedDateStr = `${year}-${month}-${d}`; // YYYY-MM-DD

    // Logic for range selection
    if (!displayStart || (displayStart && displayEnd)) {
      // New Selection Start
      // Convert to API Format immediately
      onChange("startDate", toApiDate(clickedDateStr, false));
      onChange("endDate", "");
    } else {
      // Range Completion
      if (clickedDateStr < displayStart) {
        onChange("endDate", toApiDate(displayStart, true));
        onChange("startDate", toApiDate(clickedDateStr, false));
      } else {
        onChange("endDate", toApiDate(clickedDateStr, true));
      }
      setIsOpen(false);
    }
  };

  // --- SHORTCUTS ---
  const selectThisMonth = () => {
    const d = new Date();
    // 1st of Month
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const startStr = `${start.getFullYear()}-${String(
      start.getMonth() + 1
    ).padStart(2, "0")}-01`;
    // Today
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;

    onChange("startDate", toApiDate(startStr, false));
    onChange("endDate", toApiDate(todayStr, true));

    setCurrentDate(new Date());
    setIsOpen(false);
  };

  const selectToday = () => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;

    onChange("startDate", toApiDate(todayStr, false));
    onChange("endDate", toApiDate(todayStr, true));

    setCurrentDate(new Date());
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
    );
  };
  const changeYear = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
  };
  const changeMonthDropdown = (monthIndex) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentStr = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;

      const isSelected =
        currentStr === displayStart || currentStr === displayEnd;
      const isInRange =
        displayStart &&
        displayEnd &&
        currentStr > displayStart &&
        currentStr < displayEnd;

      let classes = "text-slate-700 hover:bg-slate-100 rounded-lg bg-white";
      if (isSelected) {
        classes =
          "bg-indigo-600 text-white font-bold shadow-md rounded-lg scale-105 z-10 relative";
      } else if (isInRange) {
        classes = "bg-indigo-50 text-indigo-700 rounded-none font-medium";
      }

      days.push(
        <button
          key={day}
          onClick={(e) => {
            e.stopPropagation();
            handleDateClick(day);
          }}
          className={`h-9 w-9 text-xs flex items-center justify-center transition-all duration-200 ${classes}`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const years = Array.from({ length: 20 }, (_, i) => 2020 + i);

  const getDisplayText = () => {
    if (!displayStart && !displayEnd) return "Select Date Range";
    if (displayStart && !displayEnd) return `${displayStart} - ...`;
    return `${displayStart} - ${displayEnd}`;
  };

  return (
    <div
      className="relative w-full md:min-w-[280px] font-sans"
      ref={containerRef}
    >
      <div
        className={`relative flex items-center justify-between w-full h-[50px] px-4 bg-white border rounded-xl cursor-pointer transition-all shadow-sm group ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col justify-center overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
            Date Range
          </span>
          <span
            className={`text-sm font-bold truncate ${
              startDate ? "text-slate-800" : "text-slate-400"
            }`}
          >
            {getDisplayText()}
          </span>
        </div>

        <div className="flex items-center gap-2 pl-2">
          {(startDate || endDate) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange("clear");
              }}
              className="p-1 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <Calendar
            className={`w-5 h-5 transition-colors ${
              isOpen
                ? "text-indigo-600"
                : "text-slate-400 group-hover:text-slate-600"
            }`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-[calc(100%+8px)] left-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 w-[320px] z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-2 text-sm font-bold text-slate-700">
                <select
                  value={currentDate.getMonth()}
                  onChange={(e) => changeMonthDropdown(Number(e.target.value))}
                  className="appearance-none bg-transparent hover:bg-slate-50 py-1 px-2 pr-5 rounded cursor-pointer outline-none"
                >
                  {months.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={currentDate.getFullYear()}
                  onChange={(e) => changeYear(Number(e.target.value))}
                  className="appearance-none bg-transparent hover:bg-slate-50 py-1 px-2 pr-5 rounded cursor-pointer outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-2 text-center border-b border-slate-100 pb-2">
              {daysOfWeek.map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wide"
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 min-h-[220px]">
              {renderCalendarDays()}
            </div>

            {/* Quick Select Buttons */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
              <div className="flex gap-1">
                <button
                  onClick={selectToday}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2 py-1.5 rounded transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={selectThisMonth}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2 py-1.5 rounded transition-colors"
                >
                  This Month
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RichDateRangePicker;
