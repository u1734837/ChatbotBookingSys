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
function queryShieldYes(connection){
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM appointment WHERE shielding = 'yes", (error, results, fields) => {
            resolve(results);
        });
    });
}
function ReadShieldYes(agent){
    return connectToDatabase()
    .then(connection => {
        return queryShieldYes(connection)
        .then(result => {
            console.log(result);
            agent.add('First name: ${result[0].name}')
            connection.end(); 
        });
    });
}

let intentMap = new Map();

intentMap.set('getDataFromMySQL', ReadShieldYes);




app.listen(3333, () => console.log("Server is live at port 3333"));