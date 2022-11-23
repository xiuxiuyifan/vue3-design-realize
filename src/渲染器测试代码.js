import { renderer } from "./renderer.js";


const vnode = {
  type: 'button',
  props: {
    disabled: ''
  },
  children: 'button'
}

renderer.render(vnode, document.getElementById('root'))
