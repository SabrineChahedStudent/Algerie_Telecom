import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

/* ─── Lightweight custom Select (no Radix dependency) ─── */

const SelectContext = React.createContext()

function Select({ children, onValueChange, value, required }) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState(value || '')
  const [selectedLabel, setSelectedLabel] = React.useState('')
  const ref = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val, label) => {
    setSelected(val)
    setSelectedLabel(label)
    onValueChange?.(val)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ open, setOpen, selected, selectedLabel, handleSelect }}>
      <div ref={ref} className="relative">
        {children}
        {required && <input type="text" value={selected} required tabIndex={-1} className="sr-only" onChange={() => {}} />}
      </div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({ children, className }) {
  const { open, setOpen } = React.useContext(SelectContext)
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform shrink-0", open && "rotate-180")} />
    </button>
  )
}

function SelectValue({ placeholder }) {
  const { selected, selectedLabel } = React.useContext(SelectContext)
  return <span className={cn(!selected && "text-slate-500")}>{selectedLabel || selected || placeholder}</span>
}

function SelectContent({ children, className }) {
  const { open } = React.useContext(SelectContext)
  if (!open) return null
  return (
    <div className={cn(
      "absolute z-[100] mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-xl",
      className
    )}>
      {children}
    </div>
  )
}

function SelectItem({ children, value, label, className }) {
  const { selected, handleSelect } = React.useContext(SelectContext)
  const itemRef = React.useRef(null)

  const onClick = () => {
    // Use explicit label prop, or extract text content from the DOM element
    const displayLabel = label || (itemRef.current ? itemRef.current.textContent : String(children))
    handleSelect(value, displayLabel)
  }

  return (
    <div
      ref={itemRef}
      onClick={onClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-slate-100 transition-colors",
        selected === value && "bg-slate-100 font-semibold",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
