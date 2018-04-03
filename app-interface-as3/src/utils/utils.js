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
var serviceHTTPAS3Func = require("./service-http-as3.js");
var serviceTCPAS3Func = require("./service-tcp-as3.js");

function Utils() {

  this.parseAppDefinition = function(appDetails, counter) {
    return new Promise (function (resolve, reject) {
      var serviceHTTPAS3Interface = new serviceHTTPAS3Func();
      var serviceTCPAS3Interface = new serviceTCPAS3Func();

      if (DEBUG) {
        logger.info("DEBUG: ServiceAS3Utils -  function parseAppDefinition - service:  " + appDetails["service-template"] + " counter: " + counter);
      }
      if (appDetails["service-template"].toString() === "web-service") {
        logger.info("ServiceAS3Utils function parseAppDefinition - service template: " + appDetails["service-template"] + " triggered");

        serviceHTTPAS3Interface.createHTTPAS3ServiceDefinition(appDetails)
        .then (function(result) {
          if (DEBUG) {
            logger.info("DEBUG: ServiceAS3Utils function parseAppDefinition - call to function Service HTTP WORKS: " + result);
          }
          resolve(result);
        })
        .catch (function (err) {
          logger.info("DEBUG: ServiceAS3Utils - function DeployService - call to function Service HTTP FAILED: " + JSON.stringify(err));
          reject(err);
        });
      } else if (appDetails["service-template"].toString() === "L4-service") {

        logger.info("ServiceAS3Utils function parseAppDefinition - service template: " + appDetails["service-template"] + " triggered");

        serviceTCPAS3Interface.createTCPAS3ServiceDefinition(appDetails)
        .then (function(result) {
          if (DEBUG) {
            logger.info("DEBUG: ServiceAS3Utils function parseAppDefinition - call to function Service TCP WORKS: " + result);
          }
          resolve(result);
        })
        .catch (function (err) {
          logger.info("DEBUG: ServiceAS3Utils - function DeployService - call to function Service TCP FAILED: " + JSON.stringify(err));
          reject(err);
        });
      } else {
        logger.info("ServiceAS3Utils function parseAppDefinition - service template: " + appDetails["service-template"] + " does not exist");
        resolve();
      }
    });
  }

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
