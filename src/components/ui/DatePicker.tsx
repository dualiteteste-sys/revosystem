import React from 'react';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, name, className, ...props }) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={name}
      name={name}
      type="datetime-local"
      {...props}
      className="w-full p-2 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
    />
  </div>
);

export default DatePicker;
