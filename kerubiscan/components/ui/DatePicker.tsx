import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Select date", className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      // Create date safely considering timezone issues
      const [year, month, day] = value.split('-').map(Number);
      setCurrentMonth(new Date(year, month - 1, day));
    } else {
      setCurrentMonth(new Date());
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    
    // Toggle off if they click the already selected date
    if (`${year}-${month}-${d}` === value) {
      onChange("");
    } else {
      onChange(`${year}-${month}-${d}`);
    }
    setIsOpen(false);
  };

  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-full"
      >
        <span className="truncate pr-2">
          {value ? value : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-text-muted shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 w-[280px] bg-surface border border-border rounded-lg shadow-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-base rounded transition-colors text-text-muted hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-semibold text-text-main">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button onClick={handleNextMonth} className="p-1 hover:bg-base rounded transition-colors text-text-muted hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(day => (
              <div key={day} className="text-center text-xs font-medium text-text-muted py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-1" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              
              const today = new Date();
              const isToday = today.getFullYear() === currentMonth.getFullYear() && 
                             today.getMonth() === currentMonth.getMonth() && 
                             today.getDate() === day;

              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center text-sm transition-colors mx-auto
                    ${isSelected 
                      ? "bg-primary text-white font-medium" 
                      : isToday
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-text-main hover:bg-base"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
