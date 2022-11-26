import { renderer } from "./renderer.js";


const vnode = {
  type: 'button',
  props: {
    class: 'red',
    onClick: [
      // 第一个事件处理函数
      () => {
        alert('clicked 1')
      },
      // 第二个事件处理函数
      () => {
        alert('clicked 2')
      }
    ],
    onMouseenter: [
      () => {
        console.log('mouse 1')
      },
      () => {
        console.log('mouse 2')
      }
    ]
  },
  children: 'button'
}

renderer.render(vnode, document.getElementById('root'))
