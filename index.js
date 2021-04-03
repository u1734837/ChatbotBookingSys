const express = require('express');
const app = express();
const { WebhookClient } = require('dialogflow-fulfillment');
const mysql = require('mysql');
const dfff = require('dialogflow-fulfillment');


app.get('/', (req, res) => {
    res.send("We are live")
});


app.use(express.json());
app.listen(3333, "127.0.0.1", () => { console.log('listening at http://127.0.0.1:3333') });

app.post('/', function (request, response) {
  const agent = new WebhookClient({ request, response });
  console.log('header: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));





  function connectToDatabase(){
    const connection = mysql.createConnection({
        host: 'localhost', 
        port: 3306,
        debug: true,
        user: 'nathan1',
        password: 'password',
        database: 'nathan_uni2' 
    });

    return new Promise((resolve, reject) => {
        connection.connect();
        resolve(connection);
    })
  }
  function queryShieldYes(connection){
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM appointment WHERE shielding = 'yes' AND taken < 5", (error, results, fields) => {
          if(error){
            reject(error)
          }
          resolve(results);
            console.log("query result:"+results);
        });
    });
  }
  function handleReadShieldYes(agent){
    console.log("handleShieldYes has started")

    return connectToDatabase()
    .then(connection => {
        return queryShieldYes(connection)
        .then(result => {
            console.log("log: ", result);
            var payloadYesShieldData = {
              "richContent": [
                [
                  {
                    "type": "info",
                    "title": "Times available"
                  },
                  {
                    "type": "chips",
                    "options": [
                      {
                        "text": `${result[0].time}`,
                      },
                      {
                        "text": `${result[1].time}`,
                      }
                    ]
                  }
                ]
              ]
            }
            agent.add(new dfff.Payload(agent.UNSPECIFIED, payloadYesShieldData, {sendAsMessage: true, rawPayload: true}))
            connection.end(); 
        })
        .catch(error => console.log("error", error))
    });
  }
  function insertBooking(connection, data){
    return new Promise((resolve, reject) => {
      connection.query('INSERT INTO customer SET ?', data, (error, results, fields) => {
        resolve(results);
      });
    });
  }
  
  function handleInsertBooking(agent){
    const data = {
      name: agent.context.get("book_awaiting_name").parameters['given-name'],
      email: agent.context.get("book_awaiting_email").parameters.email
    };
    return connectToDatabase()
    .then(connection => {
      return insertBooking(connection, data)
      .then(result => {
     agent.add(`Thank you, your booking has been placed, please arrive on time.`);       
        connection.end();
      });
    });
  }




  let intentMap = new Map();

  intentMap.set('shieldYesTime', handleReadShieldYes);
  intentMap.set('confirmBooking', handleInsertBooking);

  agent.handleRequest(intentMap);
});


function queryShieldNo(connection){
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM appointment WHERE shielding = 'no' AND taken < 15", (error, results, fields) => {
          if(error){
            reject(error)
          }
          resolve(results);
            console.log("query result:"+results);
        });
    });
  }