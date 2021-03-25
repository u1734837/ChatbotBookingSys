const express = require('express');
const app = express();
const dfff = require('dialogflow-fulfillment');


app.get('/', (req, res) => {
    res.send("We are live")
});

app.post('/', express.json(),(req, res) => {
    const agent = new dfff.WebhookClient({
        request : req,
        response : res
    });

    function demo(agent){
        agent.add("WEBHOOK TEST CHAT");
    }

    function timesAvailable(agent)
    {
        var timeSlots = {  
            "richContent": [
            [
              {
                "type": "description",
                "title": "Times available",
                "text": [
                  "This is text line 1.",
                  "This is text line 2.",
                  "This is text line 3."
                ]
              }
            ]
          ]}
            
    

        agent.add( new dfff.Payload(agent.UNSPECIFIED, timeSlots, {sendAsMessage: true, rawPayload: true}))
    }




    var intentMap = new Map();

    intentMap.set('webhooktest', demo)
    intentMap.set('timesAvailable', timesAvailable)

    agent.handleRequest(intentMap);

});

app.listen(3333, () => console.log("Server is live at port 3333"));