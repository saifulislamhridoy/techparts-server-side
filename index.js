const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// midleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lqgn3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }

async function run(){
try{
 await client.connect()
 const productCollection = client.db('techparts').collection('product');
 const userCollection = client.db('techparts').collection('users');
 
 app.post('/product',async(req,res)=>{
     const product = req.body 
     const result = await productCollection.insertOne(product)
     res.send(result)
 })

 app.put('/user/admin/:email',verifyJWT,async(req,res)=>{
    const email = req.params.email
    const requester=req.decoded.email
    const requesterAccount = await userCollection.findOne({email:requester})
    if(requesterAccount.role==='admn'){
        const filter = {email:email}
        const updateDoc ={
            $set:{
                role:"admin"
            }
        }
      const result = await userCollection.updateOne(filter,updateDoc)
      res.send(result)
    }
    else{
        res.status(403).send({massege:'Forbidden'})
    }
})

 app.put('/user/:email',async(req,res)=>{
     const email = req.params.email
     const user = req.body
     const filter = {email:email}
     const options={upsert:true}
     const updateDoc ={
         $set:user
     }
   const result = await userCollection.updateOne(filter,updateDoc,options)
   const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
   res.send({result,token})
 })

 app.get('/user',verifyJWT, async (req, res) => {
    const users = await userCollection.find().toArray();
    res.send(users);
  });
}
finally{

}
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('runing Techpars')
})

app.listen(port,()=>{
    console.log('Runing port',port);
})