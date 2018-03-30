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
  var authAdmin = 'Basic ' + new Buffer(BIGIPLogin + ':' + BIGIPPassword).toString('base64');

  /*  this.UpdateService = function (vsIP, connectorId, body) {
  return new Promise (
  function (resolve, reject) {
  var serviceName = body.name;
  var varsList = body["app-data"];
  var tablesList = body["servers-data"];
  var templateName = body.template;

  if (DEBUG) {
  logger.info("DEBUG: my-app-interface - iWorkflow Utils: function UpdateService - service name: " + body.name);
}

//now we update the service accordingly
// we create the app definition but we add the IPAM IP for Pool__Addr
var updateRestBody = "{ \"name\": \"" + serviceName + "\", \"tenantTemplateReference\": { \"link\": \"https://localhost/mgmt/cm/cloud/tenant/templates/iapp/" + templateName + "\"}, \"tenantReference\": { \"link\": \"https://localhost/mgmt/cm/cloud/tenants/" + tenantName + "\"},\"vars\": [";

// reminder: var varsList  contains all the vars that were defined in our app definition
for(var j=0; j < varsList.length; j++) {
composeBody(varsList[j]);
}
function composeBody(message){
updateRestBody += " { \"name\" : \"" + message.name + "\", \"value\" : \"" + message.value + "\"},";
}

//we add the VS IP to the variable to create the service properly
updateRestBody += "{\"name\": \"pool__addr\",\"value\": \"" + vsIP + "\"}], \"tables\": ";
updateRestBody += JSON.stringify(tablesList,' ','\t');

//add the connector reference
updateRestBody += ",\"properties\": [{\"id\": \"cloudConnectorReference\",\"isRequired\": false, \"value\": \"" + connectorId + "\"}]";
updateRestBody += ",\"selfLink\": \"https://localhost/mgmt/cm/cloud/tenants/" + tenantName + "/services/iapp/" + serviceName + "\"}";

if (DEBUG === true) {
logger.info ("DEBUG: my-app-interface - iWorkflow Utils: function UpdateService - updaterestBody: " + JSON.stringify(updateRestBody,' ','\t'));
}

var jsonBody = JSON.parse(updateRestBody);
var options = {
method: 'PUT',
url: 'https://' + iWFIP + "/mgmt/cm/cloud/tenants/" + tenantName + "/services/iapp/" + serviceName,
headers:
{
"authorization": authTenant,
'content-type': 'application/json'
},
body: jsonBody,
json: true
};

request(options, function (error, response, body) {
if (error) {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function UpdateService, request to iWF failed: " + error);
}
reject (error);
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function UpdateService, request to iWF - response: " + response.statusCode);
}
var status = response.statusCode.toString().slice(0,1);
if ( status == "2") {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function UpdateService, request to iWF - 200 response");
}
resolve();
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function UpdateService, request to iwf failed - body: " + JSON.stringify(body));
}
reject (body);
}
}
});
}
)
}
*/
/*  this.GetServiceVSIP = function (serviceName) {
return new Promise (
function (resolve, reject) {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetServiceVSIP - service name: " + serviceName);
}
var options = {
method: 'GET',
url: 'https://' + iWFIP + "/mgmt/cm/cloud/tenants/" + tenantName + "/services/iapp/" + serviceName,
headers:
{
"authorization": authTenant,
'content-type': 'application/json'
}
};

request(options, function (error, response, body) {
if (error) {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetServiceVSIP, request to iWF failed: " + error);
}
reject (error);
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetServiceVSIP, request to iWF - response: " + response.statusCode);
}
var status = response.statusCode.toString().slice(0,1);
if ( status == "2") {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetServiceVSIP, request to iWF - 200 response");
}
var jsonBody = JSON.parse(body)
var appVarsList = jsonBody.vars;

//we parse vars until we find Pool_Addr since it contains the VS IP
for (var i=0; i < appVarsList.length; i++) {
if (appVarsList[i].name == "pool__addr") {
if (DEBUG) {
logger.info ("my-app-interface - iWorkflow Utils: function GetServiceVSIP, VS IP from service to update is: " + appVarsList[i].value);
}
resolve(appVarsList[i].value);
}
}
reject("Could not find the virtual server IP for the service");
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetServiceVSIP, request to iwf failed - body: " + JSON.stringify(body));
}
reject (body);
}
}
});
}
)
}
*/
/*  this.GetService = function (serviceName) {
return new Promise (
function (resolve, reject) {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetService - get service: " + serviceName);
}

var options = {
method: 'GET',
url: 'https://' + iWFIP + "/mgmt/cm/cloud/tenants/" + tenantName + "/services/iapp/" + serviceName,
headers:
{
"authorization": authTenant,
'content-type': 'application/json'
}
};

request(options, function (error, response, body) {
if (error) {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetService, request to iWF failed: " + error);
}
reject (error);
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetService, request to iWF - response: " + response.statusCode);
}
var status = response.statusCode.toString().slice(0,1);
if ( status == "2") {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetService, request to iWF - 200 response");
}
resolve(body);
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetService, request to iwf failed - body: " + JSON.stringify(body));
}
reject (body);
}
}
});
}
)
}
*/
/*  this.DeleteService = function (serviceName) {
return new Promise (
function (resolve, reject) {

if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeleteService - deleting service: " + serviceName);
}

var options = {
method: 'DELETE',
url: 'https://' + iWFIP + "/mgmt/cm/cloud/tenants/" + tenantName + "/services/iapp/" + serviceName,
headers:
{
"authorization": authTenant,
'content-type': 'application/json'
}
};

request(options, function (error, response, body) {
if (error) {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeleteService, request to iWF failed: " + error);
}
reject (error);
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeleteService, request to iWF - response: " + response.statusCode);
}
var status = response.statusCode.toString().slice(0,1);
if ( status == "2") {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeleteService, request to iWF - 200 response");
}
resolve();
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeleteService, request to iwf failed - body: " + JSON.stringify(body));
}
reject (body);
}
}
});
}
)
}
*/
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
          \"logLevel\": \"debug\"
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
              \"members\": ${jsonPoolDataMembers},
            }
          }
        }
      }`;

      if (DEBUG) {
        logger.info ("DEBUG: ServiceHTTPAS3Utils: function DeployService - create service BODY is: !" + createRestBody + "!");
      }
      /*    // reminder: var varsList contains all the vars that were defined in our app definition
      for(var i=0; i < varsList.length; i++) {
      composeBody(varsList[i]);
    }
    function composeBody(message){
    updateRestBody += "{ \"name\" : \"" + message.name + "\", \"value\" : \"" + message.value + "\"},";
  }

  //we add the VS IP to the variable to create the service properly
  updateRestBody += "{\"name\": \"pool__addr\",\"value\": \"" + vsIP + "\"}], \"tables\": ";
  updateRestBody += JSON.stringify(tablesList,' ','\t');

  //add the connector reference
  updateRestBody += ",\"properties\": [{\"id\": \"cloudConnectorReference\",\"isRequired\": false, \"value\": \"https://localhost/mgmt/cm/cloud/connectors/local/" + connectorId + "\"}]";
  updateRestBody += ",\"selfLink\": \"https://localhost/mgmt/cm/cloud/tenants/" + tenantName + "/services/iapp/" + serviceName + "\"}";
  if (DEBUG) {
  logger.info ("DEBUG: my-app-interface - iWorkflow Utils: function DeployService - create service BODY is: !" + updateRestBody + "!");
}

var jsonBody = JSON.parse(updateRestBody);
var options = {
method: 'POST',
url: 'https://' + iWFIP + "/mgmt/cm/cloud/tenants/" + tenantName + "/services/iapp/",
headers:
{
"authorization": authTenant,
'content-type': 'application/json'
},
body: jsonBody,
json: true
};

request(options, function (error, response, body) {
if (error) {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeployService, request to iWF failed: " + error);
}
reject (error);
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeployService, request to iWF - response: " + response.statusCode);
}
var status = response.statusCode.toString().slice(0,1);
if ( status == "2") {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeployService, request to iWF - 200 response");
}
resolve();
} else {
if (DEBUG) {
logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeployService, request to iwf failed - body: " + JSON.stringify(body));
}
reject (body);
}
}
});*/
}
)
}

};

module.exports = ServiceHTTPAS3Utils;
