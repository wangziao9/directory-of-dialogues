// shamelessly stolen from https://jakelunn.medium.com/simple-file-tree-electron-es6-71e8abc2c52

var fs = require('fs');

class FileTree {
    constructor(path){
        this.path = path;
        this.items = null;
    }

    build = () => {
        this.items = FileTree.readDir(this.path);
    }

    static readDir(path) {
        var fileArray = [];

        fs.readdirSync(path).forEach(file => {
            var fileInfo = new FileTree(`${path}\\${file}`, file);

            var stat = fs.statSync(fileInfo.path);

            if (stat.isDirectory()){
                fileInfo.items = FileTree.readDir(fileInfo.path);
            }

            fileArray.push(fileInfo);
        })

        return fileArray;
    }
}

module.exports = FileTree;