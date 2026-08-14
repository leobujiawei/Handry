import assert from 'node:assert/strict'
import test from 'node:test'
import { previewUrl } from './preview-url'

test('uses a top-level-only redirect as the preview shell',()=>{
  const source=`<script>
if (window.self === window.top) {
  window.location = '../../assets/phone_template.html?url=../reference/examples/edit-page.html';
}
</script>`
  assert.equal(
    previewUrl('/project/reference/examples/edit-page.html',source),
    'file:///project/assets/phone_template.html?url=../reference/examples/edit-page.html'
  )
})

test('keeps ordinary HTML files on their own file URL',()=>{
  assert.equal(previewUrl('/project/index.html','<main>Page</main>'),'file:///project/index.html')
})

test('does not follow unrelated runtime redirects',()=>{
  const source=`<script>if (loggedOut) window.location = 'login.html'</script>`
  assert.equal(previewUrl('/project/index.html',source),'file:///project/index.html')
})
