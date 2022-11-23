import { renderer } from "./renderer.js";


const vnode = {
  type: 'h1',
  children: 'hello world'
}

renderer.render(vnode, document.getElementById('root'))
