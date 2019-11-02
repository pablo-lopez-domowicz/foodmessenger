'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  
  console.log("xxxxxxxxxxx");
  
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      console.log(Boolean(webhook_event.message));
      console.log(Boolean(webhook_event.postback));
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "<YOUR VERIFY TOKEN>";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;
  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
    }
  }

  if (received_message && received_message.quick_reply && received_message.quick_reply.payload === 'SEEKER') {
    console.log("xxxx");
    
    response = startSeekerFlow()
  } 
  
  // Send the response message
  callSendAPI(sender_psid, response);    
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
   let response;
  // Get the payload for the postback
  let payload = received_postback.payload;
  console.log(payload);
  // Set the response based on the postback payload
  if (payload === "GET_STARTED") {
    console.log(12345);
    let quickReplies = [
      {
        title:"Seeker",
        payload: "SEEKER"
      },
      {
        title:"Provider",
        payload: "PROVIDER"
      }
    ]
    response = genQuickReply("What are you?", quickReplies);
    console.log(6);
    
  }

  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  console.log(7);
  callSendAPI(sender_psid, response);
  console.log(8);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  console.log(request_body);
  
  
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    console.log(res);
    
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}


function genQuickReply(text, quickReplies) {
  let response = {
    text: text,
    quick_replies: []
  };

  for (let quickReply of quickReplies) {
    response["quick_replies"].push({
      content_type: "text",
      title: quickReply["title"],
      payload: quickReply["payload"]
    });
  }

  return response;
}