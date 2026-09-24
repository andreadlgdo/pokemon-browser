export const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-gray-200 text-gray-700',
  fire: 'bg-orange-200 text-orange-800',
  water: 'bg-blue-200 text-blue-800',
  grass: 'bg-green-200 text-green-800',
  electric: 'bg-yellow-200 text-yellow-800',
  ice: 'bg-cyan-200 text-cyan-800',
  fighting: 'bg-red-200 text-red-800',
  poison: 'bg-purple-200 text-purple-800',
  ground: 'bg-amber-200 text-amber-800',
  flying: 'bg-sky-200 text-sky-800',
  psychic: 'bg-pink-200 text-pink-800',
  bug: 'bg-lime-200 text-lime-800',
  rock: 'bg-stone-300 text-stone-800',
  ghost: 'bg-violet-200 text-violet-800',
  dragon: 'bg-indigo-200 text-indigo-800',
  dark: 'bg-slate-300 text-slate-800',
  steel: 'bg-zinc-300 text-zinc-700',
  fairy: 'bg-rose-200 text-rose-800',
}

const DEFAULT_TYPE_COLOR = 'bg-gray-200 text-gray-700'

export const typeColorClass = (type: string): string => TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR
