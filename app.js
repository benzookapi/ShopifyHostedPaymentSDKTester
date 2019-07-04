const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaRequest = require('koa-http-request');

const crypto = require('crypto');

const router = new Router();
const app = module.exports = new Koa();
app.use(bodyParser());

app.use(koaRequest({
  
}));

const CHECK_KEY = 'iU44RWxeik'; // HMAC key to validate signature shared with Shopfiy and Payment Gateway

router.get('/', (ctx, next) => {
    ctx.body = "WELCOME TO MY PAYMENT GATEWAY MOCK";
});

/* 1. Redirect from Shopify */
router.post('/', (ctx) => {
    var d = {"body": {}};
    //console.log(ctx.headers);
    console.log(ctx.request.body);
    //d.headers = ctx.headers;
    d.body = ctx.request.body;

    /* Check the signature */
    if (!checkSignature(d.body)) {
      ctx.status = 400;
      return;
    }

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
  console.log(body);

  delete body.x_url_callback;
  delete body.x_url_complete; 
  delete body.x_signature; 
  if (body.x_message == '') delete body.x_message;
  if (body.x_transaction_type == '') delete body.x_transaction_type;  
  
  /* HMAC Signature */
  let signature = createSignature(body);

  // Convert POST body to query format for redirection
  let query = Object.entries(body).map(e => e.join('=')).join('&');   
  query += "&x_signature=" + signature;
  console.log(complete + "?" + query);

  /* Calling back to Shopify */
  body.x_signature = signature;
  ctx.post(callback, body, {
    'Content-Type': 'application/x-www-form-urlencoded'
  }).then(function(res){
    console.log(res);
  }).catch(function(e){
    console.log("ERROR!! " + e);
  });
  
  /* Going back to Shopify as POST redirect */
  ctx.redirect(complete + "?" + query);
  ctx.status = 307;   
  
});

/* Refund */
router.post('/refund', (ctx, next) => {
  console.log("******refund******");
  console.log(ctx.request.body);
  /* Check the signature */
  if (!checkSignature(ctx.request.body)) {
    ctx.status = 400;
    return;
  }
  ctx.status = 200;
});

/* Capture */
router.post('/capture', (ctx, next) => {
  console.log("****capture******");
  console.log(ctx.request.body);
  /* Check the signature */
  if (!checkSignature(ctx.request.body)) {
    ctx.status = 400;
    return;
  }
  ctx.status = 200;
});

/* Create HAMC signature from the given json */
const createSignature = function(json) {
  let temp = JSON.parse(JSON.stringify(json));
  if (typeof temp.x_signature !== 'undefined') delete temp.x_signature; 
  if (typeof temp.authenticity_token !== 'undefined') delete temp.authenticity_token; 
  let msg = Object.entries(temp).sort().map(e => e.join('')).join('');
  console.log("createSignature, given msg: " + msg);
  const hmac = crypto.createHmac('sha256', CHECK_KEY);
  hmac.update(msg);
  let signarure = hmac.digest('hex');
  console.log("createSignature, created sig: " + signarure);
  return signarure;
};

/* Check if the given signarure is corect or not */
const checkSignature = function(json) {
  console.log("checkSignature, given: " + json.x_signature);
  let sig = createSignature(json);
  console.log("checkSignature, created: " + sig);
  return sig === json.x_signature ? true : false;
};

app.use(router.routes());
app.use(router.allowedMethods());

if (!module.parent) app.listen(process.env.PORT || 3000);