const zenio = require('zenio')

module.exports = function (opts) {
  opts = opts || {}
  
  if (opts.dataType == 'json') opts.json = true
  
  zenio.setOptions(opts)
  
  return async (ctx, next) => {
    zenio.methods.forEach(method => {
      ctx[method] = zenio[method]
    })
    await next()
  }
}