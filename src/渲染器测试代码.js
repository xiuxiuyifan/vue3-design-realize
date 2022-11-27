import { Fragment, renderer, Text } from "./renderer.js";
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

// const bol = ref(false)

// effect(() => {
//   const vnode = {
//     type: 'div',
//     props: bol.value ? {
//       onClick: () => {
//         alert('父元素 clicked')
//       }
//     } : {},
//     children: [
//       {
//         type: 'p',
//         props: {
//           onClick: () => {
//             console.log('hiii')
//             bol.value = true
//           }
//         },
//         children: 'text'
//       }
//     ]
//   }
//   renderer.render(vnode, document.getElementById('root'))
// })


// // 老的 vnode
// // 子节点是 数组
// const oldVnode = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       children: 'p1'
//     },
//     {
//       type: 'p',
//       children: 'p2'
//     }
//   ]
// }

// renderer.render(oldVnode, document.getElementById('root'))


// // 新的虚拟节点
// const newVnode = {
//   type: 'div',
//   children: 'text'
// }

// setTimeout(() => {
//   renderer.render(newVnode, document.getElementById('root'))
// }, 2000);


// // 老的 vnode 是字符串
// const oldVnode = {
//   type: 'div',
//   children: 'text'
// }
// // 老的 vnode 是 null
// // const oldVnode = {
// //   type: 'div',
// //   children: null
// // }

// renderer.render(oldVnode, document.getElementById('root'))


// // 新的是子虚拟节点是数组
// const newVnode = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       children: 'p1'
//     },
//     {
//       type: 'p',
//       children: 'p2'
//     }
//   ]
// }

// setTimeout(() => {
//   renderer.render(newVnode, document.getElementById('root'))
// }, 2000);


// // 老的 vnode 是 null
// const oldVnode = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       children: 'p1'
//     },
//     {
//       type: 'p',
//       children: 'p2'
//     }
//   ]
// }

// renderer.render(oldVnode, document.getElementById('root'))


// // 新的是子虚拟节点是数组
// const newVnode = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       children: 'p3'
//     },
//     {
//       type: 'p',
//       children: 'p4'
//     }
//   ]
// }

// setTimeout(() => {
//   renderer.render(newVnode, document.getElementById('root'))
// }, 2000);


// 老的 vnode 是 null
// const oldVnode = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       children: 'p1'
//     },
//     {
//       type: 'p',
//       children: 'p2'
//     }
//   ]
// }

// // 老的 vnode 是 文本
// const oldVnode = {
//   type: 'div',
//   children: 'old text'
// }

// renderer.render(oldVnode, document.getElementById('root'))


// // 新的是子虚拟节点是 null
// const newVnode = {
//   type: 'div',
//   children: null
// }


// setTimeout(() => {
//   renderer.render(newVnode, document.getElementById('root'))
// }, 2000);


// // 渲染一个文本节点
// const textVnode = {
//   type: Text,
//   children: 'textVnode'
// }

// renderer.render(textVnode, document.getElementById('root'))


// 渲染文本节点
// const textVnode = {
//   type: Text,
//   children: 'textVnode'
// }

// renderer.render(textVnode, document.getElementById('root'))


// const newTextVnode = {
//   type: Text,
//   children: 'newText'
// }
// setTimeout(() => {
//   renderer.render(newTextVnode, document.getElementById('root'))
// }, 2000);


// const textVnode = {
//   type: Fragment,
//   children: [
//     {
//       type: 'p',
//       children: 'p1'
//     },
//     {
//       type: 'p',
//       children: 'p2'
//     },
//     {
//       type: 'p',
//       children: 'p3'
//     }
//   ]
// }

// renderer.render(textVnode, document.getElementById('root'))



const oldVnode = {
  type: Fragment,
  children: [
    {
      type: 'p',
      children: 'p1'
    },
    {
      type: 'p',
      children: 'p2'
    },
    {
      type: 'p',
      children: 'p3'
    }
  ]
}

const newVnode = {
  type: Fragment,
  children: [
    {
      type: 'p',
      children: 'p4'
    },
    {
      type: 'p',
      children: 'p5'
    },
    {
      type: 'p',
      children: 'p6'
    }
  ]
}
renderer.render(oldVnode, document.getElementById('root'))

setTimeout(() => {
  renderer.render(newVnode, document.getElementById('root'))
}, 2000);


