Issues that are not fixed:
==========================
 1) I think logout should also be demonstrated.
       - I don't think this is required. Because the app is not using any session and it is stateless. If the access token is not filled in text box, it simulates unauthorized/logged out user

2) It is recommended to make the authorization asynchronous like the examples in https://github.com/jaredhanson/passport-oauth. I.e., in services.js, line 135, the function content is better to be wrapped by process.nextTick();

       - I don't think this is required. And I don't find any example using nextTick(). Refer: It is recommended to make the authorization asynchronous like the examples in https://github.com/jaredhanson/passport-oauth. I.e., in services.js, line 135, the function content is better to be wrapped by process.nextTick();

3) strategy.js, line 59, what's the purpose of it..
       - If the option is not set to false, passport will try to fetch the user profile.
