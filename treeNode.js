import Node from "./node"

export default class TreeNode {
    constructor(options) {
        for (let name in options) {
            if (options.hasOwnProperty(name)) {
                this[name] = options[name]
            }
        }
        this.root = new Node({
            data: this.data
        })

        console.log(this.root)

        //所有都只有一级
        this.isNotRealTree = this.root.childNodes.every(item => !item.childNodes || item.childNodes.length === 0)

        this.padding = 20;
    }
    render() {
        const html = this.getTreeNodeHtml(this.root)
        return html
    }
    getTreeNodeHtml(treeNode) {

        //console.log(treeNode, treeNode.level)

        if (!treeNode) return "";

        const isExpand = (treeNode) => {

            const isHide = treeNode && !treeNode.expanded

            return isHide ? "style='display:none'" : '';
        }

        const isExpandClass = (treeNode) => {

            const isHide = treeNode && !treeNode.expanded

            return isHide ? "expanded" : '';
        }

        const isChecked = treeNode => {
            return treeNode.checked ? 'checked' : '';
        }

        const res = treeNode.childNodes.reduce((acc, curr) => {

            const treeNodeHtnml = `<div class="snst-tree-node" data-id="${curr.id}">
            <div class="snst-tree-node__content" data-id="${curr.data[this.props.id]}" style="padding-left:${ this.padding * (curr.level - 1)}px">
                ${
                    curr.childNodes.length ?
                    `<span class="snst-tree-node__expand-icon ${isExpandClass(curr)}"></span>`:
                   (
                     this.isNotRealTree ? '': '<span class="snst-tree-node__expand-icon is-leaf"></span>'
                   ) 
                }
                ${ this.showCheckBox ? `<label class="snst-tree-node__checkbox ${isChecked(curr)}"></label>` :'' }  
               <span class="snst-tree-node__label">${curr.data[this.props.title]}</span>
            </div>
           ${
               curr.childNodes.length ?
                ` <div class="snst-tree-node__children" ${isExpand(curr)}>
                    ${this.getTreeNodeHtml(curr)}
                </div>` 
            :''
           } 

        </div>`

            return acc += treeNodeHtnml
        }, '')


        return res

    }
}