const express= require('express');


//Routes
const userRoute = require('./Routes/userRoute');

const app = express()


app.get('/user',userRoute);
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})