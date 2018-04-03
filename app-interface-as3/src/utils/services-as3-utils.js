/*
* This file contains the different function that will be used to
* deploy services through AS3
* here we have the following functions:
*     - Deploy a HTTP service
*/

// to allow connection to services that have self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var logger = require('f5-logger').getInstance();
var request = require("../node_modules/request");
var serviceHTTPAS3Func = require("./service-http-as3.js");
var serviceTCPAS3Func = require("./service-tcp-as3.js");
var serviceUtilsFunc = require("./utils.js");
//var promise = require("../node_modules/promise");
var DEBUG = true;
// specify whether you want infoblox to handle the VS IP or if it will be provided by the consumer
var useInfoblox = false;
// subnet is used with infoblox to specify in which subnet you need an IP -- SHOULD BE MOVED INTO API CALL
var subnet = "10.100.60.0/24";

function ServiceAS3Utils () {

  /*
  * AS3 related parameters
  */
  var BIGIPLogin = "admin";
  var BIGIPPassword = "admin";
  var AS3Login = "admin";
  var AS3Password = "admin"
  var authAS3 = 'Basic ' + new Buffer(AS3Login + ':' + AS3Password).toString('base64');

  this.DeployService = function (tenantDefinition) {
    return new Promise (
      function (resolve, reject) {

        var BIGIPIP = tenantDefinition.clustername;
        var tenantName = tenantDefinition.tenant;
        var appData = tenantDefinition["app-data"];
        var idTransaction = tenantDefinition.id;
        var jsonPoolDataMembers;
        var jsonPoolDataMonitors;


        var UtilsInterface = new serviceUtilsFunc();

        if (DEBUG) {
          logger.info("DEBUG: ServiceAS3Utils - function DeployService ");
        }
        logger.info("DEBUG: ServiceAS3Utils - function DeployService  - start to process transaction id: " + idTransaction);
        /*
        * we create the service definition to deploy the service through AS3
        */

        var createRestBody = `{
          \"class\": \"ADC\",
          \"schemaVersion\": \"0.0.1\",
          \"id\": \"${idTransaction}\",
          \"label\": \"INET_WEB80 Template\",
          \"remark\": \"INET_WEB80\",
          \"controls\": {
            \"trace\": true,
            \"logLevel\": \"debug\",
            \"deployToHost\": \"${BIGIPIP}\",
            \"deployToPort\": 443,
            \"deployToCredentials\": \"${BIGIPLogin}:${BIGIPPassword}\"
          },
          \"updateMode\": \"selective\",
          \"${tenantName}\": {
            \"class\": \"Tenant\"`;

            if (DEBUG) {
              logger.info("DEBUG: ServiceAS3Utils - Start building payload, " + appData.length + " app definitions to process");
            }

            function parseApp(appDetails, counter) {
              UtilsInterface.parseAppDefinition(appDetails, counter)
                .then (function (jsonApp) {
                  if (DEBUG) {
                    logger.info("DEBUG: ServiceAS3Utils - returned app definition: " + jsonApp);
                  }
                  //createRestBody += JSON.stringify(jsonApp,' ','\t');
                  createRestBody += jsonApp;
                });
            }

            var promises = [];
            if (DEBUG) {
              logger.info("DEBUG: ServiceAS3Utils - Start building promises");
            }
            for(var i=0; i < appData.length; i++) {
              if (DEBUG) {
                logger.info("DEBUG: ServiceAS3Utils - Start building promises LOOP: " + i);
              }
              promises.push(parseApp(appData[i], i));
            }

            Promise.all(promises)
              .then (function () {
                createRestBody += `
                    }
                  }`;
                  if (DEBUG) {
                    logger.info ("DEBUG: ServiceAS3Utils: function DeployService - request to AS3 body is: !" + createRestBody + "!");
                  }
                }
              )
              .then (function() {
                UtilsInterface.SendPostAPICall(createRestBody, "https://localhost/mgmt/shared/appsvcs/declare", authAS3)
                  .then (function(){
                    resolve();
                  })
                  .catch (function (err) {
                    logger.info("DEBUG: ServiceAS3Utils: function DeployService - request to AS3 error is: "+ err);
                  });
              });
        });
      }
}

module.exports = ServiceAS3Utils;
