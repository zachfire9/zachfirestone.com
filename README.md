# Zach Firestone's portfolio

Plain static HTML, CSS, and JavaScript; no build step or packages required.

## Quotes

Edit `quotes.json` in the site root to add, reorder, or remove quotes. It must be a JSON array of objects, each with a nonempty string `text` and an optional string `attribution`:

```json
[
  { "text": "Today is the tomorrow I was so worried about yesterday." },
  {
    "text": "Sometimes the light's all shinin' on me\nOther times I can barely see\nLately it occurs to me\nWhat a long, strange trip it's been",
    "attribution": "Grateful Dead"
  }
]
```

Within a JSON string, write `\n` for a line break and `\n\n` for a blank line. Do not put literal, unescaped line breaks inside JSON strings. Escape double quotes as `\"`. Text is displayed literally (not HTML or Markdown), preserving line breaks and spaces and wrapping long content. Each object becomes a separate quote card, in source order.

Attribution is displayed literally in a separate styled element below the quote. Omit `attribution`, or use an empty or whitespace-only string, to show no attribution label. When present, it must be a string; non-string values (including `null`) are invalid.

An empty array (`[]`) shows “No quotes yet.” Malformed JSON, invalid entries (including blank text or non-string attribution), and failed requests show a friendly unavailable message rather than a partial list. Editing this source file is the only content-management workflow; there is no upload UI.

## Local preview

Serve the directory over HTTP; opening `index.html` directly with `file://` cannot reliably fetch the JSON file:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit http://127.0.0.1:8000. Keep `quotes.json` alongside `index.html` when publishing to a static host.

## Tests

Node.js 18+; uses only built-in modules and a small fake DOM to execute the actual renderer:

```sh
node --test tests/quotes.test.cjs
node --check quotes.js
node --check script.js
```
