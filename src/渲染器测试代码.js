import { renderer } from "./renderer.js";


const vnode = {
  type: 'div',
  props: {
    id: 'foo'
  },
  children: [
    {
      type: 'p',
      children: 'hello'
    }
  ]
}

renderer.render(vnode, document.getElementById('root'))
