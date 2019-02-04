import TreeNode from "./treeNode";

const defaults = {
    showCheckBox: true, //是否带checkbox
    hasAllCheck: true, //是否带全选框
    props: {
        //数据字段别名
        id: "code",
        title: "title"
    }
};

const expandedKey = "expanded";
const checkedKey = "checked";
const allChecKKey = "is-allCheck";

function closest(el, selector) {
    const matchesSelector = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;

    while (el) {
        if (matchesSelector.call(el, selector)) {
            return el;
        } else {
            el = el.parentElement;
        }
    }
    return null;
}

function children(el, selector) {
    return Array.from(el.children).filter(item => item.matches(selector))
}

function parents(el, selector) {
    const result = [];
    const matchesSelector = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;

    // match start from parent
    el = el.parentElement;
    while (el) {
        if (matchesSelector.call(el, selector)) {
            result.push(el);
        }
        el = el.parentElement;
    }
    return result;
}

export default class Tree {
    constructor(options) {
        options = Object.assign(defaults, options);

        for (let name in options) {
            if (options.hasOwnProperty(name)) {
                this[name] = options[name];
            }
        }
        //初始化treenode
        this.treeNodes = new TreeNode({
            data: this.data,
            showCheckBox: this.showCheckBox,
            props: this.props
        });

        //初始化扁平化数据方便查询
        this.flattenData();
        this.containerEle = this.container instanceof Node ? (
            this.container
        ) : (
            document.querySelector(this.container)
        );
        this.render();
        //全选框dom
        this.allCheckEle = this.containerEle.querySelector(".snst-tree-allcheck")
        this.bindEvents();
    }
    render() {
        const treeItemHtml = this.treeNodes.render();
        const htmlTemplate = `<div class="snst-tree">
            ${this.hasAllCheck ? '<div class="snst-tree-allcheck"><label class="snst-tree-node__checkbox"></label><span>全选</span></div>' : ""}
            ${treeItemHtml}
        </div>`;
        this.containerEle.innerHTML = htmlTemplate
    }
    refreshTree() {
        const treeEle = this.containerEle.querySelector(".snst-tree")
        const treeChildrenEle = treeEle.querySelectorAll(".snst-tree-node__children")
        treeChildrenEle.forEach(item => item.style.display = "none")
        treeEle.querySelectorAll(".snst-tree-node__expand-icon").forEach(item => {
            if (!item.classList.contains("is-leaf")) {
                item.classList.add(expandedKey)
            }
        })
        treeEle.querySelectorAll(".snst-tree-node__checkbox").forEach(item => {
            item.classList.remove(checkedKey, allChecKKey)
        })
        this.allCheckEle.classList.remove(checkedKey)
    }
    setChecked(checkedKeys) {
        //目前场景暂时先刷新树
        this.refreshTree();
        if (!Array.isArray(checkedKeys) || !checkedKeys.length) {
            return;
        }
        const treeContentEles = this.containerEle.querySelectorAll(".snst-tree-node__content")
        treeContentEles.forEach(item => {
            const curId = item.getAttribute("data-id")
            if (checkedKeys.includes(curId.toString())) {
                //本身和父级所有的元素
                item.querySelector(".snst-tree-node__checkbox").click()
            }
        })
    }
    /**
     * 广度遍历树，如果onlyParents=true则只拿全选的父节点数据
     * @param {Boolean} onlyParents
     */
    getChecked(onlyParents = true) {
        const self = this;
        const result = [];
        const step = childrenEle => {
            if (!childrenEle || !childrenEle.length) {
                return;
            }
            childrenEle.forEach(item => {
                //是否带有全选标记
                const targetEle = item.querySelector(".snst-tree-node__content .snst-tree-node__checkbox")
                const isAllCheck = targetEle.classList.contains(allChecKKey);
                if (isAllCheck) {
                    const curId = Number(closest(item, ".snst-tree-node").getAttribute("data-id"))
                    const curNode = self.getNodeById(curId);
                    const obj = {};
                    obj[self.props.id] = curNode.data[self.props.id];
                    obj[self.props.title] = curNode.data[self.props.title];
                    obj.level = curNode.level;
                    result.push(obj);
                }

                if (isAllCheck && onlyParents) {
                    return true;
                } else {
                    const stepNodes = []
                    children(item, ".snst-tree-node__children").forEach(childrenEle => {
                        stepNodes.push(...children(childrenEle, ".snst-tree-node"))
                    })
                    step(stepNodes);
                }
            });
        };

        step(children(this.containerEle.querySelector(".snst-tree"), ".snst-tree-node"));

        return result;
    }
    getNodeById(id) {
        const findObj = this.flattenData.find(node => node.id === id);
        return findObj;
    }
    flattenData() {
        const flatTree = [];

        function flattenChildren(node) {
            flatTree.push(node);
            if (node.childNodes) {
                node.childNodes.forEach(child => flattenChildren(child));
            }
        }
        this.treeNodes.root.childNodes.forEach(rootNode => {
            flattenChildren(rootNode);
        });
        this.flattenData = flatTree;
    }
    findFirstLevelNode() {
        const result = []
        const nodeEles = children(this.containerEle.querySelector(".snst-tree"), ".snst-tree-node")
        nodeEles.forEach(el => {
            result.push(...children(el, ".snst-tree-node__content")[0].querySelectorAll(".snst-tree-node__checkbox"))
        })

        return result
    }
    bindEvents() {
        //收起展开
        this.containerEle.querySelectorAll(".snst-tree-node__expand-icon").forEach(item => {
            item.addEventListener("click", e => {
                const isExpand = !e.target.classList.contains(expandedKey)
                e.target.classList.toggle(expandedKey)

                const childrenEle = closest(e.target, ".snst-tree-node").querySelector(".snst-tree-node__children")
                if (childrenEle) {
                    childrenEle.style.display = isExpand ? "none" : "block"
                }
            })
        })

        //checked
        this.containerEle.querySelectorAll(".snst-tree-node__checkbox").forEach(item => {
            item.addEventListener("click", e => {
                if (e.target.parentElement.classList.contains("snst-tree-allcheck")) return;
                const isCheck = !e.target.classList.contains(checkedKey);
                //勾选首先把子节点全部勾选或不勾选,父联动子
                closest(e.target, ".snst-tree-node").querySelectorAll(".snst-tree-node__checkbox").forEach(checkboxEle => {
                    checkboxEle.classList[isCheck ? "add" : "remove"](checkedKey, allChecKKey)
                })
                //子联动父
                if (isCheck) {
                    parents(e.target, ".snst-tree-node").forEach(nodeEle => {
                        children(nodeEle, ".snst-tree-node__content").forEach(contentEle => {
                            contentEle.querySelector(".snst-tree-node__checkbox")
                                .classList
                                .add(checkedKey, allChecKKey)
                        })
                    })
                }
                //然后再去判断父节点的勾选逻辑，子节点的勾选逻辑可能会改变父节点
                //当前的根节点
                const nodeEles = Array.from(parents(e.target, ".snst-tree-node"))
                const rootEle = nodeEles[nodeEles.length - 1]

                //自里向外遍历，判断是否全部没有勾选
                //如果全部未勾选则把父节点的check取消
                //如果全部勾选则把父节点增加all-check标记
                Array.from(rootEle.querySelectorAll(".snst-tree-node__children")).reverse().forEach(childrenEle => {
                    let flag = true
                    let allCheckFlag = true
                    childrenEle.querySelectorAll(".snst-tree-node__checkbox").forEach(checkboxEle => {
                        flag &= !checkboxEle.classList.contains(checkedKey)
                        allCheckFlag &= checkboxEle.classList.contains(allChecKKey)
                    })

                    if (flag) {
                        childrenEle.previousElementSibling
                            .querySelector(".snst-tree-node__checkbox").classList.remove(checkedKey)
                    }

                    if (!allCheckFlag) {
                        childrenEle.previousElementSibling
                            .querySelector(".snst-tree-node__checkbox").classList.remove(allChecKKey)
                    }
                })

                //判断是否全选,判断所有直接子节点是否都含有全选标记
                let totalAllCheckFlag = true

                this.findFirstLevelNode().forEach(nodeEle => {
                    totalAllCheckFlag &= nodeEle.classList.contains(allChecKKey)
                })

                this.containerEle.querySelector(".snst-tree-allcheck .snst-tree-node__checkbox").classList[totalAllCheckFlag ? "add" : "remove"](checkedKey)
                this.afterCheck && this.afterCheck(isCheck, this);

            })
        })

        this.containerEle.querySelectorAll(".snst-tree-node__label").forEach(el => {
            Array.from(el.parentNode.children).filter((child) =>
                child !== el
            ).forEach(labelEle => {
                labelEle.click()
            })
        })

        //allcheck
        this.allCheckEle.querySelector(".snst-tree-node__checkbox").addEventListener("click", e => {
            const isCheck = !e.target.classList.contains(checkedKey)
            e.target.classList.toggle(checkedKey)

            this.findFirstLevelNode().forEach(nodeEle => {
                nodeEle.classList[!isCheck ? "add" : "remove"](checkedKey, allChecKKey)
                nodeEle.click()
            })
        })
    }
    setAllCheck() {
        this.allCheckEle.querySelector(".snst-tree-node__checkbox").click()
    }
}