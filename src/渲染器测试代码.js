import { renderer } from "./renderer.js";


const vnode = {
  type: 'button',
  props: {
    disabled: '',
    class: 'red'
  },
  children: 'button'
}

renderer.render(vnode, document.getElementById('root'))
