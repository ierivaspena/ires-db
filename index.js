// Import package
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

//PASSWORD UTILS
//CREATE FUNCTION TO RANDOM SALT
var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex') /* covert to hex fomrat */
    .slice(0,length);
};

var sha512 = function(password,salt) {
    var hash = crypto.createHmac('sha512',salt);
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };

};

function saltHashPassword(userPassword){
    var salt = genRandomString(16); // Create 16 random charater
    var passwordData = sha512(userPassword, salt);
    return passwordData;

}

function checkHashPassword (userPassword, salt){
    var passwordData = sha512(userPassword, salt);
    return passwordData;

}
//Create Express Service
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Create MongoDB Client
var MongoClient = mongodb.MongoClient;

//Connection URL
//var url = 'mongodb+srv://ierivaspena:<Sarabi1!>@cluster0-jymue.mongodb.net/test?retryWrites=true&w=majority';
//var url = 'mongodb+srv://ierivaspena:Sarabi1!@cluster0-jymue.mongodb.net/test?retryWrites=true&w=majority' // 27017is the default port
var url = 'mongodb://localhost:27017'

MongoClient.connect(url, {useNewUrlParser: true}, function(err, client){
    if (err)
        console.log('Unable to connect to the mongoDB server.Error', err);
    else{

        //Register
        app.post('/register', (request,response, next)=>{
            var post_data = request.body;

            var plaint_password = post_data.password;
            var hash_data = saltHashPassword(plaint_password);

            var password = hash_data.passwordHash;//save password hash
            var salt = hash_data.salt; //Save salt

            var name = post_data.name;
            var lastname = post_data.lastname;
            var username = post_data.username;


            var insertJson = {
                'name':name,
                'password': password,
                'salt': salt,
                'lastname': lastname,
                'username': username

            };
            var db = client.db('pButton');

            // Check exists username
            db.collection('user')
                .find({'username': username}).count(function(err,number){
                    if(number != 0)
                    {
                       response.json('Username already exists');
                       console.log('Username already exist'); 
                    }
                    else
                    {
                        //Insert data
                        db.collection('user')
                            .insertOne(insertJson, function(error, res){
                                response.json('Registration success');
                                console.log('Registration success'); 

                            })
                    }
                })
        });

        //Login
        app.post('/login', (request,response, next)=>{
            var post_data = request.body;


            var username = post_data.username;
            var userPassword = post_data.password;
            
            var db = client.db('pButton');

            // Check exists username
            db.collection('user')
                .find({'username': username}).count(function(err,number){
                    if(number == 0)
                    {
                       response.json('Username not exists');
                       console.log('Username not exist'); 
                    }
                    else
                    {
                        //Insert data
                        db.collection('user')
                           .findOne({'username': username},function(err, user){
                               var salt = user.salt; //get salt from user
                               var hashed_password = checkHashPassword(userPassword,salt).passwordHash; // hash password with hash
                               var encrypted_password = user.password; // get password from user
                               if(hashed_password == encrypted_password)
                               {
                                    response.json('Login success');
                                    console.log('Login success'); 
                               }
                               else{
                                    response.json('Wrong password');
                                    console.log('Wrong password'); 
                               }

                           })

                            
                    }
                })
        });
        
        //Location
        app.post('/location', (request,response, next)=>{
          var post_data = request.body;

          var longitud = post_data.longitud;
          var latitud = post_data.latitud;
          var timeStamp = post_data.timeStamp;
          //var user_id = post_data
          var insertJson = {
            'latitud': latitud,
            'longitud':longitud,
            'timeStamp':timeStamp
        };
        var db = client.db('pButton');

          //Insert data
          db.collection('coordinates')
          .insert(insertJson, function(error, res){
              response.json('coordinates recieved');
              console.log('coordinates recieved'); 

          })
  
        });

/*
        app.get('/location', (request, response, next)=>{
            var get_data=request.body;
            var db = client.db('pButton');
            db.collection('coordinates')
            .findOne({},function(error, res){
                if(err){
                   response.json('coordinatesno exist'); 
                   console.log('coordinates not exits'); 
                }
                else {
                    response.json('coordinates exist');
                    console.log('coordinates exits'); 
                }
                
                
            })

        });
        */

        

        //Start Web Server
        app.listen(3000,()=>{
            console.log('Connected to MongoDB Server , WebService running on port 3000');  
        })
    
    }

    
})
