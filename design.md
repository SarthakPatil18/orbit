# Design reference

Source: https://bharpai.app/
Page: Bharpai: split bills over UPI. Friends never install anything.

Measured from 371 rendered elements at 1440 x 812px. This is a sample of the current document and state, not the original design source.

## Color palette

Only observed CSS colors are listed. Usage labels describe where a color was found. Hex is an sRGB preview; retain the original CSS value for its color space and transparency.

Usage | Original CSS value | sRGB hex | Observed root properties | Occurrences
--- | --- | --- | --- | ---
Text | rgb(9, 9, 11) | #09090B | --color-ink, --chart-foreground | 107
Text | rgb(107, 107, 116) | #6B6B74 | --chart-foreground-muted, --color-mut, --chart-label, --chart-3 | 39
Text | rgb(255, 255, 255) | #FFFFFF | --tw-ring-offset-color, --color-white | 23
Text | oklab(0.999994 0.0000455677 0.0000200868 / 0.8) | #FFFFFFCC |  | 8
Text | oklab(0.140764 0.00120224 -0.00421676 / 0.75) | #09090BBF |  | 7
Surface | rgb(255, 255, 255) | #FFFFFF | --tw-ring-offset-color, --color-white | 40
Surface | rgb(9, 9, 11) | #09090B | --color-ink, --chart-foreground | 27
Surface | rgb(236, 236, 234) | #ECECEA |  | 12
Surface | oklab(0.999994 0.0000455678 0.0000200868 / 0.9) | #FFFFFFE6 |  | 6
Surface | rgb(244, 244, 245) | #F4F4F5 |  | 6
Surface | rgb(220, 220, 216) | #DCDCD8 | --color-card | 5
Surface | rgb(39, 39, 42) | #27272A |  | 5
Border | rgb(228, 228, 231) | #E4E4E7 | --border, --color-line | 8
Border | rgb(9, 9, 11) | #09090B | --color-ink, --chart-foreground | 6
Border | rgb(236, 236, 234) | #ECECEA |  | 4
Border | rgb(255, 255, 255) | #FFFFFF | --tw-ring-offset-color, --color-white | 1
Icon | rgb(9, 9, 11) | #09090B | --color-ink, --chart-foreground | 68
Icon | rgb(255, 255, 255) | #FFFFFF | --tw-ring-offset-color, --color-white | 12
Icon | oklab(0.999994 0.0000455678 0.0000200868 / 0.5) | #FFFFFF80 |  | 2

## Typography

Role | Family | Size | Weight | Line height | Tracking | Text transform
--- | --- | --- | --- | --- | --- | ---
Section heading | "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif | 68px | 700 | 66.64px | -2.38px | none
Subheading | "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif | 22px | 700 | 27.5px | -0.44px | none
Body | Inter, ui-sans-serif, system-ui, sans-serif | 15px | 400 | 24.375px | normal | none
Small text | ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace | 10.5px | 400 | 16.275px | normal | none
Button | "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif | 16px | 400 | 24px | normal | none

## Spacing

Value | Occurrences
--- | ---
2px | 6
3px | 12
4px | 9
6px | 22
8px | 6
10px | 24
12px | 7
14px | 23
16px | 16
20px | 29
24px | 10
32px | 14
36px | 4
48px | 4
56px | 8
90.5px | 2
144px | 5
152.5px | 2
192px | 3
492px | 2

## Layout gaps

Value | Occurrences
--- | ---
6px | 48
8px | 4
12px | 38
20px | 2
24px | 2
40px | 8
56px | 4

## Corner radii

Value | Occurrences
--- | ---
3px | 12
5px | 7
6px | 12
8px | 28
12px | 104
16px | 21
22px | 16
28px | 4
30px | 4
1.48713e+07px | 12
1.66441e+07px | 20
1.67772e+07px | 152

## Shadows

Value | Occurrences
--- | ---
rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(9, 9, 11, 0.4) 0px 8px 20px -12px | 4
rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(9, 9, 11, 0.35) 0px 8px 24px -14px | 1
rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(9, 9, 11, 0.5) 0px 8px 24px -14px | 1
rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(9, 9, 11, 0.45) 0px 40px 80px -40px | 1

## Motion durations

Value | Occurrences
--- | ---
0.15s | 30
0.3s | 3
0.2s | 2

## Motion easing

Value | Occurrences
--- | ---
cubic-bezier(0.4, 0, 0.2, 1) | 33
cubic-bezier(0.22, 1, 0.36, 1) | 2

### Accessible keyframe names

- rise
- mark-in
- phone-in
- marquee
- marquee-4
- spin
- typing
- scan

## Component recipes

