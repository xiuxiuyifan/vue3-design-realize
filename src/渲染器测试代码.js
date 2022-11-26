import { renderer } from "./renderer.js";
import { effect, ref } from './reactivity.js'


// const vnode = {
//   type: 'button',
//   props: {
//     class: 'red',
//     onClick: [
//       // 第一个事件处理函数
//       () => {
//         alert('clicked 1')
//       },
//       // 第二个事件处理函数
//       () => {
//         alert('clicked 2')
//       }
//     ],
//     onMouseenter: [
//       () => {
//         console.log('mouse 1')
//       },
//       () => {
//         console.log('mouse 2')
//       }
//     ]
//   },
//   children: 'button'
// }

// renderer.render(vnode, document.getElementById('root'))

const bol = ref(false)

effect(() => {
  const vnode = {
    type: 'div',
    props: bol.value ? {
      onClick: () => {
        alert('父元素 clicked')
      }
    } : {},
    children: [
      {
        type: 'p',
        props: {
          onClick: () => {
            console.log('hiii')
            bol.value = true
          }
        },
        children: 'text'
      }
    ]
  }
  renderer.render(vnode, document.getElementById('root'))
})

