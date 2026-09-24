export interface PokemonRef {
  id: number
  name: string
}

export interface PokemonListItem {
  name: string
  url: string
}

export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: PokemonListItem[]
}

export interface PokemonType {
  type: { name: string }
}

export interface PokemonStat {
  base_stat: number
  stat: { name: string }
}

export interface PokemonAbility {
  is_hidden: boolean
  ability: { name: string }
}

export interface PokemonSprites {
  front_default: string | null
  other?: {
    'official-artwork'?: {
      front_default: string | null
    }
  }
}

export interface PokemonDetail {
  id: number
  name: string
  types: PokemonType[]
  stats: PokemonStat[]
  abilities: PokemonAbility[]
  sprites: PokemonSprites
}
