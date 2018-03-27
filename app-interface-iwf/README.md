#iControl LX extension - My app interface

This iControl LX extension gives you an interface to deploy services on F5 platform

The idea here is to create an interface that has no F5 domain specific knowledge exposed
We will only ask questions relevant to the consumer

The following use cases have been created:
  * Build a service interface that can communicate with infoblox to retrieve
    the service IP (not necessarily known/decided by the consumer)
  * Build a service interface that does not communicate with an IPAM solution

This interface will communicate with F5 iWorkflow platform to deploy services



#Installation

To use this iControl LX extension, you need to install it on your BIG-IP or iWF
platform.

Here is how to do it:
  * Download the latest RPM in the rpm folder
  * Push the rpm on the relevant platform (BIG-IP or iWF) in /var/config/rest/downloads/
  * do a POST requests with the following information:
    * the uri should be https://<ip_platform>/mgmt/shared/iapp/package-management-tasks
    * you need to authenticate yourself to do this call. make sure you are allowed
      to use the API with your account
    * here is the payload to inject:
      ```
      {
        "operation": "INSTALL",
        "packageFilePath": "/var/config/rest/downloads/<your_rpm_name>.rpm"
      }
      ```
Once the RPM is installed you should have a new folder on your platform called
```
ipam-infoblox
```
it is located here:

```
/var/config/rest/iapps
```

this create a new rest API interface available at /shared/workers/my-app-interface

the postman folder contains examples on how to manipulate this API

#Requirements

iControl LX extension is available on:
  * iWorkflow 2.3.0 (recommended)
  * BIG-IP 13.1

#Customization

You have a few variables you'll need to update to adapt the worker to your
environment.

Once you have installed the rpm, update the following variables

/var/config/rest/iapps/my-app-interface/nodejs/my-app-interface.js:

  * var useInfoblox = false : by default my-app-interface won't try to use
    Infoblox. Change this variable to true to communicate with Infoblox
  * var subnet = "10.100.60.0/24" : this will be the subnet we will leverage
    in Infoblox to get a virtual Server IP for the service

/var/config/rest/iapps/my-app-interface/utils/my-app-interface-iwf-utils.js
  * var iWFIP = "10.100.60.75" : IP of your iWorkflow platform
  * var tenantName = "Student" : Tenant you'll use to deploy your service
  * var iWFAdminLogin = "admin" : username  with admin privilegies on iWorkflow
  * var iWFAdminPassword = "admin" : password for the user mentioned previously
  * var iWFTenantLogin = "student" : username who is allowed to deploy/update/
    delete services in the iWorkflow tenant specified with tenantName
  * var iWFTenantPassword = "student" password for the user mentioned previously

if you plan to use Infoblox, you'll also need to update this file

/var/config/rest/iapps/my-app-interface/utils/my-app-interface-ipam-utils.js
  * var iWFIP = "10.100.60.75" : IP of your iWorkflow platform
  * var iWFLogin = "admin" : username  with admin privilegies on iWorkflow
  * var iWFPassword = "admin" : password for the user mentioned previously

#API interface

Here is an example of Service definition if you don't use Infoblox (i.e you
specify the service-ip parameter)

```
  {
    "name": "my-app-name",
    "template": "f5-http-lb",
    "service-ip": "10.1.50.80",
    "clustername": "BIG-IP-student",
    "app-data": [
                {
                    "name": "pool__port",
                    "value": "80"
                }
    ],
    "servers-data": [{
        "name": "pool__Members",
        "columns": [
            "IPAddress",
            "State"
        ],
        "rows": [
            [
                "10.1.10.10",
                "enabled"
            ], [
                "10.1.10.11",
                "enabled"
            ]
        ]
    }]
  }
```

Here is an example of Service definition if you use Infoblox (i.e you
don't specify the service-ip parameter)

```
  {
    "name": "my-app-name",
    "template": "f5-http-lb",
    "clustername": "BIG-IP-student",
    "app-data": [
                {
                    "name": "pool__port",
                    "value": "80"
                }
    ],
    "servers-data": [{
        "name": "pool__Members",
        "columns": [
            "IPAddress",
            "State"
        ],
        "rows": [
            [
                "10.1.10.10",
                "enabled"
            ], [
                "10.1.10.11",
                "enabled"
            ]
        ]
    }]
  }
```


#Postman

Some postman collections are available to provide example on how to manipulate
the app-interface worker.

IT IS IMPORTANT TO UNDERSTAND THAT WHEN YOU USE INFOBLOX, your servicename MUST
A FQDN THAT CAN BE RESOLVED IN A ZONE ON INFOBLOX OR IT WILL FAIL
