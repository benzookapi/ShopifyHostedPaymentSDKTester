# koa-http-request
Simplified HTTP request for Koa(2.0+).

# Install

```bash
npm install koa-http-request --save
```

# Usage

```javascript
const koa = require('koa');
const koaRequest = require('koa-http-request');
const app = new koa();

app.use(koaRequest({
  json: true, //automatically parsing of JSON response
  timeout: 3000,    //3s timeout
  host: 'https://api.github.com'
}));

app.use(async (ctx, next) => {
    let repo = await ctx.get('/repos/junyiz/koa-http-request', null, {
        'User-Agent': 'koa-http-request'
    });
    ctx.body = 'repos id: ' + repo.id + '\nrepos name: ' + repo.full_name;
});

app.listen(process.env.PORT || 8090);
```

# Options

##### json

Type: 'Boolean'
Default: false

Parse response body with `JSON.parse` and set `accept` header to `application/json`.

##### timeout

Type: `number`
Default: 30000

Milliseconds to wait for a server to send response headers before aborting request with `ETIMEDOUT` error.

##### host

Type: 'String'
Default: ''


# API

#### ctx.get(url[, params[, headers]])
#### ctx.head(url[, params[, headers]])
#### ctx.post(url[, params[, headers]])
#### ctx.put(url[, params[, headers]])
#### ctx.delete(url[, params[, headers]])

# License
MIT
