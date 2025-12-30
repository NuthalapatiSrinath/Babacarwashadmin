import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
} from "lucide-react";
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

const RichDateRangePicker = ({ startDate, endDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Internal state for calendar navigation (Year/Month view)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Close when clicking outside
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

  // --- Calendar Logic ---
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  // Handle clicking a day
  const handleDateClick = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${d}`;

    if (!startDate || (startDate && endDate)) {
      // Case 1: Start New Range
      onChange("startDate", dateStr);
      onChange("endDate", "");
    } else {
      // Case 2: Complete Range
      if (new Date(dateStr) < new Date(startDate)) {
        onChange("endDate", startDate);
        onChange("startDate", dateStr);
      } else {
        onChange("endDate", dateStr);
      }
      // Keep open so they can see the selection, or close it:
      // setIsOpen(false);
    }
  };

  // Month Navigation
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

  // --- Render Days Grid ---
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Actual Days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentStr = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const start = startDate;
      const end = endDate;

      const isSelected = currentStr === start || currentStr === end;
      const isInRange = start && end && currentStr > start && currentStr < end;

      // Dynamic Classes
      let classes = "text-slate-700 hover:bg-slate-100 rounded-lg"; // Default

      if (isSelected) {
        classes =
          "bg-indigo-600 text-white font-bold shadow-md rounded-lg scale-105 z-10";
      } else if (isInRange) {
        classes = "bg-indigo-50 text-indigo-700 rounded-none"; // Range styling
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
    if (!startDate && !endDate) return "Select Date Range";
    if (startDate && !endDate) return `${startDate} - ...`;
    return `${startDate} - ${endDate}`;
  };

  return (
    <div
      className="relative w-full md:min-w-[280px] font-sans"
      ref={containerRef}
    >
      {/* INPUT TRIGGER */}
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
            Choose Date
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

      {/* POPUP CALENDAR */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-[calc(100%+8px)] left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-[320px] z-[9999]"
          >
            {/* Header: Selectors */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-2 text-sm font-bold text-slate-700">
                {/* Month Dropdown */}
                <div className="relative group cursor-pointer">
                  <select
                    value={currentDate.getMonth()}
                    onChange={(e) =>
                      changeMonthDropdown(Number(e.target.value))
                    }
                    className="appearance-none bg-transparent hover:bg-slate-50 py-1 px-2 pr-5 rounded cursor-pointer outline-none"
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Year Dropdown */}
                <div className="relative group cursor-pointer">
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
                  <ChevronDown className="absolute right-0 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days Header */}
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

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2 min-h-[220px]">
              {renderCalendarDays()}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const today = new Date().toLocaleDateString("en-CA");
                  onChange("startDate", today);
                  onChange("endDate", today);
                  setCurrentDate(new Date());
                }}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1"
              >
                Today
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RichDateRangePicker;
