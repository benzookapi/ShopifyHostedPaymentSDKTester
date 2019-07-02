# zenio
HTTP request with Promise

# Install

```bash
npm install zenio --save
```

# Usage

```javascript
const zenio = require('zenio')

(async function() {
  zenio.setOptions({
    json: true
  })
  let repo = await zenio.get('https://api.github.com/repos/junyiz/zenio', null, {
    'User-Agent': 'zenio'
  })
  console.log('repo id:', repo.id, 'repo name:', repo.full_name)
})()
```
or 
```javascript
const zenio = require('zenio')

zenio.setOptions({
  json: true
})
zenio.get('https://api.github.com/repos/junyiz/zenio', null, {
  'User-Agent': 'zenio'
}).then(function (repo) {
  console.log('repo id:', repo.id, 'repo name:', repo.full_name)
}).catch(console.error)
```


# License
MIT
