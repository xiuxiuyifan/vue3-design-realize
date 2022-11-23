function createRenderer(options) {

  const {
    createElement,
    insert,
    setElementText
  } = options


  function mountElement(vnode, container) {
    // 根据虚拟节点的 type 创建出真实节点
    const el = createElement(vnode.type)
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



  function patch(n1, n2, container) {
    // 没有老的 vnode, 表示初次挂载节点
    if (!n1) {
      mountElement(n2, container)
    } else {
      // 如果老的 vnode 存在则表示 打补丁
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
        container.innerHTML = ''
      }
    }
    // 每次挂载或者更新完成之后就把老的 vnode 保存在容器身上
    container._vnode = vnode
  }

  return {
    render
  }
}

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
  }
}


export const renderer = createRenderer(domApi)
