import { ref } from "./reactivity"
import { renderer } from "./renderer"

// const MyComponent = {
//   name: 'MyComponent',
//   render() {
//     return {
//       type: 'div',
//       children: '我是文本内容'
//     }
//   }
// }

// // 用来描述组件的 vnode 对象， type 属性值为组件的选项对象
// const CompVNode = {
//   type: MyComponent
// }

// renderer.render(CompVNode, document.getElementById('root'))



//  组件状态
// const MyComponent = {
//   name: 'MyComponent',
//   data() {
//     return {
//       foo: 'hello world'
//     }
//   },
//   beforeCreate() {
//     console.log('beforeCreate')
//   },
//   created() {
//     console.log('created')
//   },
//   beforeMount() {
//     console.log('beforeMount')
//   },
//   mounted() {
//     console.log('mounted')
//   },
//   beforeUpdate() {
//     console.log('beforeUpdate')
//   },
//   updated() {
//     console.log('updated')
//   },
//   render() {
//     return {
//       type: 'div',
//       children: `foo 的值是 ${this.foo}`  //  在 render 函数内部使用 组价状态
//     }
//   }
// }

// // 用来描述组件的 vnode 对象， type 属性值为组件的选项对象
// const CompVNode = {
//   type: MyComponent
// }

// renderer.render(CompVNode, document.getElementById('root'))



// const MyComponent = {
//   name: 'MyComponent',
//   props: {
//     title: String
//   },
//   data() {
//     return {}
//   },
//   render() {
//     return {
//       type: 'div',
//       children: `count is : ${this.title}`  //  在 render 函数内部使用 组价状态
//     }
//   }
// }

// // 用来描述组件的 vnode 对象， type 属性值为组件的选项对象
// const vnode = {
//   type: MyComponent,
//   props: {
//     title: 'A big title',
//     other: 'other val'
//   }
// }

// renderer.render(vnode, document.getElementById('root'))

// // setup 函数的实现
// const MyComponent = {
//   name: 'MyComponent',
//   props: {
//     title: String
//   },
//   setup() {
//     const msg = ref('msg内容')
//     return {
//       msg
//     }
//   },
//   data() {
//     return {}
//   },
//   render() {
//     return {
//       type: 'div',
//       children: `props: ${this.title} setupState: ${this.msg.value}`  //  在 render 函数内部使用 组价状态
//     }
//   }
// }

// // 用来描述组件的 vnode 对象， type 属性值为组件的选项对象
// const vnode = {
//   type: MyComponent,
//   props: {
//     title: 'A big title',
//     other: 'other val'
//   }
// }

// renderer.render(vnode, document.getElementById('root'))


// 实现 emit
const MyComponent = {
  name: 'MyComponent',
  props: {
    title: String
  },
  setup(props, { emit }) {
    const msg = ref('msg内容')
    const handleClick = () => {
      emit('click')
    }
    return {
      msg,
      handleClick
    }
  },
  data() {
    return {}
  },
  render() {
    return {
      type: 'div',
      props: {
        onClick: this.handleClick
      },
      children: `props: ${this.title} setupState: ${this.msg.value}`  //  在 render 函数内部使用 组价状态
    }
  }
}

// 用来描述组件的 vnode 对象， type 属性值为组件的选项对象
const vnode = {
  type: MyComponent,
  props: {
    title: 'A big title',
    other: 'other val',
    onClick() {
      alert('hi')
    }
  }
}

renderer.render(vnode, document.getElementById('root'))
