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
var request = require("/usr/share/rest/node/node_modules/request");
var promise = require("/usr/share/rest/node/node_modules/promise");
var DEBUG = true;

function MyAppInterfaceIWFUtils () {

  /*
  * iWorkflow related parameters
  */
  var iWFIP = "10.100.60.75";
  var tenantName = "Student";
  var iWFAdminLogin = "admin";
  var iWFAdminPassword = "admin";
  var authAdmin = 'Basic ' + new Buffer(iWFAdminLogin + ':' + iWFAdminPassword).toString('base64');
  var iWFTenantLogin = "student";
  var iWFTenantPassword = "student";
  var authTenant = 'Basic ' + new Buffer(iWFTenantLogin + ':' + iWFTenantPassword).toString('base64');

  this.UpdateService = function (vsIP, connectorId, body) {
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

  this.GetServiceVSIP = function (serviceName) {
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

  this.GetConnectorName = function (connectorId) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorName - connector Id: " + connectorId);
        }

        var options = {
          method: 'GET',
      		url: 'https://' + iWFIP + "/mgmt/cm/cloud/connectors/local/" + connectorId,
      		headers:
        		{
          		"authorization": authAdmin,
          		'content-type': 'application/json'
      			}
        };

        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorName, request to iWF failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorName, request to iWF - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorName, request to iWF - 200 response");
                logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorName, request to iwf - body: " + body);
              }
              var jsonBody = JSON.parse(body)
              resolve(jsonBody.name);
            } else {
                if (DEBUG) {
                  logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorName, request to iwf failed - body: " + JSON.stringify(body));
                }
                reject (body);
            }
          }
       });
      }
    )
  }

  this.GetService = function (serviceName) {
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

  this.DeleteService = function (serviceName) {
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

  this.DeployService = function (serviceName, templateName, connectorId, vsIP, varsList, tablesList) {
    return new Promise (
      function (resolve, reject) {

        if (DEBUG) {
          logger.info("DEBUG: my-app-interface - iWorkflow Utils: function DeployService ");
        }

        /*
        * we create the service definition to deploy the service on iWF
        */
        var updateRestBody = "{ \"name\": \"" + serviceName + "\", \"tenantTemplateReference\": { \"link\": \"https://localhost/mgmt/cm/cloud/tenant/templates/iapp/" + templateName + "\"}, \"tenantReference\": { \"link\": \"https://localhost/mgmt/cm/cloud/tenants/" + tenantName + "\"},\"vars\": [";

        // reminder: var varsList contains all the vars that were defined in our app definition
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
       });
      }
    )
  }
  /*
  * This function will talk with your infoblox-ipam worker to retrieve the VS IP
  */
  this.GetConnectorID = function (connectorName) {
    return new Promise (
      function (resolve, reject) {

        if (DEBUG) {
          logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorID - connectorName to search is: " + connectorName);
        }

        var options = {
          method: 'GET',
      		url: 'https://' + iWFIP + "/mgmt/cm/cloud/connectors/local",
      		headers:
        		{
          		"authorization": authAdmin,
          		'content-type': 'application/json'
      			}
        };

        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorID, request to iWF failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorID, request to iWF - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              var jsonBody = JSON.parse(body);
              var connectorsList = jsonBody.items;
              if (DEBUG) {
                logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorID, request to iWF - list of connectors: " + JSON.stringify(connectorsList));
              }
              //Parse the connectors to find the one matching the one specified in the request
              for (var k=0; k < connectorsList.length; k++) {
                if (connectorsList[k].name == connectorName) {
                  if (DEBUG) {
                    logger.info ("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorID, connector ID is : " + connectorsList[k].connectorId);
                  }
                  resolve(connectorsList[k].connectorId);
                }
              }
              reject("connector Id not found");
            } else {
                if (DEBUG) {
                  logger.info("DEBUG: my-app-interface - iWorkflow Utils: function GetConnectorID, request to iwf failed - body: " + JSON.stringify(body));
                }
                reject (body);
            }
          }
       });
      }
    )
  }
};

module.exports = MyAppInterfaceIWFUtils;
