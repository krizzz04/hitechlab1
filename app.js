const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Appointment = require('./models/appoinment');

const app = express();
const port = 5000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Connect to MongoDB
mongoose.connect('mongodb+srv://shebinn10:Krizzz%40123@cluster0.xvxphyq.mongodb.net/Laboratory', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lab.html'));
});

app.post('/book-appointment', async (req, res) => {
  const { name, place, phoneNumber, date } = req.body;
  // Convert the date string to a JavaScript Date object
  const appointmentDate = new Date(date);
  // Generate patient ID based on name and date
  const patientId = generateUniqueId(name, appointmentDate);

  try {
    const newAppointment = new Appointment({ name, place, phoneNumber, date: appointmentDate, patientId });
    await newAppointment.save();
    console.log('Appointment saved successfully');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to book appointment');
  }
});

//payment

// Generate a payment link
// Generate a payment link
app.get('/generate-payment-link', (req, res) => {
  const { patientId, amount } = req.query;
  const deepLink = `upi://pay?pa=thejaskrizzz-1@okicici&pn=Thejas&mc=1234&tid=CUS1&tr=${patientId}&tn=Test%20Payment&am=${amount}&cu=INR&url=https://172.20.10.5:5000/payment-confirmation`;

  res.redirect(deepLink);
});



// Handle payment confirmation
app.post('/payment-confirmation', (req, res) => {
  const { patientId, amount, paymentStatus } = req.body;

  if (paymentStatus === 'success') {
    // Update the database to mark the payment as successful for the specific patient
    // Update the database with the payment status and update any other relevant information
    res.send('Payment successful. You can now download your result.');
  } else {
    res.send('Payment failed. Please try again.');
  }
});



app.get('/result', (req, res) => {
  res.render('result');
});

app.get('/get-result', async (req, res) => {
  const { patientId } = req.query;

  try {
    const appointment = await Appointment.findOne({ patientId });

    if (!appointment) {
      res.send('No appointment found with that ID');
      return;
    }

    if (appointment.amount > 0) {
      // Redirect to the payment link
      const deepLink = `upi://pay?pa=9778792630@slice&pn=Thejas&mc=1234&tid=CUS1&tr=${patientId}&tn=Test%20Payment&am=${appointment.amount}&cu=INR&url=https://172.20.10.5:5000/payment-confirmation`;
      res.redirect(deepLink);
      return;
    }

    // Send the result file as a download
    res.download(appointment.resultPdf);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch result');
  }
});







app.get('/admin', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.render('admin', { appointments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch appointments');
  }
});

// Add a route to handle GET requests for fetching the result
app.get('/patient-results', (req, res) => {
  res.render('patient-result');
});






// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

function generateUniqueId(name, date) {
  // Extract day, month, and year from the date
  const day = ('0' + date.getDate()).slice(-2); // Pad with zero if needed
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
  const year = date.getFullYear().toString().substr(-2); // Get the last two digits of the year
  
  // Remove spaces from the name and concatenate with day, month, and year to create the patient ID
  const patientId = name.replace(/\s/g, '') + day + month + year;
  
  return patientId;
}


// Add this code to your app.js file

// Delete an appointment
app.delete('/appointments/:id', async (req, res) => {
  const appointmentId = req.params.id;

  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(appointmentId);

    if (!deletedAppointment) {
      return res.status(404).send('No appointment found with that ID');
    }

    console.log('Appointment deleted successfully');
    res.send('Appointment deleted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete appointment');
  }
});
