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
        this.render();
        //全选框dom
        this.$allCheck = $(".snst-tree-allcheck", this.container);
        this.bindEvents();

    }
    render() {
        const treeItemHtml = this.treeNodes.render();

        const htmlTemplate = `<div class="snst-tree">
            ${this.hasAllCheck ? '<div class="snst-tree-allcheck"><label class="snst-tree-node__checkbox"></label><span>全选</span></div>' : ""}
            ${treeItemHtml}
        </div>`;

        $(this.container).empty().append(htmlTemplate);
    }
    refreshTree() {
        $(".snst-tree", this.container)
            .find(".snst-tree-node__children")
            .hide()
            .end()
            .find(".snst-tree-node__expand-icon:not(.is-leaf)")
            .addClass(expandedKey)
            .end()
            .find(".snst-tree-node__checkbox")
            .removeClass(`${checkedKey} ${allChecKKey}`);

        this.$allCheck.removeClass(checkedKey);
    }
    setChecked(checkedKeys) {
        //目前场景暂时先刷新树
        this.refreshTree();
        if (!Array.isArray(checkedKeys) || !checkedKeys.length) {
            return;
        }
        $(".snst-tree-node__content", this.container).each(function () {
            const curId = $(this).data("id");
            if (checkedKeys.includes(curId.toString())) {
                //本身和父级所有的元素
                $(this).children(".snst-tree-node__checkbox").trigger("click")
                //（模拟点击并且展开至当前级别）
                // $(this)
                //     .parents(".snst-tree-node__children")
                //     .show()
                //     .prev()
                //     .find(".snst-tree-node__expand-icon")
                //     .removeClass(expandedKey);
            }
        });
    }
    /**
     * 广度遍历树，如果onlyParents=true则只拿全选的父节点数据
     * @param {Boolean} onlyParents
     */
    getChecked(onlyParents = true) {
        const self = this;
        const result = [];

        const step = $children => {
            if (!$children || !$children.length) {
                return;
            }
            $children.each(function () {
                //是否带有全选标记
                const $target = $(this)
                    .children(".snst-tree-node__content")
                    .find(".snst-tree-node__checkbox")
                const isAllCheck = $target.hasClass(allChecKKey);
                if (isAllCheck) {
                    const curId = $(this)
                        .closest(".snst-tree-node")
                        .data("id");
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
                    step($(this).children(".snst-tree-node__children").children(".snst-tree-node"));
                }
            });
        };

        step($(".snst-tree", this.container).children(".snst-tree-node"));

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

        console.log(flatTree)
    }
    findFirstLevelNode() {
        return $(".snst-tree", this.container).children(".snst-tree-node").children(".snst-tree-node__content").find(".snst-tree-node__checkbox")
    }
    bindEvents() {
        const self = this;
        //收起展开
        $(".snst-tree-node__expand-icon", this.container).on("click", function () {
            const isExpand = !$(this).hasClass(expandedKey);
            $(this).toggleClass(expandedKey);
            $(this)
                .closest(".snst-tree-node")
                .find(".snst-tree-node__children:eq(0)")[isExpand ? "hide" : "show"]();
        });
        //checked
        $(".snst-tree-node__checkbox", this.container).on("click", function () {

            if ($(this).parent().hasClass("snst-tree-allcheck")) return;

            const isCheck = !$(this).hasClass(checkedKey);

            //勾选首先把子节点全部勾选或不勾选
            $(this)
                .closest(".snst-tree-node")
                .find(".snst-tree-node__checkbox")[isCheck ? "addClass" : "removeClass"](`${checkedKey} ${allChecKKey}`);

            if (isCheck) {
                $(this)
                    .parents(".snst-tree-node")
                    .each(function () {
                        $(this)
                            .children(".snst-tree-node__content")
                            .find(".snst-tree-node__checkbox")
                            .removeClass(`${checkedKey} ${allChecKKey}`)
                            .addClass(`${checkedKey} ${allChecKKey}`);
                    });
            }

            //然后再去判断父节点的勾选逻辑，子节点的勾选逻辑可能会改变父节点
            //当前的根节点
            const $root = $(this)
                .parents(".snst-tree-node")
                .last();

            //自里向外遍历，判断是否全部没有勾选
            //如果全部未勾选则把父节点的check取消
            //如果全部勾选则把父节点增加all-check标记
            $(
                $root
                .find(".snst-tree-node__children")
                .toArray()
                .reverse()
            ).each(function () {
                let flag = true;
                let allCheckFlag = true;
                $(this)
                    .find(".snst-tree-node__checkbox")
                    .each(function () {
                        //子节点全不选
                        flag &= !$(this).hasClass(checkedKey);
                        //子节点全选
                        allCheckFlag &= $(this).hasClass(allChecKKey);
                    });

                if (flag) {
                    $(this)
                        .prev()
                        .find(".snst-tree-node__checkbox")
                        .removeClass(checkedKey);
                }

                if (!allCheckFlag) {
                    $(this)
                        .prev()
                        .find(".snst-tree-node__checkbox").removeClass(allChecKKey);
                }

            });

            //判断是否全选,判断所有直接子节点是否都含有全选标记

            let totalAllCheckFlag = true
            self.findFirstLevelNode().each(function () {
                totalAllCheckFlag &= $(this).hasClass(allChecKKey)
            })

            $(".snst-tree-allcheck", self.container).find(".snst-tree-node__checkbox")[totalAllCheckFlag ? "addClass" : "removeClass"](checkedKey)

            self.afterCheck && self.afterCheck(isCheck, this);
        });
        $(".snst-tree-node__label", this.container).on("click", function () {
            $(this)
                .siblings(".snst-tree-node__checkbox")
                .trigger("click");
        });

        //allcheck
        this.$allCheck.on("click", ".snst-tree-node__checkbox", function () {
            const isCheck = !$(this).hasClass("checked");
            $(this).toggleClass(checkedKey);
            //模拟点击下面所有的直接节点
            self.findFirstLevelNode()[!isCheck ? "addClass" : "removeClass"](`${checkedKey} ${allChecKKey}`).trigger("click")
        });
    }
    setAllCheck() {
        this.$allCheck.find(".snst-tree-node__checkbox").trigger("click")
    }
}