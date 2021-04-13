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

  const text = (time) => {
    return ({"text": time})
  };

  function getTime(result){
    return result.map(res => text(res.time))
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
                    "options": getTime(result)
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

  const text2 = (time) => {
    return ({"text": time})
  };

  function getTime2(result){
    return result.map(res => text2(res.time))
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
                  "options": getTime2(result)
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
    const time = agent.context.get("booking_time1").parameters.book_time;
    return connectToDatabase()
    .then(connection => {
      return insertBooking(connection, data),
      updateAppointment1(connection, time)
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
    const time = agent.context.get("booking_time2").parameters.book_time;
    return connectToDatabase()
    .then(connection => {
      return insertBooking(connection, data),
      updateAppointment2(connection, time)   
      .then(result => {
     agent.add(`Thank you, your booking has been placed, please arrive on time.`);       
        connection.end();
      });
    });
  }

  //Delete appointment from customer table
  function deleteBooking(connection, email){
    return new Promise((resolve, reject) => {
      connection.query(`DELETE from customer WHERE email = ?`, email, (error, results, fields) => {
        resolve(results);
      });
    });
  }
  //delete appointment based on user's input
  function handleDeleteBooking(agent){
    const email = agent.context.get("delete_email").parameters.dlt_email;
    return connectToDatabase()
    .then(connection => {
      return deleteBooking(connection, email)
      .then(result => {
 		agent.add(`Thank you, your appointment has now been cancelled. You will need to make another appointment if you wish to attend the event.`);       
        connection.end();
      });
    });
  }
  //update appointment table shielded +1
    //update appointment table
    function updateAppointment1(connection, data){
      return new Promise((resolve, reject) => {
        connection.query(`UPDATE appointment SET taken = taken + 1 WHERE time LIKE + ?`, data, (error, results, fields) => {
          resolve(results);
        });
      });
    }
  //update appointment table non shielded
  function updateAppointment2(connection, data){
    return new Promise((resolve, reject) => {
      connection.query(`UPDATE appointment SET taken = taken + 1 WHERE time LIKE + ?`, data, (error, results, fields) => {
        resolve(results);
      });
    });
  }




  let intentMap = new Map();

  intentMap.set('shieldYesTime', handleReadShieldYes);
  intentMap.set('shieldNoTime', handleReadShieldNo);
  intentMap.set('confirmBooking1', handleInsertBooking1);
  intentMap.set('confirmBooking2', handleInsertBooking2);
  intentMap.set('deleteConfirm', handleDeleteBooking);


  agent.handleRequest(intentMap);
});

