import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Clock } from "lucide-react";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse initial value or use current date
  const initialDate = value ? new Date(value) : new Date();
  
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  
  // Extract time from value or default to "12:00"
  const [time, setTime] = useState(() => {
    if (value) {
      const d = new Date(value);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return "12:00";
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = [];
  // Adjust so Monday is the first day of the week if preferred, but standard is Sunday
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    updateExternalValue(newDate, time);
  };

  const handleTimeChangeStr = (newTime: string) => {
    setTime(newTime);
    if (selectedDate) {
      updateExternalValue(selectedDate, newTime);
    }
  };

  const adjustTime = (type: 'h' | 'm', delta: number) => {
    let [hStr, mStr] = time.split(':');
    let h = parseInt(hStr || "0");
    let m = parseInt(mStr || "0");
    
    if (type === 'h') {
      h = (h + delta + 24) % 24;
    } else {
      m = (m + delta + 60) % 60;
    }
    
    handleTimeChangeStr(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  const updateExternalValue = (date: Date, timeStr: string) => {
    // Combine date and time into ISO string compatible with datetime-local
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // timeStr is HH:MM
    const combined = `${year}-${month}-${day}T${timeStr}`;
    onChange(combined);
  };

  const formatDisplay = () => {
    if (!selectedDate) return "Select date and time";
    
    const dateStr = selectedDate.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${dateStr} at ${time}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-base border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-left"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-text-muted" />
          <span className={!selectedDate ? "text-text-muted" : "text-text-main"}>
            {formatDisplay()}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-0 w-72 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-4">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button" 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-base rounded-md text-text-muted hover:text-text-main transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-semibold text-text-main">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button 
              type="button" 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-base rounded-md text-text-muted hover:text-text-main transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-medium text-text-muted py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((day, idx) => (
              <div key={idx} className="aspect-square flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
                      isSelected(day) 
                        ? "bg-primary text-white font-medium shadow-md shadow-primary/25" 
                        : isToday(day)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-main hover:bg-base"
                    }`}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>
            ))}
          </div>
          
          <div className="h-px bg-border w-full mb-4" />

          {/* Time Picker */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
              <Clock className="w-4 h-4" />
              Time
            </div>
            <div className="flex items-center gap-1 bg-base border border-border rounded-md px-2 py-0.5">
              <div className="flex flex-col items-center">
                <button type="button" onClick={() => adjustTime('h', 1)} className="p-0.5 text-text-muted hover:text-primary transition-colors hover:bg-surface rounded">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <div className="w-6 text-center text-sm font-semibold text-text-main leading-none py-1 selection:bg-transparent">
                  {time.split(':')[0]}
                </div>
                <button type="button" onClick={() => adjustTime('h', -1)} className="p-0.5 text-text-muted hover:text-primary transition-colors hover:bg-surface rounded">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="text-text-muted font-bold text-sm -mt-0.5">:</div>
              <div className="flex flex-col items-center">
                <button type="button" onClick={() => adjustTime('m', 1)} className="p-0.5 text-text-muted hover:text-primary transition-colors hover:bg-surface rounded">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <div className="w-6 text-center text-sm font-semibold text-text-main leading-none py-1 selection:bg-transparent">
                  {time.split(':')[1]}
                </div>
                <button type="button" onClick={() => adjustTime('m', -1)} className="p-0.5 text-text-muted hover:text-primary transition-colors hover:bg-surface rounded">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
