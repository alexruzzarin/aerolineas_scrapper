const Swagger = require('swagger-client');
const chalk = require('chalk');
const twilio = require('twilio');

const Dashboard = require('./Dashboard');

const dashboard = new Dashboard();
const params = {
  apikey: '********',
  origin: 'EZE',
  destination: 'JFK',
  departure_date: '2017-01-28',
  return_date: '2017-02-26',
  adults: 1,
  include_airlines: 'AR',
  nonstop: true,
  currency: 'USD'
};
const twilioParams = {
  accountSid: '****',
  authToken: '****',
  phoneFrom: '****',
  phoneTo: '****'
};
const dealPrice = 1350;
const prices = [];

dashboard.render();

new Swagger({
  url: 'https://raw.githubusercontent.com/amadeus-travel-innovation-sandbox/sandbox-content/master/swagger.yml',
  usePromise: true
}).then((client) => {
  fetch(client);
});

function fetch (client) {
  client.default.Flight_Low_Fare_Search(params).then((result) => {
    const parsedResult = JSON.parse(result.data);

    if (parsedResult.results && parsedResult.results.length) {
      const firstResult = parsedResult.results[ 0 ];

      processResult(firstResult);
    }

    dashboard.render();
  }).catch(function (error) {
    dashboard.log([ 'Oops!  failed with message: ' + error.statusText ]);
  });
  setTimeout(() => fetch(client), 120000);
}

function processResult (result) {
  const averagePrice = average(prices);
  const totalPrice = result.fare.total_price;

  const itinerary = result.itineraries[ 0 ];
  const outboundFlight = itinerary.outbound.flights[ 0 ];
  const inboundFlight = itinerary.inbound.flights[ 0 ];

  const logMessage = `Out - ${processFlightInfo(outboundFlight)} | In - ${processFlightInfo(inboundFlight)} | Price: ${params.currency}${totalPrice}`;
  let logColor = chalk.blue;
  if (totalPrice < dealPrice) {
    logColor = chalk.bold.green;
    sendTextMessage(logMessage);
  } else if (totalPrice < averagePrice) {
    logColor = chalk.green;
    sendTextMessage(logMessage);
  } else if (totalPrice > averagePrice) {
    logColor = chalk.red;
  }

  dashboard.log([ logColor(logMessage) ]);
  dashboard.plot(totalPrice);
  prices.push(totalPrice);
}

function processFlightInfo (flight) {
  const flightCode = flight.marketing_airline + flight.flight_number;
  const seatsRemaining = flight.booking_info.seats_remaining;

  return `Code: ${flightCode}, Seats remaining: ${seatsRemaining}`;
}

function sendTextMessage (message) {
  const twilioClient = twilio(twilioParams.accountSid, twilioParams.authToken);

  twilioClient.messages.create({
    to: twilioParams.phoneTo,
    from: twilioParams.phoneFrom,
    body: message
  }).then(() => {
    dashboard.log([
      chalk.green(`Successfully sent SMS to ${twilioParams.phoneTo} from ${twilioParams.phoneFrom}`)
    ]);
  }).catch(() => {
    dashboard.log([
      chalk.red(`Error: failed to send SMS to ${twilioParams.phoneTo} from ${twilioParams.phoneFrom}`)
    ]);
  });
}

function average (times) {
  const sum = times.reduce((a, b) => a + b, 0);
  return sum / times.length;
}
