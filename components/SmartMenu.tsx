
import React, { useState, useEffect, useRef } from 'react';
import type { Match } from '../types';

type View = 'setup' | 'scoring' | 'stats' | 'teams' | 'players' | 'history' | 'tournaments';

interface SmartMenuProps {
    activeView: View;
    setActiveView: (view: View) => void;
    currentMatch: Match | null;
    viewDetails: { [key in View]: { 
        label: string;
        title: string; 
        subtitle: string; 
        icon: React.FC<React.SVGProps<SVGSVGElement>>;
    } };
}

const SmartMenu: React.FC<SmartMenuProps> = ({ activeView, setActiveView, currentMatch, viewDetails }) => {
    
    const menuItems = (Object.entries(viewDetails) as [View, typeof viewDetails[View]][])
        .filter(([view]) => view !== 'scoring' || currentMatch);

    const itemRefs = useRef<Map<View, HTMLLIElement>>(new Map());
    const listRef = useRef<HTMLUListElement>(null);
    const [pillStyle, setPillStyle] = useState<React.CSSProperties>({ opacity: 0 });

    useEffect(() => {
        const activeItemEl = itemRefs.current.get(activeView);
        if (activeItemEl && listRef.current) {
            const listRect = listRef.current.getBoundingClientRect();
            const itemRect = activeItemEl.getBoundingClientRect();
            
            setPillStyle({
                width: `${itemRect.width}px`,
                transform: `translateX(${itemRect.left - listRect.left}px)`,
                opacity: 1,
            });
        }
    }, [activeView, menuItems]);

    return (
        <nav className="flex justify-center">
            <ul ref={listRef} className="relative flex items-center justify-center gap-1 flex-wrap p-1 bg-cricket-light-gray/50 rounded-full">
                 <div
                    className="absolute top-1 bottom-1 left-0 bg-cricket-green rounded-full transition-all duration-300 ease-in-out"
                    style={pillStyle}
                />
                {menuItems.map(([view, details]) => {
                    const { icon: Icon, label } = details;
                    const isActive = activeView === view;
                    return (
                        <li 
                            key={view}
                            ref={(el) => {
                                if (el) itemRefs.current.set(view, el);
                                else itemRefs.current.delete(view);
                            }}
                            className="relative group flex justify-center z-10"
                        >
                             <button
                                onClick={() => setActiveView(view)}
                                title={label}
                                className="flex items-center justify-center p-3 rounded-full transition-colors duration-200"
                            >
                                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} />
                            </button>
                            <div
                                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-3 py-1 bg-cricket-light-gray text-white text-sm font-semibold rounded-md shadow-lg
                                           opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                            >
                                {label}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-cricket-light-gray"></div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default SmartMenu;
