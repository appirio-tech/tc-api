[![Build Status](https://drone.io/github.com/cloudspokes/tc-api/status.png)](https://drone.io/github.com/cloudspokes/tc-api/latest)

TopCoder API (built on NodeJS)
==============================

As [TopCoder](http://www.topcoder.com/tc) and [CloudSpokes](http://www.cloudspokes) integrate, the APIs are going to play a critical role. TopCoder has already started work on a API, which can be found [here](http://dev.topcoder.com). That API is built on a Java stack.

In order to accelerate development we are looking to move some of the API work to use a more cloud-friendly approach built on [NodeJS](http://www.nodejs.org). This is complicated by the fact that the back end of TC relies on an Informix DB.

Usage
-----

See the [Deployment Guide](https://github.com/cloudspokes/tc-api/blob/master/docs/Deployment%20Guide.doc) for detailed instructions. 

*NOTE:* You should develop and test using 64bit linux. To date we have validated successful deployments only on Ubuntu 10.04 and Centos 6.4. Other flavors/versions of 64bit linux should work, but have not been validated. OS X and Windows based operating systems most likely will NOT work.

