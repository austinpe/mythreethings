# API Auth

## Email Change

Sends auth record email change request.

On successful email change all previously issued auth tokens for the specific record will be automatically invalidated.

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

await pb.collection('users').authWithPassword('test@example.com', '1234567890');

await pb.collection('users').requestEmailChange('new@example.com');

// ---
// (optional) in your custom confirmation page:
// ---

// note: after this call all previously issued auth tokens are invalidated
await pb.collection('users').confirmEmailChange('EMAIL_CHANGE_TOKEN', 'YOUR_PASSWORD');
```

### API Details

#### Body Parameters

##### Request Email Change

1. newEmail
    * type: String
    * required: true
    * Description:
      * The new email address to send the change email request.

##### Confirm Verification

1. token
    * type: String
    * required: true
    * Description:
      * The token from the change email request email.
2. password
    * type: String
    * required: true
    * Description:
      * The account password to confirm the email change.


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
    "token": {
      "code": "validation_required",
      "message": "Missing required value."
    }
  }
}
```
