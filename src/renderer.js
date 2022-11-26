function createRenderer(options) {

  const {
    createElement,
    insert,
    setElementText,
    patchProps,
  } = options


  function mountElement(vnode, container) {
    // 根据虚拟节点的 type 创建出真实节点
    // 让虚拟节点与真实 DOM 之间建立联系
    const el = vnode.el = createElement(vnode.type)
    // 如果当前节点存在 props
    if (vnode.props) {
      // 遍历 props
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key])
      }
    }
    // 判断 vnode 孩子的类型
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      // 判断当 子 vnode 是数组的时候, 就需要循环遍历子节点，然后将子节点插入到刚才新建的
      vnode.children.forEach(child => {
        // 用 patch 函数把子节点挂载到父节点上面
        patch(null, child, el)
      })
    }
    // 将新创建的元素挂载到容器下面
    insert(el, container)
  }

  /**
   * 接受一个虚拟节点，根据虚拟节点找到 真实节点 并根据真实节点 的 parent 将其移除
   * @param {*} vnode
   */
  function unmount(vnode) {
    // 获取真实 DOM 的父元素
    const parent = vnode.el.parentNode
    if (parent) {
      // 移除真实 DOM
      parent.removeChild(vnode.el)
    }
  }



  function patch(n1, n2, container) {
    // 如果新老节点的 类型不一样，则移除老节点
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }
    // 以下表示 新旧 虚拟节点描述的内容是一样的
    const { type } = n2
    if (typeof type === 'string') {
      // 如果 vnode 的类型是 字符串则说明要渲染 的是普通标签
      if (!n1) {
        // 如果没有老节点则表示需要挂载元素
        mountElement(n2, container)
      } else {
        // 新旧虚拟节点打补丁
        patchElement(n1, n2)
      }
    } else if (typeof type === 'object') {
      // 如果 vnode 的类型是 对象则说明要渲染 组件

    }
  }

  function render(vnode, container) {
    // 如果有新的 vnode
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      // 如果没有新的 vnode
      // 如果有老的 vnode
      if (container._vnode) {
        // 调用卸载函数，移除真实 DOM
        unmount(container._vnode)
      }
    }
    // 每次挂载或者更新完成之后就把老的 vnode 保存在容器身上
    container._vnode = vnode
  }

  return {
    render
  }
}

/**
 *
 * @param {*} el DOM 元素
 * @param {*} key props key 属性名
 * @param {*} value props 属性值
 * @returns
 */
function shouldSetAsProps(el, key, value) {
  // 特殊处理
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}

// DOM 操作 API
const domApi = {
  // 创建元素
  createElement(tag) {
    return document.createElement(tag)
  },
  // 设置元素的文本节点
  setElementText(el, text) {
    el.textContent = text
  },
  // 在给定的 parent 下面添加指定的元素
  /**
   *
   * @param {*} el 要添加的元素
   * @param {*} parent 父节点
   * @param {*} anchor 参照的节点
   */
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
  },
  /**
   *
   * @param {*} el 真实DOM
   * @param {*} key 属性名
   * @param {*} prevVal 上一次的值
   * @param {*} nextVal 当前值
   */
  patchProps(el, key, prevVal, nextVal) {
    //判断 props 中的参数如果是 on 开头的
    if (/^on/.test(key)) {
      // 先绑定事件
      const eventName = key.slice(2).toLowerCase()
      const invoker = el._vei = (e) => {
        // 如果发现新的值是一个数组，则循环遍历它
        if (Array.isArray(nextVal)) {
          nextVal.forEach((fn) => {
            fn(e)
          })
        }
      }
      el.addEventListener(eventName, invoker)
    }
    // 区分是 DOM Properties 还是 HTML Attributes
    else if (key === 'class') {
      el.className = nextVal || ''
    } else if (shouldSetAsProps(el, key, nextVal)) {
      const type = typeof el[key]
      // 如果在 DOM 树形上的类型是 布尔值 并且当前拿到的 vnode 的值的 空字符串，那么久把值转成 true
      if (type === 'boolean' && nextVal === '') {
        el[key] = true
      } else {
        // 否则就用 vnode 里面的值
        el[key] = nextVal
      }
    } else {
      el.setAttribute(key, nextVal)
    }
  }
}


export const renderer = createRenderer(domApi)
