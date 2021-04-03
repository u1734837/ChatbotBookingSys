//Requiring all of the necessary packages
const express = require('express');
const app = express();
const { WebhookClient } = require('dialogflow-fulfillment');
const mysql = require('mysql');
const dfff = require('dialogflow-fulfillment');

//testing server is working
app.get('/', (req, res) => {
    res.send("We are live")
});


app.use(express.json());
app.listen(3333, "127.0.0.1", () => { console.log('listening at http://127.0.0.1:3333') });

app.post('/', function (request, response) {
  const agent = new WebhookClient({ request, response });
  console.log('header: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));

//creating a connection to my DB
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
   //Querying DB for non shield times
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
    //Pulling data from the shielded DB query and displaying in the chatbot agent
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
  //Querying DB for non shield times
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
  //Pulling data from the non shield DB query and displaying in the chatbot agent
  function handleReadShieldNo(agent){
    console.log("handleShieldNo has started")
      return connectToDatabase()
      .then(connection => {
        return queryShieldNo(connection)
        .then(result => {
          console.log("log: ", result);
          var payloadNoShieldData = {
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
          agent.add(new dfff.Payload(agent.UNSPECIFIED, payloadNoShieldData, {sendAsMessage: true, rawPayload: true}))
          connection.end(); 
      })
      .catch(error => console.log("error", error))
  });
}

//insert into customer data into customer table
  function insertBooking(connection, data){
    return new Promise((resolve, reject) => {
      connection.query('INSERT INTO customer SET ?', data, (error, results, fields) => {
        resolve(results);
      });
    });
  }
  //inserting for shielding booking
  function handleInsertBooking1(agent){
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
  //inserting for non shielding booking
  function handleInsertBooking2(agent){
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

  //Delete appointment from customer table
  function deleteBooking(connection, email){
    return new Promise((resolve, reject) => {
      connection.query(`DELETE from users WHERE email = ?`, email, (error, results, fields) => {
        resolve(results);
      });
    });
  }



  let intentMap = new Map();

  intentMap.set('shieldYesTime', handleReadShieldYes);
  intentMap.set('shieldNoTime', handleReadShieldNo);
  intentMap.set('confirmBooking1', handleInsertBooking1);
  intentMap.set('confirmBooking2', handleInsertBooking2);


  agent.handleRequest(intentMap);
});

