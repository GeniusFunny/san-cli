/**
 * @file app
 * @author wangyongqing <wangyongqing01@baidu.com>
 */
const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin-for-split');
const hwpTemp = new HtmlWebpackPlugin({});

module.exports = (api, options) => {
    api.chainWebpack(webpackConfig => {
        const isProd = options.mode === 'production';
        const outputDir = api.resolve(options.outputDir);
        // 1. 判断 pages
        // 2. build 做的事情是判断 serve 对象
        const htmlOptions = {
            templateParameters: (compilation, assets, pluginOptions) => {
                // enhance html-webpack-plugin's built in template params
                let stats;
                return Object.assign({
                    // make stats lazy as it is expensive
                    get webpack() {
                        return stats || (stats = compilation.getStats().toJson());
                    },
                    compilation: compilation,
                    webpackConfig: compilation.options,
                    htmlWebpackPlugin: {
                        files: assets,
                        options: pluginOptions
                    }
                });
            }
        };

        if (isProd) {
            // 压缩 html
            Object.assign(htmlOptions, {
                minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    collapseBooleanAttributes: true,
                    removeScriptTypeAttributes: true
                    // more options:
                    // https://github.com/kangax/html-minifier#options-quick-reference
                }
            });
        }

        // resolve HTML file(s)
        const multiPageConfig = options.pages;
        const HTMLPlugin = require('html-webpack-plugin');
        const htmlPath = api.resolve('public/index.html');
        const defaultHtmlPath = path.resolve(__dirname, '../../template/index-default.html');
        const publicCopyIgnore = ['index.html', '.DS_Store'];

        if (!multiPageConfig) {
            webpackConfig
                .entry('app')
                .add(require.resolve('../../template/main.js'))
                .end();
            // default, single page setup.
            htmlOptions.alwaysWriteToDisk = true;
            htmlOptions.inject = true;
            htmlOptions.template = fs.existsSync(htmlPath) ? htmlPath : defaultHtmlPath;
            webpackConfig.plugin('html').use(HTMLPlugin, [htmlOptions]);
        } else {
            // multi-page setup
            /**
             * pages: {
                    index: {
                    entry: 'src/entry-point/index/main.js', //entry for the public page
                    template: 'public/index.html', // source template
                    filename: 'index.html' // output as dist/*
                    },
                    signin: {
                    entry: 'src/entry-point/signin/main.js',
                    template: 'public/signin.html',
                    filename: 'signin.html'
                    }
                }
             */
            webpackConfig.entryPoints.clear();

            const pages = Object.keys(multiPageConfig);
            const normalizePageConfig = c => (typeof c === 'string' ? {entry: c} : c);

            pages.forEach(name => {
                const {
                    title,
                    entry,
                    template = `public/${name}.html`,
                    filename = `${name}.html`,
                    chunks
                } = normalizePageConfig(multiPageConfig[name]);
                // inject entry
                webpackConfig.entry(name).add(api.resolve(entry));

                // resolve page index template
                const hasDedicatedTemplate = fs.existsSync(api.resolve(template));
                if (hasDedicatedTemplate) {
                    publicCopyIgnore.push(template);
                }
                const templatePath = hasDedicatedTemplate
                    ? template
                    : fs.existsSync(htmlPath)
                    ? htmlPath
                    : defaultHtmlPath;

                // inject html plugin for the page
                const pageHtmlOptions = Object.assign({alwaysWriteToDisk: true}, htmlOptions, {
                    chunks: chunks || ['chunk-vendors', 'chunk-common', name],
                    template: templatePath,
                    filename: ensureRelative(outputDir, filename),
                    title
                });

                webpackConfig.plugin(`html-${name}`).use(HTMLPlugin, [pageHtmlOptions]);
            });
        }

        // html-webpack-harddisk-plugin
        webpackConfig.plugin('html-webpack-harddisk-plugin').use(require('html-webpack-harddisk-plugin'));

        // 处理 smarty 的placeholder
        webpackConfig.plugin('hulk-html-webpack-addons-plugin').use(require('@baidu/hulk-html-webpack-plugin-addons'), [
            {
                alterAssetTags(pluginData) {
                    // 不插入css和js
                    // pluginData.head = pluginData.body = [];
                    return pluginData;
                },
                afterHTMLProcessing(pluginData) {
                    if (!~pluginData.html.indexOf('{%/block%}')) {
                        return pluginData;
                    }

                    // 手动添加资源到项目tpl特定的位置
                    let assetTags = hwpTemp.generateHtmlTags(pluginData.assets);
                    let bodyAsset = assetTags.body.map(hwpTemp.createHtmlTag.bind(hwpTemp));
                    let headAsset = assetTags.head.map(hwpTemp.createHtmlTag.bind(hwpTemp));
                    const headTag = '{%block name="__css_asset"%}';
                    const bodyTag = '{%block name="__script_asset"%}';
                    let html = pluginData.html;
                    // if (isProduction) {
                    //     const reg = new RegExp(config.build.assetsPublicPath, 'g');
                    //     headAsset = headAsset.map(item => item.replace(reg, '{%$staticDomain%}/'));
                    //     bodyAsset = bodyAsset.map(item => item.replace(reg, '{%$staticDomain%}/'));
                    // }
                    // 替换 head body部分
                    [[headAsset, headTag], [bodyAsset, bodyTag]].forEach(([assets, tag]) => {
                        if (~html.indexOf(tag)) {
                            html = html.split(tag).join(`${tag}${assets.join('')}`);
                        } else {
                            html += tag + assets.join('') + '{%/block%}';
                        }
                    });

                    pluginData.html = html;
                    return pluginData;
                }
            }
        ]);
        // copy static assets in public/
        const publicDir = api.resolve('public');
        if (fs.existsSync(publicDir)) {
            webpackConfig.plugin('copy').use(require('copy-webpack-plugin'), [
                [
                    {
                        from: publicDir,
                        to: outputDir,
                        ignore: publicCopyIgnore
                    }
                ]
            ]);
        }
    });
};

function ensureRelative(outputDir, p) {
    if (path.isAbsolute(p)) {
        return path.relative(outputDir, p);
    } else {
        return p;
    }
}
