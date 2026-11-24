ROOM_TYPES = {
    "living_room": "living room",
    "bedroom": "bedroom",
    "kitchen": "kitchen",
    "dining_room": "dining room",
    "bathroom": "bathroom",
    "home_office": "home office",
}

STYLES = {
    "modern": "modern",
    "minimalist": "minimalist",
    "scandinavian": "Scandinavian",
    "traditional": "traditional",
    "industrial": "industrial",
    "bohemian": "bohemian",
}

PALETTES = {
    "beige_white": "beige and white",
    "warm_neutral": "warm neutral",
    "grey_charcoal": "grey and charcoal",
    "earth_green": "earthy green and brown",
    "navy_gold": "navy and gold",
    "black_white": "black and white",
}


class PromptError(ValueError):
    """Raised when a settings id is not one we know."""


def build_prompt(room_type: str, style: str, palette: str, custom: str = "") -> str:
    if room_type not in ROOM_TYPES:
        raise PromptError(f"Unknown room type: {room_type}")
    if style not in STYLES:
        raise PromptError(f"Unknown style: {style}")
    if palette not in PALETTES:
        raise PromptError(f"Unknown colour palette: {palette}")

    parts = [
       f"Redesign this {ROOM_TYPES[room_type]} in {STYLES[style]} style "
        f"with a {PALETTES[palette]} colour palette.",
        # Preserve what exists without suggesting that windows or doors must exist.
        "Keep the existing architecture, wall positions, ceiling height, "
        "floor and camera perspective unchanged.",
    ]

    custom = custom.strip()
    if custom:
        if custom[-1] not in ".!?":
            custom += "."
        parts.append(custom)

   
    parts.append("Photorealistic interior photograph with natural, realistic lighting.")

    return " ".join(parts)


def build_edit_prompt(instruction: str) -> str:
    instruction = instruction.strip()
    if instruction[-1] not in ".!?":
        instruction += "."
    return (
        f"{instruction} Change only what is described above. Keep the rest of "
        "the image, the room layout and the camera perspective as they are."
    )