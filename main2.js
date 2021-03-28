const express = require('express');
const app = express();
const { WebhookClient } = require('dialogflow-fulfillment');
const mysql = require('mysql');


app.get('/', (req, res) => {
    res.send("We are live")
});


app.use(express.json());
app.listen(3333, "127.0.0.1", () => { console.log('listening at http://127.0.0.1:3333') });

app.post('/', function (request, response) {
  const agent = new WebhookClient({ request, response });
  console.log('header: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));

  function handleReadShieldYes(agent){
    console.log("handleShieldYes has started")
    return connectToDatabase()
    .then(connection => {
        return queryShieldYes(connection)
        .then(result => {
            console.log(result);
            agent.add('TEST')
            connection.end(); 
        });
    });
  }



  function connectToDatabase(){
    const connection = mysql.createConnection({
        host: '138.68.144.68', 
        user: 'nathan',
        password: 'password',
        database: 'nathan_uni' 
    });

    return new Promise((resolve, reject) => {
        connection.connect();
        resolve(connection);
    })
  }
  function queryShieldYes(connection){
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM appointment WHERE shielding = "yes" AND taken < 5', (error, results, fields) => {
            resolve(results);
            console.log("query result:"+results);
        });
    });
  }





  let intentMap = new Map();

  intentMap.set('shieldYesTime', handleReadShieldYes);
  ////intentMap.set('confirmBooking', handleWriteBooking);

  agent.handleRequest(intentMap);
});