Computed styles for the captured state. Selectors identify sampled elements; text and placeholders come from the page. Form values are excluded. These style specimens do not reconstruct child markup or uncaptured interaction states.

### Button 1

Observed text or placeholder: English

```css
button.relative.cursor-pointer {
  align-items: normal;
  backdrop-filter: none;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-bottom-color: rgb(255, 255, 255);
  border-bottom-style: solid;
  border-bottom-width: 0px;
  border-left-color: rgb(255, 255, 255);
  border-left-style: solid;
  border-left-width: 0px;
  border-radius: 1.67772e+07px;
  border-right-color: rgb(255, 255, 255);
  border-right-style: solid;
  border-right-width: 0px;
  border-top-color: rgb(255, 255, 255);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(255, 255, 255);
  display: block;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 20px;
  opacity: 1;
  padding-bottom: 10px;
  padding-left: 24px;
  padding-right: 24px;
  padding-top: 10px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | rgb(236, 236, 234) | none | 1
2 | rgb(236, 236, 234) | none | 1
3 | rgb(255, 255, 255) | none | 1

### Button 2

Observed text or placeholder: हिंदी

```css
button.relative.cursor-pointer {
  align-items: normal;
  backdrop-filter: none;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-bottom-color: rgb(107, 107, 116);
  border-bottom-style: solid;
  border-bottom-width: 0px;
  border-left-color: rgb(107, 107, 116);
  border-left-style: solid;
  border-left-width: 0px;
  border-radius: 1.67772e+07px;
  border-right-color: rgb(107, 107, 116);
  border-right-style: solid;
  border-right-width: 0px;
  border-top-color: rgb(107, 107, 116);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(107, 107, 116);
  display: block;
  font-family: "Anek Devanagari", sans-serif;
  font-size: 16px;
  font-weight: 600;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 24px;
  opacity: 1;
  padding-bottom: 10px;
  padding-left: 24px;
  padding-right: 24px;
  padding-top: 10px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | rgb(236, 236, 234) | none | 1
2 | rgb(236, 236, 234) | none | 1
3 | rgb(255, 255, 255) | none | 1

### Button 3

Observed text or placeholder: Monthly

```css
button.relative.cursor-pointer {
  align-items: normal;
  backdrop-filter: none;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-bottom-color: rgb(107, 107, 116);
  border-bottom-style: solid;
  border-bottom-width: 0px;
  border-left-color: rgb(107, 107, 116);
  border-left-style: solid;
  border-left-width: 0px;
  border-radius: 1.67772e+07px;
  border-right-color: rgb(107, 107, 116);
  border-right-style: solid;
  border-right-width: 0px;
  border-top-color: rgb(107, 107, 116);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(107, 107, 116);
  display: block;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 20px;
  opacity: 1;
  padding-bottom: 8px;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 8px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | rgb(236, 236, 234) | none | 1
2 | rgb(236, 236, 234) | none | 1
3 | rgb(255, 255, 255) | none | 1

### Card 1

Observed text or placeholder: GG Goa gang Aarav, Meera, Kabir, Riya Dinner was ₹4,800. Tap your name and pay your share: Goa dinner · ₹4,800 bharpai.a

```css
div.w-\[330px\].rounded-\[30px\] {
  align-items: normal;
  backdrop-filter: none;
  background-color: rgb(220, 220, 216);
  background-image: none;
  border-bottom-color: rgb(9, 9, 11);
  border-bottom-style: solid;
  border-bottom-width: 0px;
  border-left-color: rgb(9, 9, 11);
  border-left-style: solid;
  border-left-width: 0px;
  border-radius: 30px;
  border-right-color: rgb(9, 9, 11);
  border-right-style: solid;
  border-right-width: 0px;
  border-top-color: rgb(9, 9, 11);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(9, 9, 11, 0.45) 0px 40px 80px -40px;
  color: rgb(9, 9, 11);
  display: block;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 24px;
  opacity: 1;
  padding-bottom: 12px;
  padding-left: 12px;
  padding-right: 12px;
  padding-top: 12px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | rgb(236, 236, 234) | none | 1
2 | rgb(236, 236, 234) | none | 1

### Card 2

Observed text or placeholder: NO APP FOR FRIENDS Drop the link in the group. Friends tap their name, get their own QR, and pay from the UPI app they a

```css
div.relative.text-center {
  align-items: normal;
  backdrop-filter: none;
  background-color: rgb(220, 220, 216);
  background-image: none;
  border-bottom-color: rgb(9, 9, 11);
  border-bottom-style: solid;
  border-bottom-width: 0px;
  border-left-color: rgb(9, 9, 11);
  border-left-style: solid;
  border-left-width: 0px;
  border-radius: 22px;
  border-right-color: rgb(9, 9, 11);
  border-right-style: solid;
  border-right-width: 0px;
  border-top-color: rgb(9, 9, 11);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(9, 9, 11);
  display: block;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 24px;
  opacity: 1;
  padding-bottom: 36px;
  padding-left: 32px;
  padding-right: 32px;
  padding-top: 48px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | rgb(236, 236, 234) | none | 1
2 | rgb(236, 236, 234) | none | 1

## Layout measurements

Element | Width | Display | Columns | Gap | Padding (T R B L)
--- | --- | --- | --- | --- | ---
header | 1425px | block | none | normal | 0px 0px 0px 0px
main | 1425px | block | none | normal | 0px 0px 0px 0px
section | 1425px | block | none | normal | 0px 0px 0px 0px
section | 1425px | block | none | normal | 0px 0px 144px 0px
section | 1425px | block | none | normal | 0px 0px 128px 0px
section | 1425px | block | none | normal | 96px 0px 144px 0px
section | 1425px | block | none | normal | 0px 32px 144px 32px
section | 1425px | block | none | normal | 0px 20px 20px 20px
section | 1425px | block | none | normal | 0px 0px 0px 0px
section | 1425px | block | none | normal | 0px 0px 0px 0px

## Responsive conditions

- `(hover: hover)`
- `not all and (min-width: 389px)`
- `not all and (min-width: 80rem)`
- `not all and (min-width: 64rem)`
- `(min-width: 1280px)`
- `(min-width: 40rem)`
- `(min-width: 48rem)`
- `(min-width: 64rem)`
- `(min-width: 80rem)`
- `(prefers-reduced-motion: reduce)`

## CSS custom properties

Names and values read from the root element; no new token names or ramps were generated.

Property | Value
--- | ---
--container-md | 28rem
--border | #e4e4e7
--tw-ring-offset-shadow | 0 0 #0000
--chart-foreground-muted | #6b6b74
--tw-inset-shadow-alpha | 100%
--tw-ring-shadow | 0 0 #0000
--text-2xl | 1.5rem
--tracking-tight | -.025em
--leading-relaxed | 1.625
--leading-snug | 1.375
--tw-drop-shadow-alpha | 100%
--text-lg | 1.125rem
--default-transition-timing-function | cubic-bezier(.4, 0, .2, 1)
--color-ink | #09090b
--text-2xl--line-height | calc(2 / 1.5)
--tw-inset-ring-shadow | 0 0 #0000
--text-base--line-height | 1.5
--spacing | .25rem
--tw-translate-z | 0
--tw-scale-y | 1
--font-mono | ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace
--font-weight-semibold | 600
--text-sm | .875rem
--tw-translate-y | 0
--tw-inset-shadow | 0 0 #0000
--tw-ring-offset-color | #fff
--text-lg--line-height | calc(1.75 / 1.125)
--tw-content | ""
--color-white | #fff
--chart-5 | #d4d4d8
--tw-shadow-alpha | 100%
--leading-tight | 1.25
--color-mut | #6b6b74
--font-sans | "Inter", ui-sans-serif, system-ui, sans-serif
--tw-divide-y-reverse | 0
--tw-scale-z | 1
--tw-border-style | solid
--font-weight-bold | 700
--chart-label | #6b6b74
--color-line | #e4e4e7
--tracking-normal | 0em
--tw-shadow | 0 0 #0000
--text-sm--line-height | calc(1.25 / .875)
--tw-translate-x | 0
--tw-ring-offset-width | 0px
--tw-scroll-snap-strictness | proximity
--text-xs | .75rem
--text-xs--line-height | calc(1 / .75)
--default-font-family | "Inter", ui-sans-serif, system-ui, sans-serif
--font-weight-medium | 500
--tw-scale-x | 1
--chart-3 | #6b6b74
--chart-foreground | #09090b
--color-card | #dcdcd8
--default-transition-duration | .15s
--chart-4 | #a1a1aa
--chart-2 | #3f3f46
--font-display | "Space Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif
--radius-xl | .75rem
--radius-2xl | 1rem

## Capture coverage

- 0 stylesheet(s) could not be inspected. Computed styles are still measured.
- Sampling excludes hidden elements and Sitepeel tools. Offscreen rendered elements may be included. Counts refer to the sample, not the entire website.
- Colors are CSS values, not a screenshot pixel palette. Images, compositing and gradients can affect their visible appearance.
- Hover, focus, active states, other viewport sizes, iframe documents and shadow trees need separate captures.
- No inferred brand personality, invented colors, placeholder copy or unobserved code is presented as a page measurement.
