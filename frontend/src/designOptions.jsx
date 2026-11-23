// Each option has an `id` (what the backend will receive) and a `label`
// (what the user sees). Ids use lowercase_with_underscores so the backend
// can match them reliably.

export const ROOM_TYPES = [
  { id: "living_room", label: "Living room" },
  { id: "bedroom", label: "Bedroom" },
  { id: "kitchen", label: "Kitchen" },
  { id: "dining_room", label: "Dining room" },
  { id: "bathroom", label: "Bathroom" },
  { id: "home_office", label: "Home office" },
];

export const STYLES = [
  { id: "modern", label: "Modern" },
  { id: "minimalist", label: "Minimalist" },
  { id: "scandinavian", label: "Scandinavian" },
  { id: "traditional", label: "Traditional" },
  { id: "industrial", label: "Industrial" },
  { id: "bohemian", label: "Bohemian" },
];

export const PALETTES = [
  { id: "beige_white", label: "Beige & white", colors: ["#E6D8C3", "#FAFAF7"] },
  { id: "warm_neutral", label: "Warm neutral", colors: ["#C8A98B", "#8B6F5A"] },
  { id: "grey_charcoal", label: "Grey & charcoal", colors: ["#B8BCC2", "#3A3D42"] },
  { id: "earth_green", label: "Earthy green", colors: ["#8A9A5B", "#5C4B3A"] },
  { id: "navy_gold", label: "Navy & gold", colors: ["#1F2A44", "#C9A227"] },
  { id: "black_white", label: "Black & white", colors: ["#111111", "#F5F5F5"] },
];

export const MAX_PROMPT_LENGTH = 500;