import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeOption = (value: string) => {
    onChange(selected.filter(item => item !== value));
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 pr-10 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-left flex flex-wrap gap-1 items-center min-h-[42px]"
        >
          {selected.length === 0 ? (
            <span className="text-gray-500">Selecionar...</span>
          ) : (
            selected.map(value => (
              <span key={value} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                {options.find(o => o.value === value)?.label || value}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeOption(value); }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
          <ChevronDown size={20} />
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {options.map(option => (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-blue-50"
              >
                <span>{option.label}</span>
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  readOnly
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            ))}
            {options.length === 0 && <div className="px-4 py-2 text-sm text-gray-500">Nenhuma opção disponível</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelect;
