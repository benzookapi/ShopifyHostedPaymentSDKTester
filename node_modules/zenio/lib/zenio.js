const http = require('http')
const https = require('https')
const urlParse = require('url').parse
const qsStringify = require('querystring').stringify
const iconv = require('iconv-lite')
let options = {
  host: '',
  json: false,
  timeout: 30000,
  encoding: 'utf8'
}

function isRedirect(code) {
  return code === 300 || code === 301 || code === 302 || code === 303 || code === 305 || code === 307 || code === 308
}

/**
 *  @param {Object} params
 */
function createParams(params) {
  let ret = []

  for (let i in params) {
    ret.push(i + '=' + encodeURIComponent(params[i]))
  }

  return ret.join('&')
}

/**
 *  @param {String} url
 *  @param {String} method  GET | HEAD | POST | PUT | PATCH | DELETE
 *  @param {Object} headers
 */
function createOptions(url, method, headers) {
  url = urlParse(url)

  return {
    hostname: url.hostname,
    port: url.protocol == 'https:' ? url.port || 443 : url.port || 80,
    path: url.path,
    method: method,
    headers: Object.assign({
      'Content-Type': 'application/x-www-form-urlencoded'
    }, headers)
  }
}
/**
 *  @param {String} method  GET | HEAD | POST | PUT | PATCH | DELETE
 */
function zenio(method) {
  return (url, params, headers, redirect = 10) => {
    return new Promise((resolve, reject) => {
      function wrapper(url, params, headers, redirect) {
        let result, req, opts, request

        url = url.startsWith('http') ? url : (options.host || 'http://') + url
        request = url.startsWith('https') ? https.request : http.request

        if ((method == 'GET' || method == 'HEAD') && typeof params === 'object' && params !== null) {
          url += (url.indexOf('?') > -1 ? '&' : '?') + createParams(params)
        }

        opts = createOptions(url, method, headers)

        if (options.json && opts.headers.accept === undefined) {
          opts.headers.accept = 'application/json'
        }

        if (method == 'POST' || method == 'PUT' || method == 'PATCH') {
          if (typeof params === 'object' && params !== null) {
            if (/application\/json/.test(opts.headers['Content-Type'])) {
              params = JSON.stringify(params)
            } else {
              params = qsStringify(params)
            }
            opts.headers['Content-Length'] = Buffer.byteLength(params)
          } else {
            opts.headers['Content-Length'] = 0
          }
        }

        req = request(opts, res => {
          let buf = [], size = 0, code = res.statusCode

          if (isRedirect(code) && 'location' in res.headers && redirect > 0) {
            wrapper(res.headers.location, params, headers, redirect - 1)
            return
          }
          if (code < 200 || code > 299) {
            reject(new Error('statusCode=' + code + '\n' + result))
            return
          }

          res.setTimeout(options.timeout, () => {
            req.abort()
            reject(new Error(url + ' timeout'))
          }).on('data', chunk => {
            buf.push(chunk)
            size += chunk.length
          }).on('end', () => {
            result = iconv.decode(Buffer.concat(buf, size), options.encoding)
            if (options.json) {
              try { result = JSON.parse(result) } catch (e) { reject(e) }
            }
            resolve(result)
          })
        })

        req.on('error', reject)

        if ((method == 'POST' || method == 'PUT' || method == 'PATCH') && params) {
          req.write(params)
        }

        req.end()
      }
      wrapper(url, params, headers, redirect)
    })
  }
}

zenio.methods = ['get', 'head', 'post', 'put', 'patch', 'delete']

zenio.setOptions = (opts) => {
  options = Object.assign(options, opts || {})
}

zenio.methods.forEach(method => {
  zenio[method] = zenio(method.toUpperCase())
})

module.exports = zenio
