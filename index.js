const config = require("js-yaml").load(
  require("fs").readFileSync("./config.yml")
);

const pino = require("express-pino-logger")();

const store = require("le-store-s3").create({
  S3: { bucketName: config.bucketName },
});
const challenge = require("le-challenge-s3").create({
  S3: { bucketName: config.bucketName },
});

const glx = require("greenlock-express").create({
  server: "https://acme-v02.api.letsencrypt.org/directory",
  version: "draft-11", // Let's Encrypt v2 (ACME v2),
  telemetry: true,
  approveDomains: approveDomains,
  logRejectedDomains: false,
  store: store,
});

const httpApp = require("express")();
httpApp.use(pino);

httpApp.all("/*", function (req, res) {
  const domainConfig = config.domains[req.headers.host] || {};
  res
    .header("Cache-Control", `public,max-age=${domainConfig.ttl || 3600}`)
    .redirect(
      domainConfig.status || 301,
      "https://" + req.headers.host + req.url
    );
});
require("http")
  .createServer(glx.middleware(httpApp))
  .listen(3000, function () {
    console.log("Listening to HTTP on ", this.address());
  });

var httpsApp = require("express")();
httpsApp.use(pino);

httpsApp.use("/service-worker.js", function (req, res) {
  const domainConfig = config.domains[req.headers.host] || {};
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", `public,max-age=${domainConfig.ttl || 3600}`);
  res.send("");
});

httpsApp.use("/*", function (req, res) {
  const domainConfig = config.domains[req.headers.host] || {};
  const destinationDomain = domainConfig.dest || "www." + req.headers.host;

  if (domainConfig.hsts) {
    res = res.header("Strict-Transport-Security", domainConfig.hsts);
  }

  res
    .header("Cache-Control", `public,max-age=${domainConfig.ttl || 3600}`)
    .redirect(
      domainConfig.status || 301,
      "https://" + destinationDomain + req.originalUrl
    );
});
require("https")
  .createServer(glx.httpsOptions, httpsApp)
  .listen(3443, function () {
    console.log("Listening on HTTPS on", this.address());
  });

function approveDomain(domain) {
  if (!domain || config.allowAllDomains) {
    return true;
  }
  return !!config.domains[domain];
}

function approveDomains(opts, certs, cb) {
  opts.challenges = { "http-01": challenge };

  if (certs) {
    opts.domains = certs.altnames;
  } else {
    opts.email = config.email;
    opts.agreeTos = true;
  }

  if (approveDomain(opts.domain)) {
    cb(null, { options: opts, certs: certs });
  } else {
    console.warn("Rejecting Request for " + opts.domain);
    cb("Not Approved", {});
  }
}
