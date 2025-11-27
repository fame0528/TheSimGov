# Image Assets Guide

This project loads images directly from the `public/` folder. Place your assets in these directories:

- `public/avatars/` — User avatars (transparent background preferred)
- `public/portraits/` — Registration portrait presets
- `public/company-logos/` — Company logos

## Formats & Dimensions
- Avatars: PNG (preferred) or JPG, 512x512 (min 200x200)
- Portraits: PNG/JPG, up to 1024px width; consistent aspect ratio
- Logos: PNG/JPG/SVG; square 512x512 or wide rectangle recommended

## Naming Conventions
Use kebab-case with descriptive tokens:
- Avatars: `female-asian-01.png`, `male-black-02.png`
- Portraits: `portrait-female-hispanic-01.jpg`, `portrait-male-white-02.png`
- Logos: `acme-industries-logo.png`, `northstar-energy.svg`

## Access URLs
Once added, assets are accessible at:
- `/avatars/<filename>`
- `/portraits/<filename>`
- `/company-logos/<filename>`

## Prompt Sets (Copy/Paste)
Below are human-authoring guides you can paste into your workflow tools to generate consistent sets. Adjust wording to match your style.

### Avatars (Studio Headshot, Transparent Background)
- Style: modern studio headshot, soft key light, subtle rim light, plain neutral background, slight vignette, exported with transparent background
- Framing: shoulders-up, centered, direct eye contact, gentle smile
- Resolution: 512x512 PNG
- Variations: gender × ethnicity combinations, diverse hairstyles and accessories kept subtle

Examples you can paste as labels for your sets:
- "Avatar: female asian 01 — studio headshot, neutral lighting, transparent background, 512x512 PNG"
- "Avatar: male black 02 — studio headshot, neutral lighting, transparent background, 512x512 PNG"
- "Avatar: female hispanic 03 — studio headshot, neutral lighting, transparent background, 512x512 PNG"
- "Avatar: male white 04 — studio headshot, neutral lighting, transparent background, 512x512 PNG"

### Portraits (Registration Presets)
- Style: editorial portrait, gentle contrast, soft color grading, clean background
- Framing: chest-up, slight angle, friendly expression
- Resolution: up to 1024px width JPG/PNG
- Naming: prefix with `portrait-<gender>-<ethnicity>-NN`

Examples:
- "Portrait: female asian 01 — editorial chest-up, clean background, 1024w JPG"
- "Portrait: male black 02 — editorial chest-up, clean background, 1024w JPG"

### Company Logos
- Style: flat or semi-flat, clear wordmark + icon optional, high contrast, transparent or white background
- Resolution: 512x512 PNG or SVG for scalability; wide variant optional
- Naming: `<company-name>-logo.(png|svg)`

Examples:
- "Logo: acme industries — flat icon + wordmark, 512x512 PNG"
- "Logo: northstar energy — star motif, SVG"

## Tips
- Keep backgrounds consistent to avoid visual noise.
- Maintain a simple, reusable color palette.
- Export with proper metadata and compression.
- Verify file paths after copying into `public/`.

---
Generated for local, manual image workflows so you can paste prompts and produce consistent assets without any AI generation in this codebase.

## Leonardo Copy/Paste Prompts (Avatars)
Use these as-is, then export 512x512 PNG with transparent background. Replace attire or accessories if you prefer, but keep the studio/neutral style for consistency.

### Female
- Asian:
	Professional headshot portrait photograph of an adult Asian female, similar to official US government portrait, neutral expression, direct eye contact with camera, wearing dark navy suit jacket and white blouse, minimal jewelry, plain light gray gradient background, studio lighting with soft key and subtle rim, soft shadows, sharp focus on face, dignified and professional presence, high resolution, photorealistic, centered framing, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `female-asian-01.png`
	- `female-asian-02.png`
	- `female-asian-03.png`
	- `female-asian-04.png`
	- `female-asian-05.png`

- Black:
	Professional headshot portrait photograph of an adult Black female, similar to official US government portrait, neutral expression, direct eye contact, wearing charcoal blazer and light-colored blouse, plain light gray gradient background, studio lighting with soft key and gentle rim light, soft shadows, sharp focus on face, dignified professional presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `female-black-01.png`
	- `female-black-02.png`
	- `female-black-03.png`
	- `female-black-04.png`
	- `female-black-05.png`

- Hispanic/Latina:
	Professional headshot portrait photograph of an adult Hispanic female, similar to official US government portrait, neutral expression, direct eye contact, wearing navy blazer and pastel blouse, plain light gray gradient background, studio lighting with soft key and subtle rim, soft shadows, sharp facial focus, dignified professional presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `female-hispanic-01.png`
	- `female-hispanic-02.png`
	- `female-hispanic-03.png`
	- `female-hispanic-04.png`
	- `female-hispanic-05.png`

