const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaRequest = require('koa-http-request');

const crypto = require('crypto');

const router = new Router();
const app = module.exports = new Koa();
app.use(bodyParser());

app.use(koaRequest({}));

router.get('/', (ctx, next) => {
    ctx.body = "WELCOME TO MY PAYMENT GATEWAY MOCK";
});

/* 1. Redirect from Shopify */
router.post('/', (ctx) => {
    var d = {"headers": {}, "body": {}};
    //console.log(ctx.headers);
    console.log(ctx.request.body);
    //d.headers = ctx.headers;
    d.body = ctx.request.body;
    ctx.set('Content-Type', 'text/html');  
    var tm = new Date().toISOString();    
    var form = `<a href="https://help.shopify.com/en/api/guides/payment-gateway/hosted-payment-sdk/api-reference/response-values">See response values</a><br/><br/>
    <form method="POST" action="/complete">
    <input type="hidden" name="x_account_id" value="${d.body.x_account_id}">
    <input type="hidden" name="x_amount" value="${d.body.x_amount}">
    <input type="hidden" name="x_currency" value="${d.body.x_currency}">
    <input type="hidden" name="x_gateway_reference" value="${new Date().getTime()}">
    <input type="hidden" name="x_reference" value="${d.body.x_reference}">
    <labe>x_result (required):</label><input type="text" name="x_result" value="completed"><br/>
    <input type="hidden" name="x_test" value="${d.body.x_test}">
    <input type="hidden" name="x_timestamp" value="${tm}">
    <labe>x_message:</label><input type="text" name="x_message" value=""><br/>
    <labe>x_transaction_type:</label><input type="text" name="x_transaction_type" value=""><br/>
    <input type="hidden" name="x_url_callback" value="${d.body.x_url_callback}">
    <input type="hidden" name="x_url_complete" value="${d.body.x_url_complete}"><br/>
    <input type="submit" value="Complete Payment" style="font-size: 80px; color: blue;">
    </form>`; 
    ctx.body = `<h1>MY PAYMENT GATEWAY MOCK</h1> ${JSON.stringify(d, null, 4).replace(/\n/g, "\n<br/>").replace(/ /g, " &nbsp;")} <br/><br/>${form}`;
});

/* 2. Redirect to Shopify */
router.post('/complete', (ctx, next) => {
  //console.log(ctx.headers);  
  var callback = ctx.request.body.x_url_callback;
  var complete = ctx.request.body.x_url_complete;
  var body = ctx.request.body;
  delete body.x_url_callback;
  delete body.x_url_complete; 
  if (body.x_message == '') delete body.x_message;
  if (body.x_transaction_type == '') delete body.x_transaction_type;

  console.log(body);
  
  let query = Object.entries(body).map(e => e.join('=')).join('&');  
  let msg = Object.entries(body).sort().map(e => e.join('')).join('');
  console.log(msg);

  const hmac = crypto.createHmac('sha256', 'iU44RWxeik');
  hmac.update(msg);
  let signature = hmac.digest('hex');

  query += "&x_signature=" + signature;
  console.log(complete + "?" + query);

  /*let repo = ctx.post(callback, body, {    
  });
  console.log(repo);*/   

  ctx.redirect(complete + "?" + query);
  ctx.status = 307;   
  //ctx.body = "POST";
});




app.use(router.routes());
app.use(router.allowedMethods());

if (!module.parent) app.listen(3000);