const path = require('path')

function resolve (dir) {
  return path.join(__dirname, dir)
}
export default {
  history: 'hash',
  publicPath: "./",
  outputPath: "../../dist/renderer",
  plugins: [
    [
      'umi-plugin-react', {
        // FIXME: 开启后会导致首屏加载过长
        // dynamicImport: true,
        dva: true,
        antd: true
    }],
  ],
  treeShaking: true,
  externals(_, request, callback) {
    let isExternal;
    const load = [
      "electron",
      "fs",
      "path",
      "os",
      "url",
      "net",
      "child_process"
    ];
    if (load.includes(request)) {
      isExternal = `require("${request}")`;
    }
    const appDeps = Object.keys(require("../../package").dependencies);
    if (appDeps.includes(request)) {
      isExternal = `require('${request}')`;
    }
    callback(null, isExternal);
  },
  chainWebpack(config, { webpack }) {
    config.resolve.alias.set('static', resolve('../../static'))
    config.resolve.alias.set('api', resolve('../api'))
  },
  minimizer: 'terserjs',
  theme: {
    'primary-color': '#52c41a'
  }
};
