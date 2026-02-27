const express = require('express');

const {handleUserSignup} = require('../Controllers/userController');


const router = express.Router();

router.post('/signup',handleUserSignup);


module.exports = router;