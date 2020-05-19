/**
 * @file 页面文案
 * @author zhangtingting12 <zhangtingting12@baidu.com>
*/

export default {
    project: {
        select: {
            menu: [
                {text: '项目管理', icon: 'unordered-list', key: 'select', link: '/project/select'},
                {text: '创建项目', icon: 'plus', key: 'create', link: '/project/create'}
            ],
            headRight: {
                about: '关于',
                home: '首页'
            },
            folderExplorer: {
                placeholder: {
                    edit: '请输入合法路径',
                    create: '请输入合法文件夹名称'
                },
                tooltip: {
                    pre: '上一页面',
                    edit: '编辑',
                    refresh: '刷新',
                    star: '添加/取消收藏',
                    starDirs: '收藏的文件夹'
                },
                menu: {
                    createFolder: '新建文件夹',
                    hiddenFolderShow: '显示隐藏文件夹',
                    hiddenFolder: '不显示隐藏文件夹',
                    createTitle: '输入文件夹名称'
                },
                modalCreateTitle: '输入文件夹名称'
            },
            create: {
                steps: ['选择文件夹', '确认配置'],
                stepsAction: {
                    initProject: '在此创建工程',
                    prev: '上一步',
                    createProject: '确认创建'
                }
            }
        }
    }
};
