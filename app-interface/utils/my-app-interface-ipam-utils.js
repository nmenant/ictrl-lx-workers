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

function MyAppInterfaceIPAMUtils (name, subnet) {

  /*
  * iWorkflow related parameters to communicate with the IPAM REST Worker
  */
  var IWF_IP = "10.100.60.75";
  var tenantName = "student";
  var iWFLogin = "admin";
  var iWFPassword = "admin"
  var IPAMRestWorkerURI = "/mgmt/shared/workers/ipam-infoblox";
  var auth = 'Basic ' + new Buffer(iWFLogin + ':' + iWFPassword).toString('base64');
  var name = name;
  var subnet = subnet;

  if (DEBUG) {
    logger.info("MyAppInterfaceIPAMUtils: function GetVSIP, serviceName: " + name + " and subnet: " + subnet);
  }
  /*
  * This function will talk with your infoblox-ipam worker to retrieve the VS IP
  */
  this.GetVSIP = function () {
    return new Promise (
      function (resolve, reject) {
        var postData = {
          "name": name,
          "subnet": subnet
        };
        var options = {
          method: 'POST',
      		url: 'https://' + IWF_IP + IPAMRestWorkerURI,
      		headers:
        		{
          		"authorization": auth,
          		'content-type': 'application/json'
      			},
          body: postData,
          json: true
        };
        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("MyAppInterfaceIPAMUtils: function GetVSIP, http request to iWF IPAM worker failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("MyAppInterfaceIPAMUtils: function GetVSIP, http request to iWF IPAM worker - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("MyAppInterfaceIPAMUtils: function GetVSIP, http request to iWF IPAM worker succeeded - body: " + body.value);
              }
              resolve(body.value);
            } else {
                if (DEBUG) {
                  logger.info("MyAppInterfaceIPAMUtils: function GetVSIP, http request to iWF IPAM worker failed - body: " + body.value);
                }
              reject (body);
            }
          }
        });
      }
    )
  }
};

module.exports = MyAppInterfaceIPAMUtils;