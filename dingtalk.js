const https = require("https");
const url = require('url');
const envsub = require('envsub');

const Token = process.env.FLOWCI_DING_TOKEN;
const DingTalkUrl = "https://oapi.dingtalk.com/robot/send?access_token=" + Token;

console.log = function (msg) {
  process.stdout.write(msg + '\n');
};

console.error = function (msg) {
  process.stderr.write(msg + '\n');
}

console.log('#################### DingTalk ####################')

createMessage().then((data) => {
  send(data);
});

async function createMessage() {
  return {
    "msgtype": "markdown",
    "markdown": {
      "title": "flow.ci",
      "text": await readTemplate()
    }
  };
}

function readTemplate() {
  let options = {
    diff: false,
    system: true,
    syntax: 'default'
  };

  let templateFile = `${__dirname}/template.md`;
  let outputFile = `${__dirname}/template.out`;

  return new Promise((resolve, reject) => {
    envsub({templateFile, outputFile, options}).then((envobj) => {
      resolve(envobj.outputContents);
    }).catch((err) => {
      console.error(err);
      process.exit(1)
    });
  });
}

function send(data) {
  const dataInStr = JSON.stringify(data);
  const options = url.parse(DingTalkUrl);
  options.method = 'POST'
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': dataInStr.length
  }

  const req = https.request(options, (res) => {
    res.on('data', (d) => {
      const data = JSON.parse(d);
      onResponse(data);
    });
  });

  req.on('error', (e) => {
    console.error(e);
    process.exit(1);
  });

  req.write(dataInStr);
  req.end();
}

/**
 * Handle DingTalk response Ex: {"errmsg":"ok","errcode":0}
 */
function onResponse(response) {
  if (response.errcode == 0) {
    console.log(response.errmsg);
    process.exit();
  }

  console.error(response.errmsg)
  process.exit(1)
}
