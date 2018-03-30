/*
* This file contains the different function that will be used to
* deploy services on iWF
* here we have the following functions:
*     - Deploy a service on iWF
*     - Contact another iControl LX extension to communicate with infoblox
*/

// to allow connection to services that have self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var logger = require('f5-logger').getInstance();
var request = require("../node_modules/request");
//var promise = require("../node_modules/promise");
var DEBUG = true;

function ServiceHTTPAS3Utils () {

  /*
  * AS3 related parameters
  */
  var BIGIPLogin = "admin";
  var BIGIPPassword = "admin";
  var AS3Login = "admin";
  var AS3Password = "admin"
  var authAS3 = 'Basic ' + new Buffer(AS3Login + ':' + AS3Password).toString('base64');

  

this.DeployService = function (BIGIPIP, serviceName, tenantName, poolData, serviceIP) {
  return new Promise (
    function (resolve, reject) {

      if (DEBUG) {
        logger.info("DEBUG: ServiceHTTPAS3Utils - function DeployService ");
      }

      /*
      * we create the service definition to deploy the service through AS3
      */
      //      var updateRestBody = "{ \"name\": \"" + serviceName + "\", \"tenantTemplateReference\": { \"link\": \"https://localhost/mgmt/cm/cloud/tenant/templates/iapp/" + templateName + "\"}, \"tenantReference\": { \"link\": \"https://localhost/mgmt/cm/cloud/tenants/" + tenantName + "\"},\"vars\": [";
      var jsonPoolDataMembers = JSON.stringify(poolData.members,' ','\t');
      var jsonPoolDataMonitors = JSON.stringify(poolData.monitors,' ','\t');
      var createRestBody = `{
        \"class\": \"ADC\",
        \"schemaVersion\": \"0.0.1\",
        \"id\": \"INET_WEB80\",
        \"label\": \"INET_WEB80 Template\",
        \"remark\": \"INET_WEB80\",
        \"controls\": {
          \"trace\": true,
          \"logLevel\": \"debug\",
          \"deployToHost\": \"${ BIGIPIP }\",
          \"deployToPort\": 443,
          \"deployToCredentials\": \"${BIGIPLogin}:${BIGIPPassword}\"
        },
        \"updateMode\": \"selective\",
        \"${tenantName}\": {
          \"class\": \"Tenant\",
          \"${serviceName}\": {
            \"class\": \"Application\",
            \"applicationType\": \"http\",
            \"vsMain\": {
              \"class\": \"VS_HTTP\",
              \"virtualAddresses\": [
                \"${serviceIP}\"
              ],
              \"pool\": \"${serviceName}_pool\",
              \"profileTCP\": { \"bigip\": \"/Common/tcp-wan-optimized\" }
            },
            \"${serviceName}_pool\": {
              \"class\": \"Pool\",
              \"monitors\": ${jsonPoolDataMonitors},
              \"members\": ${jsonPoolDataMembers}
            }
          }
        }
      }`;

      if (DEBUG) {
        logger.info ("DEBUG: ServiceHTTPAS3Utils: function DeployService - create service BODY is: !" + createRestBody + "!");
      }

      var jsonBody = JSON.parse(createRestBody);
      var options = {
        method: 'POST',
        url: 'https://192.168.143.26/mgmt/shared/appsvcs/declare',
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