- Middle Eastern:
	Professional headshot portrait photograph of an adult Middle Eastern female, similar to official US government portrait, neutral expression, direct eye contact, wearing black blazer and white blouse, optional modest jewelry, plain light gray gradient background, studio lighting with soft key and subtle rim, soft shadows, sharp focus on face, dignified professional presence, high resolution, photorealistic, centered framing, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `female-middle-eastern-01.png`
	- `female-middle-eastern-02.png`
	- `female-middle-eastern-03.png`
	- `female-middle-eastern-04.png`
	- `female-middle-eastern-05.png`

- Native American:
	Professional headshot portrait photograph of an adult Native American female, similar to official US government portrait, neutral expression, direct eye contact, wearing dark blazer and cream blouse, minimal accessories, plain light gray gradient background, studio lighting with soft key and subtle rim, soft shadows, sharp facial focus, dignified professional presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `female-native-american-01.png`
	- `female-native-american-02.png`
	- `female-native-american-03.png`
	- `female-native-american-04.png`
	- `female-native-american-05.png`

- White/Caucasian:
	Professional headshot portrait photograph of an adult Caucasian female, similar to official US government portrait, neutral expression, direct eye contact, wearing navy blazer and white blouse, plain light gray gradient background, soft studio key light and subtle rim light, soft shadows, sharp facial focus, dignified professional presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `female-white-01.png`
	- `female-white-02.png`
	- `female-white-03.png`
	- `female-white-04.png`
	- `female-white-05.png`

### Male
- Asian:
	Professional headshot portrait photograph of an adult Asian male, similar to official US Congress member portrait, neutral expression, direct eye contact with camera, wearing dark navy suit, white dress shirt, conservative tie, plain light gray gradient background, studio lighting with soft key and subtle rim, soft shadows, sharp focus on face, dignified and authoritative presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `male-asian-01.png`
	- `male-asian-02.png`
	- `male-asian-03.png`
	- `male-asian-04.png`
	- `male-asian-05.png`

- Black:
	Professional headshot portrait photograph of an adult Black male, similar to official US Congress member portrait, neutral expression, direct eye contact, wearing charcoal suit, white dress shirt, conservative tie, plain light gray gradient background, studio lighting with soft key and gentle rim light, soft shadows, sharp facial focus, dignified and authoritative presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `male-black-01.png`
	- `male-black-02.png`
	- `male-black-03.png`
	- `male-black-04.png`
	- `male-black-05.png`

- Hispanic/Latino:
	Professional headshot portrait photograph of an adult Hispanic male, similar to official US Congress member portrait, neutral expression, direct eye contact, wearing navy suit, white dress shirt, conservative tie, plain light gray gradient background, studio lighting with soft key and subtle rim, soft shadows, sharp focus on face, dignified and authoritative presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `male-hispanic-01.png`
	- `male-hispanic-02.png`
	- `male-hispanic-03.png`
	- `male-hispanic-04.png`
	- `male-hispanic-05.png`

- Middle Eastern:
	Professional headshot portrait photograph of an adult Middle Eastern male, similar to official US Congress member portrait, neutral expression, direct eye contact, wearing black or dark charcoal suit, white dress shirt, conservative tie, plain light gray gradient background, studio lighting with soft key and subtle rim, soft shadows, sharp facial focus, dignified and authoritative presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `male-middle-eastern-01.png`
	- `male-middle-eastern-02.png`
	- `male-middle-eastern-03.png`
	- `male-middle-eastern-04.png`
	- `male-middle-eastern-05.png`

- Native American:
	Professional headshot portrait photograph of an adult Native American male, similar to official US Congress member portrait, neutral expression, direct eye contact, wearing dark suit, white dress shirt, conservative tie, plain light gray gradient background, studio lighting with soft key and subtle rim, soft shadows, sharp focus on face, dignified and authoritative presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `male-native-american-01.png`
	- `male-native-american-02.png`
	- `male-native-american-03.png`
	- `male-native-american-04.png`
	- `male-native-american-05.png`

- White/Caucasian:
	Professional headshot portrait photograph of a middle-aged Caucasian male, similar to official US Congress member portrait, neutral expression, direct eye contact with camera, wearing dark navy suit with red tie, white dress shirt, American flag lapel pin optional, plain light gray gradient background, studio lighting with soft shadows, sharp focus on face, dignified and authoritative presence, high resolution, photorealistic, centered, shoulders up, export 512x512 PNG with transparent background

	Suggested filenames:
	- `male-white-01.png`
	- `male-white-02.png`
	- `male-white-03.png`
	- `male-white-04.png`
	- `male-white-05.png`
