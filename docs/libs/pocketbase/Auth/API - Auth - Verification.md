# API Auth

## Auth Verification

Sends auth record email verification request.

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

await pb.collection('users').requestVerification('test@example.com');

// ---
// (optional) in your custom confirmation page:
// ---

await pb.collection('users').confirmVerification('VERIFICATION_TOKEN');
```

### API Details

#### Body Parameters

##### Request Verification

1. email
    * type: String
    * required: true
    * Description:
      * The auth record email address to send the verification request (if exists).

##### Confirm Verification

1. token
    * type: String
    * required: true
    * Description:
      * The token from the verification request email.


#### Responses

##### 200
```
null
```

##### 400
```
{
  "status": 400,
  "message": "An error occurred while validating the submitted data.",
  "data": {
    "email": {
      "code": "validation_required",
      "message": "Missing required value."
    }
  }
}
```
