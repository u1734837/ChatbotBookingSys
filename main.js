const express = require('express');
const app = express();
const dfff = require('dialogflow-fulfillment');
const mysql = require('mysql');


app.get('/', (req, res) => {
    res.send("We are live")
});


app.post('/', express.json(),(req, res) => {
    const agent = new dfff.WebhookClient({
        request : req,
        response : res
    });
});


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

function insertCustomer(connection, data){
    return new Promise((resolve, reject) => {
      connection.query('INSERT INTO users SET ?', data, (error, results, fields) => {
        resolve(results);
      });
    });
  }

function queryShieldYes(connection){
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM appointment WHERE shielding = 'yes' AND taken < 5", (error, results, fields) => {
            resolve(results);
        });
    });
}
function handleReadShieldYes(agent){
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

function handleWriteBooking(agent){
    const data = {
      name: agent.parameters.given-name,
      email: agent.parameters.email
    };
    return connectToDatabase()
    .then(connection => {
      return insertCustomer(connection, data)
      .then(result => {
 		agent.add(`Data inserted`);       
        connection.end();
      });
    });
  }



let intentMap = new Map();

intentMap.set('shieldYesTime', handleReadShieldYes);
intentMap.set('confirmBooking', handleWriteBooking)




app.listen(3333, () => console.log("Server is live at port 3333"));