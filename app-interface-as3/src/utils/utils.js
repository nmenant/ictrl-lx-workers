/*
* This file contains the different function that will be used to
* deploy services through AS3
* here we have the following functions:
*     - Deploy a HTTP service
*/

// to allow connection to services that have self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var DEBUG = true;
var logger = require('f5-logger').getInstance();
var request = require("../node_modules/request");

function Utils() {

  this.SendPostAPICall = function (restBody, url, authParam) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("DEBUG: Utils - function SendPostAPICall");
        }

        var jsonBody = JSON.parse(restBody);
        var options = {
          method: 'POST',
          url: url,
          headers:
          {
            "authorization": authParam,
            'content-type': 'application/json'
          },
          body: jsonBody,
          json: true
        };

        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("DEBUG: Utils - function SendPostAPICall - request to AS3 failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("DEBUG: Utils - function SendPostAPICall - request to AS3 - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("DEBUG: Utils - function SendPostAPICall - request to AS3 - 200 response");
              }
              resolve();
            } else {
              if (DEBUG) {
                logger.info("DEBUG: Utils - function SendPostAPICall - request to AS3 failed - body: " + JSON.stringify(body));
              }
              reject (body);
            }
          }
        });
      }
    )
  }

}

module.exports = Utils;
