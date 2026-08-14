import assert from 'node:assert/strict'
import test from 'node:test'
import { applySaveRequest, patchAttributes, patchStyle, patchText } from './file-edit'

const source = `<!doctype html><html><body>
<div id="card"><span>Old text</span><img src="old.png"><svg viewBox="0 0 10 10"><path fill="#111" d="M0 0h10v10z"></path></svg></div>
<div class="peer">One</div><div class="peer">Two</div>
<template id="sample"><section><b>Template text</b></section></template>
</body></html>`

test('writes every editable CSS field without dropping existing declarations', () => {
  const styles = {
    'font-size': '18px', 'font-weight': '700', 'line-height': '28px', 'letter-spacing': '1.5px',
    'text-align': 'center', color: '#123456', width: '320px', height: '180px', gap: '12px',
    'padding-left': '11px', 'padding-top': '12px', 'padding-right': '13px', 'padding-bottom': '14px',
    'margin-left': '21px', 'margin-top': '22px', 'margin-right': '23px', 'margin-bottom': '24px',
    'border-radius': '16px', 'border-top-left-radius': '4px', 'border-top-right-radius': '8px',
    'border-bottom-left-radius': '12px', 'border-bottom-right-radius': '20px',
    'background-image': 'linear-gradient(90deg, #000 0%, #fff 100%)',
    'background-color': 'transparent', 'border-style': 'solid', 'border-width': '2px', 'border-color': '#abcdef'
  }
  const result = patchStyle(source, 'div#card', styles)
  for (const [property, value] of Object.entries(styles)) assert.match(result, new RegExp(`${property}: ${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
})

test('writes linked style changes to every requested element', () => {
  const result = applySaveRequest(source, {
    filePath: 'fixture.html', selector: 'div:nth-of-type(2)', selectors: ['div:nth-of-type(2)', 'div:nth-of-type(3)'],
    styles: { width: '144px', 'padding-left': '8px' }, expectedSource: source
  })
  assert.equal((result.match(/width: 144px/g) || []).length, 2)
  assert.equal((result.match(/padding-left: 8px/g) || []).length, 2)
})

test('keeps an edited corner value after an existing border-radius shorthand', () => {
  const input = '<div id="shape" style="border-top-left-radius: 2px; border-radius: 30px;"></div>'
  const result = patchStyle(input, 'div#shape', { 'border-top-left-radius': '7px' })
  assert.match(result, /border-radius: 30px; border-top-left-radius: 7px;/)
})

test('writes one linked radius and removes independent corner overrides', () => {
  const input = '<div id="shape" style="border-radius: 4px; border-top-left-radius: 9px; border-bottom-right-radius: 12px;"></div>'
  const result = patchStyle(input, 'div#shape', {
    'border-radius': '24px',
    'border-top-left-radius': '',
    'border-top-right-radius': '',
    'border-bottom-left-radius': '',
    'border-bottom-right-radius': ''
  })
  assert.match(result, /style="border-radius: 24px;"/)
  assert.doesNotMatch(result, /border-top-left-radius/)
  assert.doesNotMatch(result, /border-bottom-right-radius/)
})

test('writes four independent corner radius values', () => {
  const result = patchStyle('<div id="shape"></div>', 'div#shape', {
    'border-top-left-radius': '4px',
    'border-top-right-radius': '8px',
    'border-bottom-left-radius': '12px',
    'border-bottom-right-radius': '16px'
  })
  assert.match(result, /border-top-left-radius: 4px/)
  assert.match(result, /border-top-right-radius: 8px/)
  assert.match(result, /border-bottom-left-radius: 12px/)
  assert.match(result, /border-bottom-right-radius: 16px/)
})

test('writes text with HTML escaping', () => {
  const result = patchText(source, 'div#card > span:nth-of-type(1)', 'New <safe> & complete')
  assert.match(result, /New &lt;safe&gt; &amp; complete/)
  assert.doesNotMatch(result, /Old text/)
})

test('writes image URL attributes', () => {
  const result = patchAttributes(source, 'div#card > img:nth-of-type(1)', { src: 'images/new&final.png' })
  assert.match(result, /src="images\/new&amp;final\.png"/)
  assert.doesNotMatch(result, /src="old\.png"/)
})

test('writes image styles and URL together', () => {
  const result = applySaveRequest(source, {
    filePath: 'fixture.html', selector: 'div#card > img:nth-of-type(1)',
    styles: { width: '96px', height: '64px', 'border-radius': '8px' },
    attributes: { src: 'images/final.png' }, expectedSource: source
  })
  assert.match(result, /src="images\/final\.png"/)
  assert.match(result, /width: 96px/)
  assert.match(result, /height: 64px/)
  assert.match(result, /border-radius: 8px/)
})

test('writes text and its visual styles in one request', () => {
  const result = applySaveRequest(source, {
    filePath: 'fixture.html', selector: 'div#card > span:nth-of-type(1)',
    styles: { 'font-size': '20px', 'font-weight': '600', color: '#303030' },
    textContent: 'Final label', textNodeIndex: 0, expectedSource: source
  })
  assert.match(result, /font-size: 20px/)
  assert.match(result, /font-weight: 600/)
  assert.match(result, /color: #303030/)
  assert.match(result, />Final label<\/span>/)
})

test('persists disabled fill and stroke states', () => {
  const withPaint = patchStyle(source, 'div#card', { 'background-color': '#ffffff', 'border-style': 'solid', 'border-width': '3px' })
  const result = applySaveRequest(withPaint, {
    filePath: 'fixture.html', selector: 'div#card',
    styles: { 'background-image': 'none', 'background-color': 'transparent', 'border-style': 'none', 'border-width': '0px' },
    expectedSource: withPaint
  })
  assert.match(result, /background-color: transparent/)
  assert.match(result, /border-style: none/)
  assert.match(result, /border-width: 0px/)
})

test('persists cascade-priority paint values used by the live preview fallback', () => {
  const result = patchStyle(source, 'div#card', {
    'background-color': '#ffffff !important',
    'border-style': 'solid !important',
    'border-width': '3px !important',
    'border-color': '#3366ff !important'
  })
  assert.match(result, /background-color: #ffffff !important/)
  assert.match(result, /border-style: solid !important/)
  assert.match(result, /border-width: 3px !important/)
  assert.match(result, /border-color: #3366ff !important/)
})

test('persists the page background on the body element', () => {
  const result = patchStyle(source, 'body:nth-of-type(1)', {
    'background-image': 'none',
    'background-color': '#3157d5'
  })
  assert.match(result, /<body style="background-image: none; background-color: #3157d5;">/)
})

test('replaces SVG first, then preserves root styles and descendant color edits', () => {
  const replacement = '<svg viewBox="0 0 20 20"><path fill="#222" d="M1 1h18v18z"></path></svg>'
  const result = applySaveRequest(source, {
    filePath: 'fixture.html', selector: 'div#card > svg:nth-of-type(1)', styles: { width: '40px', height: '40px' },
    replacementHtml: replacement,
    batchChanges: [{ selector: 'div#card > svg:nth-of-type(1) > path:nth-of-type(1)', styles: { fill: '#ff0000', stroke: '#00ff00' } }],
    expectedSource: source
  })
  assert.match(result, /viewBox="0 0 20 20"/)
  assert.match(result, /width: 40px/)
  assert.match(result, /height: 40px/)
  assert.match(result, /fill: #ff0000/)
  assert.match(result, /stroke: #00ff00/)
})

test('writes container-wide color batches to all mapped selectors', () => {
  const result = applySaveRequest(source, {
    filePath: 'fixture.html', selector: 'div#card', styles: {},
    batchChanges: [
      { selector: 'div#card > span:nth-of-type(1)', styles: { color: '#101010' } },
      { selector: 'div#card > svg:nth-of-type(1) > path:nth-of-type(1)', styles: { fill: '#202020' } }
    ], expectedSource: source
  })
  assert.match(result, /color: #101010/)
  assert.match(result, /fill: #202020/)
})

test('supports sequential edits to multiple elements in the same file', () => {
  const first = applySaveRequest(source, { filePath: 'fixture.html', selector: 'div:nth-of-type(2)', styles: { width: '100px' }, expectedSource: source })
  const second = applySaveRequest(first, { filePath: 'fixture.html', selector: 'div:nth-of-type(3)', styles: { height: '50px' }, expectedSource: first })
  assert.match(second, /class="peer" style="width: 100px;"/)
  assert.match(second, /class="peer" style="height: 50px;"/)
})

test('writes elements inside templates', () => {
  const result = patchStyle(source, 'template#sample > section:nth-of-type(1) > b:nth-of-type(1)', { color: '#445566' })
  assert.match(result, /<b style="color: #445566;">Template text<\/b>/)
})

test('fails loudly instead of silently succeeding when an element cannot be mapped', () => {
  assert.throws(() => patchStyle(source, 'div#missing', { width: '10px' }), /无法在源文件中安全定位元素/)
})

test('deletes the selected element and persists the deletion', () => {
  const result = applySaveRequest(source, { filePath: 'fixture.html', selector: 'div:nth-of-type(2)', styles: {}, removeElement: true, expectedSource: source })
  assert.doesNotMatch(result, /<div class="peer">One<\/div>/)
  assert.match(result, /<div class="peer">Two<\/div>/)
})

test('fails loudly when a request produces no disk change', () => {
  assert.throws(() => applySaveRequest(source, { filePath: 'fixture.html', selector: 'div#card', styles: {}, expectedSource: source }), /没有生成可写入的修改/)
})

test('refuses to overwrite a file changed outside the editor', () => {
  assert.throws(() => applySaveRequest(source.replace('card', 'external-card'), {
    filePath: 'fixture.html', selector: 'div#card', styles: { width: '80px' }, expectedSource: source
  }), /其他程序修改/)
})
