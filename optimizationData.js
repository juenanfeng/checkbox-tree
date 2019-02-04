function getParents(flattenData, data, level) {
    if (level === 1) {
        return;
    }
    //在当前级别下已经查找过的集合，防止重复查找
    const hasFindArr = [];
    //只查找当前level的数据
    data
        .filter(item => item.level === level)
        .forEach(curSelect => {
            if (hasFindArr.map(item => item.pageCode).includes(curSelect.pageCode)) {
                return;
            }
            //在扁平化数组中定位
            const findObj = flattenData.find(fItem => fItem.pageCode === curSelect.pageCode);
            if (findObj) {
                //定位到父节点
                const parentNode = flattenData.find(fItem => fItem.pageCode === findObj.parentCode);
                //查找过的父元素的children
                hasFindArr.push(...parentNode.children);
                //比较该父节点下是不是全部包含选中的节点，如果是则把父节点插入结果集当中并移除当前查找节点的所有兄弟节点(包括其本身)
                let flag = true;
                parentNode.children.forEach(item => {
                    flag &= data.map(p => p.pageCode).includes(item.pageCode);
                });
                //全部包含
                if (flag) {
                    //console.log("找到的全部包含的父节点", parentNode)
                    data.push({
                        pageCode: parentNode.pageCode,
                        level: parentNode.level
                    });
                    parentNode.children.forEach(pItem => {
                        //console.log("删除的多余节点", pItem)
                        data.splice(data.findIndex(item => item.pageCode === pItem.pageCode), 1);
                    });
                }
            }
        });
    level--;
    getParents(flattenData, data, level);
}

function getFlattenData(data) {
    const flatTree = [];

    function flattenChildren(node) {
        flatTree.push(node);

        if (node.children && node.children.length) {
            node.children.forEach(child => flattenChildren(child));
        }
    }
    data.forEach(rootNode => {
        flattenChildren(rootNode);
    });

    return flatTree;
}
/**
 * 最深层的节点数据压缩(返回全部选中的节点数据)
 * @param {Array} sourceData 树的原始数据
 * @param {String} selectData 逗号分隔的选中数据
 * @param {Number} level 选中数据的层级
 */
/*  eg
 *  [{
            "children": [{
                "children": [],
                "level": "3",
                "pageCode": "503820",
                "pageName": "產後塑身",
                "parentCode": "503387",
                "sort": 1,
                "status": 1
            }],
            "level": "2",
            "pageCode": "503387",
            "pageName": "祛紋/纖體塑身",
            "parentCode": "503269",
            "sort": 1,
            "status": 1
    }]
 *  选中 "503820" 返回  "503387"
 */
export function optimizationTreeData(sourceData, selectData, level = 3) {

    if (!selectData) return []

    const flattenData = getFlattenData(sourceData);

    let target = selectData.split(",").map(item => {
        return {
            pageCode: item,
            level: level
        };
    });

    getParents(flattenData, target, level);

    return target;
}