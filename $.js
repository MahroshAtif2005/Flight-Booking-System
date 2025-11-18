$.ajax({
  url: 'http://localhost:3000/api/flights/search',
  method: 'POST',
  contentType: 'application/json',
  data: JSON.stringify({ from: 'Dubai', to: 'London' }),
  success: function(response) {
    // response is JSON with flight data
    displayFlights(response.flights);
  }
});