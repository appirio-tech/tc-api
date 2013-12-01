FORMAT: 1A
HOST: http://api.topcoder.com

# Topcoder API
Programmatically access TopCoder contests and members.

# Group Users
**Users API** to get information about user

## User Collection [/v2/mockusers]
### List all Users [GET]
+ Response 200 (application/json)

        [{
          "name": "user1", "email": "user1@topcoder.com"
        }, {
          "name": "user2", "email": "user2@topcoder.com"
        }]

+ Response 500

### Create a user [POST]
+ Request (application/json)

        { "name": "user3", "email": "user3@topcoder.com" }

+ Response 201 (application/json)

        { "id": "3", "name": "user3", "email": "user3@topcoder.com" }

+ Response 400

## Single user [/v2/mockuser/3]
### Update a user [PUT]
+ Request (application/json)
    + Parameters
        + id (optional, string) ... ID of user in the form of a hash.

    + Body
    
            { "id": "3", "name": "newuser3", "email": "user3@topcoder.com" }

+ Response 200 (application/json)

        { "id": "3", "name": "newuser3", "email": "user3@topcoder.com" }

+ Response 204

## Secured User Collection [/v2/secure/mockusers]
### List all Users [GET]
+ Request
    + Headers

            Bearer: your-access-token-here
   
+ Response 200

        {}

### Create a user [POST]
+ Request (application/json)
    + Headers

            Bearer: your-access-token-here

    + Body

            { "name": "user3", "email": "user3@topcoder.com" }

+ Response 200

        {}

+ Response 201 (application/json)

        { "id": "3", "name": "user3", "email": "user3@topcoder.com" }

## Secured Single user [/v2/secure/mockuser/3]
### Update a user [PUT]
+ Request (application/json)
    + Parameters
    
        + id (optional, string) ... ID of user in the form of a hash.

    + Headers
    
            Bearer: your-access-token-here

    + Body

            { "id": "3", "name": "newuser3", "email": "user3@topcoder.com" }

+ Response 200

        {}