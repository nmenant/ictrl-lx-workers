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
//var promise = require("../node_modules/promise");
var DEBUG = true;
// specify whether you want infoblox to handle the VS IP or if it will be provided by the consumer
var useInfoblox = false;
// subnet is used with infoblox to specify in which subnet you need an IP -- SHOULD BE MOVED INTO API CALL
var subnet = "10.100.60.0/24";

function ServiceHTTPAS3Utils () {

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


        if (DEBUG) {
          logger.info("DEBUG: ServiceHTTPAS3Utils - function DeployService ");
        }

  /*      if (useInfoblox) {
          var IPAMQuery = new AppInterfaceIPAMFunc(serviceName, subnet);
        } else {
      //    serviceIP = newState["service-ip"];
      */

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
            \"class\": \"Tenant\",`;

        for(var i=0; i < appData.length; i++) {
          jsonPoolDataMembers = JSON.stringify(appData[i].members,' ','\t');
          jsonPoolDataMonitors = JSON.stringify(appData[i].monitors,' ','\t');
          if ( i > 0) {
            createRestBody += ",";
          }
          composeBody(appData[i], jsonPoolDataMembers, jsonPoolDataMonitors);
        }

        function composeBody(message, jsonPoolDataMembers, jsonPoolDataMonitors){
          createRestBody += `
            \"${message.name}\": {
              \"class\": \"Application\",
              \"applicationType\": \"http\",
              \"vsMain\": {
                \"class\": \"VS_HTTP\",
                \"virtualAddresses\": [
                  \"${message["service-ip"]}\"
                ],
                \"pool\": \"${message.name}_pool\",
                \"profileTCP\": { \"bigip\": \"/Common/tcp-wan-optimized\" }
              },
              \"${message.name}_pool\": {
                \"class\": \"Pool\",
                \"monitors\": ${jsonPoolDataMonitors},
                \"members\": ${jsonPoolDataMembers}
              }
            }`;
          }

        createRestBody += `
          }
        }`;


        if (DEBUG) {
          logger.info ("DEBUG: ServiceHTTPAS3Utils: function DeployService - create service BODY is: !" + createRestBody + "!");
        }

        var jsonBody = JSON.parse(createRestBody);
        var options = {
          method: 'POST',
          url: 'https://localhost/mgmt/shared/appsvcs/declare',
          headers:
          {
            "authorization": authAS3,
            'content-type': 'application/json'
          },
          body: jsonBody,
          json: true
        };

        if (DEBUG) {
          logger.info ("DEBUG: ServiceHTTPAS3Utils: function DeployService - created options: !" );
        }

        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("DEBUG: ServiceHTTPAS3Utils: function DeployService - request to AS3 failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("DEBUG: ServiceHTTPAS3Utils: function DeployService - request to AS3 - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("DEBUG: ServiceHTTPAS3Utils: function DeployService - request to AS3 - 200 response");
              }
              resolve();
            } else {
              if (DEBUG) {
                logger.info("DEBUG: ServiceHTTPAS3Utils: function DeployService - request to AS3 failed - body: " + JSON.stringify(body));
              }
              reject (body);
            }
          }
        });
      }
    )
  }

}

module.exports = ServiceHTTPAS3Utils;
