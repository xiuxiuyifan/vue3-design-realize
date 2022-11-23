import { effect, ref } from '../node_modules/@vue/reactivity/dist/reactivity.esm-browser.js'



function renderer(domString, container) {
  container.innerHTML = domString
}

const count = ref(1)

effect(() => {
  renderer(`<h1>${count.value}</h1>`, document.getElementById('root'))
})

setTimeout(() => {
  count.value++
}, 1000);
