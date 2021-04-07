const HttpProxy = require('http-proxy');
const streamify = require('into-stream');

module.exports = target => {

  if (!target) {
    return (req, res, next) => next();
  }

  const proxy = HttpProxy.createProxyServer();

  return (req, res, next) => {
    const buffer = req._body && streamify(JSON.stringify(req.body));
    proxy.web(req, res, { target, buffer, secure: false, changeOrigin: true }, err => next(err));
  };

};
