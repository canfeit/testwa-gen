import {
  BannerParser,
} from 'minicap'

// TODO: disconnect
const connectMinicap = (config = {}, cb = (banner) => ({})) => {
  const minicap = require('net').connect({
    port: 1717,
  })
  let data = []
  let header = true
  let compiling = true
  const screen = () => {
    compiling = true
    const arr = data.slice(0, 4) // 前四个字节是帧大小
    const size = (arr[3] << 24) | (arr[2] << 16) | (arr[1] << 8) | (arr[0] << 0) // 获得帧大小
    if (data.length >= size + 4) {
      // 获取帧内容
      // imgStream.push(chunk, "base64");
      if (config.drawing === false) {
        config.drawing = true
        config.img.src = `data:image/png;base64,${
          Buffer.from(data.slice(4, 4 + size)).toString('base64')}`
      }
      data = data.slice(4 + size)
      return screen()
    }
    return (compiling = false)
  }
  config.drawing = false
  minicap.on('data', (chunk) => {
    // console.log('minicapdata')
    // @ts-ignore
    data.push(...chunk)
    if (compiling === false) return screen()
    if (header) {
      const parser = new BannerParser()
      parser.parse(data.splice(0, 24)) // 前24个字节是头信息
      cb(parser.take())
      header = false
      compiling = false
    }
  })
}

export {
  connectMinicap,
}
