// Independent of the portfolio's scroll and animation behavior.
(async () => {
    const list = document.getElementById('quotes-list');
    const status = document.getElementById('quotes-status');
    status.textContent = 'Loading quotes…';
    status.hidden = false;

    try {
        const response = await fetch('quotes.json');
        if (!response.ok) throw new Error('Could not fetch quotes');
        const quotes = await response.json();
        // Validate everything before rendering so malformed data never leaves a partial list.
        if (!Array.isArray(quotes) || !quotes.every((quote) =>
            quote !== null && typeof quote === 'object' &&
            typeof quote.text === 'string' && quote.text.trim().length > 0
        )) {
            throw new Error('Invalid quotes data');
        }

        for (const quote of quotes) {
            const card = document.createElement('blockquote');
            card.className = 'quote-card';
            card.textContent = quote.text;
            list.appendChild(card);
        }
        status.textContent = quotes.length ? '' : 'No quotes yet.';
        status.hidden = quotes.length > 0;
    } catch {
        list.replaceChildren();
        status.textContent = 'Quotes are unavailable right now. Please try again later.';
        status.hidden = false;
    }
})();
