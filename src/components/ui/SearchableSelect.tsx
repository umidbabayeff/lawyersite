"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

interface SearchableSelectProps {
    items: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    icon?: React.ReactNode;
    className?: string;
}

export default function SearchableSelect({ items, value, onChange, placeholder, icon, className }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredItems = items.filter(item =>
        item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative flex-1" ref={wrapperRef}>
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                    {icon}
                </div>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={className || "w-full pl-10 pr-10 py-3 bg-white/10 rounded-xl text-white cursor-pointer hover:bg-white/20 transition-all border border-transparent focus:border-accent/50 flex items-center justify-between"}
            >
                <span className={value ? (className ? "text-gray-900 dark:text-white" : "text-white") : "text-slate-400"}>
                    {value || placeholder}
                </span>
                <FaChevronDown className={`text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl z-50 overflow-hidden text-gray-800 dark:text-gray-200 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-gray-100 dark:border-slate-800">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <div
                                    key={item}
                                    className={`px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm ${value === item ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary-foreground font-medium' : ''}`}
                                    onClick={() => {
                                        onChange(item);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                >
                                    {item}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
