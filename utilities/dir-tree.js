var fs = require('fs');

class DirTree {
    constructor(path){
        this.path = path;
        this.children = null;
    }

    buildTree() {
        this.children = DirTree.scanDir(this.path);
    }

    static scanDir(path) {
        const fileArray = [];

        fs.readdirSync(path).forEach(file => {
            const fullpath = `${path}/${file}`;
            const isDir = fs.statSync(fullpath).isDirectory();
            
            const node = new DirTree(fullpath);
            if (isDir){
                node.children = DirTree.scanDir(fullpath);
            }

            fileArray.push(node);
        })

        return fileArray;
    }
}

module.exports = DirTree;