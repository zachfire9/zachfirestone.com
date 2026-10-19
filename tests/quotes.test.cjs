const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

class Element {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.children = [];
        this.textContent = '';
        this.hidden = false;
    }
    set innerHTML(_) { throw new Error('Unsafe HTML rendering'); }
    appendChild(child) { this.children.push(child); }
    replaceChildren(...children) { this.children = children; }
}

function load(fetch) {
    const list = new Element();
    const status = new Element('p');
    const requests = [];
    const script = path.join(root, 'quotes.js');
    assert.ok(fs.existsSync(script), 'quotes.js renderer must exist');
    const result = vm.runInNewContext(fs.readFileSync(script, 'utf8'), {
        document: {
            getElementById: (id) => ({ 'quotes-list': list, 'quotes-status': status })[id],
            createElement: (tag) => new Element(tag),
        },
        fetch: (...args) => { requests.push(args); return fetch(...args); },
    });
    return { list, status, requests, result };
}
const response = (data) => Promise.resolve({ ok: true, json: async () => data });

test('page wires the final numbered quotes section and deferred renderer', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(html, /href="#quotes"><span class="nav-number">04<\/span> Quotes<\/a>/);
    assert.match(html, /<section id="quotes" class="section"[\s\S]*id="quotes-list"[\s\S]*<\/section>\s*<\/main>\s*<footer/);
    assert.match(html, /id="quotes-status" role="status"/);
    assert.match(html, /<script src="quotes.js" defer><\/script>/);
});

test('quote styling preserves whitespace and wraps long content; mobile nav has a second row', () => {
    const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
    assert.match(css, /\.quote-card\s*\{[^}]*white-space:\s*pre-wrap;/);
    assert.match(css, /\.quote-card\s*\{[^}]*overflow-wrap:\s*anywhere;/);
    assert.match(css, /@media \(max-width: 480px\)[\s\S]*\.nav\s*\{[^}]*flex-direction:\s*column;/);
});

test('initial source contains only the requested quote', () => {
    const file = path.join(root, 'quotes.json');
    assert.ok(fs.existsSync(file), 'quotes.json source must exist');
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), [{ text: 'Today is the tomorrow I was so worried about yesterday.' }]);
});

test('loads and renders a quote from the JSON source', async () => {
    const view = load(() => response([{ text: 'A quote.' }]));
    await view.result;
    assert.equal(view.requests[0][0], 'quotes.json');
    assert.equal(view.list.children.length, 1);
    assert.equal(view.list.children[0].tagName, 'blockquote');
    assert.equal(view.list.children[0].textContent, 'A quote.');
    assert.equal(view.status.hidden, true);
});

test('shows a loading message while the request is pending', async () => {
    let finish;
    const view = load(() => new Promise((resolve) => { finish = resolve; }));
    assert.equal(view.status.textContent, 'Loading quotes…');
    assert.equal(view.status.hidden, false);
    finish({ ok: true, json: async () => [] });
    await view.result;
});

test('renders multiple quotes in order, preserving newlines and hostile text literally', async () => {
    const texts = ['First\nline\n\nNew paragraph.  ', '<img src=x onerror=alert(1)> & <script>alert(1)</script>', 'x'.repeat(2000)];
    const view = load(() => response(texts.map((text) => ({ text }))));
    await view.result;
    assert.deepEqual(view.list.children.map((card) => card.textContent), texts);
    assert.ok(view.list.children.every((card) => card.children.length === 0));
});

test('shows an empty state for an empty array', async () => {
    const view = load(() => response([]));
    await view.result;
    assert.equal(view.status.textContent, 'No quotes yet.');
    assert.equal(view.status.hidden, false);
    assert.equal(view.list.children.length, 0);
});

for (const data of [null, {}, 'quote', [null], [{}], [{ text: 42 }], [{ text: '  \n' }], [{ text: 'Valid' }, { text: false }]]) {
    test(`rejects invalid quote data: ${JSON.stringify(data)}`, async () => {
        const view = load(() => response(data));
        await view.result;
        assert.equal(view.status.textContent, 'Quotes are unavailable right now. Please try again later.');
        assert.equal(view.status.hidden, false);
        assert.equal(view.list.children.length, 0);
    });
}

for (const [name, fetch] of [
    ['network failure', async () => { throw new Error('offline'); }],
    ['HTTP failure', async () => ({ ok: false, json: async () => [{ text: 'Not a successful response' }] })],
    ['malformed JSON', async () => ({ ok: true, json: async () => { throw new SyntaxError('Bad JSON'); } })],
]) {
    test(`handles ${name} gracefully`, async () => {
        const view = load(fetch);
        await view.result;
        assert.equal(view.status.textContent, 'Quotes are unavailable right now. Please try again later.');
        assert.equal(view.status.hidden, false);
        assert.equal(view.list.children.length, 0);
    });
}
