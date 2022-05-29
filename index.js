const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
 const orderCollection = client.db('techparts').collection('orders');
 const reviewCollection = client.db('techparts').collection('reviews');
 const profileCollection = client.db('techparts').collection('profiles');
 
 app.post('/product',async(req,res)=>{
     const product = req.body 
     const result = await productCollection.insertOne(product)
     res.send(result)
 })

 app.get('/admin/:email',async(req,res)=>{
     const email = req.params.email
     const user = await userCollection.findOne({email:email})
     const isAdmin = user.role==="admin"
     res.send({admin:isAdmin})
 })
 app.put('/user/admin/:email',verifyJWT,async(req,res)=>{
    const email = req.params.email
    const requester=req.decoded.email
    const requesterAccount = await userCollection.findOne({email:requester})
    if(requesterAccount.role==='admin'){
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
   const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'7d'})
   res.send({result,token})
 })

 app.get('/user',verifyJWT, async (req, res) => {
    const users = await userCollection.find().toArray();
    res.send(users);
  });

  app.get('/product',async(req,res)=>{
    const products = await productCollection.find().toArray()
    res.send(products)
  })

  app.post('/order',async(req,res)=>{
    const order = req.body
    const result = await orderCollection.insertOne(order)
    res.send(result)
  })

  app.put('/order/:id',async(req,res)=>{
    const id = req.params.id
    const quantity = req.body.quantity
    const filter={_id:ObjectId(id)}
    const product = await productCollection.findOne(filter)
    const remainingQuantity = parseInt(product.availableQuantity) - parseInt(quantity)
    console.log(remainingQuantity);
    const updateDoc ={
      $set:{
        availableQuantity:remainingQuantity
      }
    }
    const result = await productCollection.updateOne(filter,updateDoc)
    res.send(result)
  });

  app.put('/review/:email',async(req,res)=>{
    const email = req.params.email
     const review = req.body
     const filter = {email:email}
     const options={upsert:true}
     const updateDoc ={
         $set:review
     }
     const result = await reviewCollection.updateOne(filter,updateDoc,options);
     res.send(result)
  });

  app.get('/review',async(req,res)=>{
    const reviews =await (await reviewCollection.find().toArray()).reverse()
    res.send(reviews)
  });

  app.put('/profile/:email',async(req,res)=>{
    const email = req.params.email
     const myProfile = req.body
     const filter = {email:email}
     const options={upsert:true}
     const updateDoc ={
         $set:myProfile
     }
     const result = await profileCollection.updateOne(filter,updateDoc,options);
     res.send(result)
  });

  app.get('/profile/:email',async(req,res)=>{
    const email = req.params.email
    const profile = await profileCollection.findOne({email:email})
    res.send(profile)
  });

  app.get('/myOrder/:email',async(req,res)=>{
    const email = req.params.email
    const myOrders = await orderCollection.find({email:email}).toArray()
    res.send(myOrders)
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