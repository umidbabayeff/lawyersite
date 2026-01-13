"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { FaSun, FaMoon } from "react-icons/fa"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500">
                <div className="w-5 h-5" />
            </button>
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle Theme"
        >
            {theme === "dark" ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
        </button>
    )
}
