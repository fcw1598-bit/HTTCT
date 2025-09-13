import React, { useState, useRef, useEffect } from 'react';
import { UserCircleIcon, TeamIcon } from './Icons';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isVisible, onClose, children }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-cricket-gray text-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;


// -- New Reusable CustomSelect Component --

export interface CustomSelectOption {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'player' | 'team';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = 'Select an option', type = 'player' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const DefaultIcon = type === 'team' ? TeamIcon : UserCircleIcon;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-cricket-light-gray border border-gray-600 rounded-md p-3 text-white focus:ring-1 focus:ring-cricket-green flex items-center justify-between text-left"
      >
        {selectedOption ? (
          <div className="flex items-center gap-3 overflow-hidden">
            {selectedOption.image ? (
              <img src={selectedOption.image} alt={selectedOption.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <DefaultIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
            )}
            <span className="font-semibold truncate">{selectedOption.name}</span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-cricket-gray border border-cricket-light-gray rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {options.map(option => (
              <li
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="px-4 py-2 hover:bg-cricket-light-gray cursor-pointer flex items-center gap-3"
              >
                {option.image ? (
                  <img src={option.image} alt={option.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <DefaultIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                )}
                <div>
                    <p className="font-semibold text-white">{option.name}</p>
                    {option.description && <p className="text-xs text-gray-400">{option.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};