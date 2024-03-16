// Function to fetch metrics data from Flask server and update the chart
function updateChart() {
    var element = document.querySelector('.grfmsg');
  
    // Hide the element by setting its display property to 'none'
    element.style.display = 'none';
    var fromDate = document.getElementById("from-date").value;
    var toDate = document.getElementById("to-date").value;

    // Fetch metrics data from Flask server
    fetch('/metrics?start_date=' + fromDate + '&end_date=' + toDate)
        .then(response => response.json())
        .then(data => {
            console.log('Received data:', data); // Log the received data
            
            document.querySelector('.totaluser').innerText = data.total_users;
            document.querySelector('.newuser').innerText = data.new_users;
            document.querySelector('.returininguser').innerText = data.returning_users;
            document.querySelector('.Sessions').innerText = data.sessions;
            document.querySelector('.usermessage').innerText = data.total_messages;
            // Extract dates and counts for each metric
            var sessionsData = data.sessions_data.map(item => ({ x: item[0], y: item[1] }) );
            var newUsersData = data.new_users_data.map(item => ({ x: item[0], y: item[1] }));
            var totalMessagesData = data.total_messages_data.map(item => ({ x: item[0], y: item[1] }));

            // Print x values from sessionsData
console.log('Sessions Data - x values:');
sessionsData.forEach(item => console.log(item.x));

// Print x values from newUsersData
console.log('New Users Data - x values:');
newUsersData.forEach(item => console.log(item.x));

// Print x values from totalMessagesData
console.log('Total Messages Data - x values:');
totalMessagesData.forEach(item => console.log(item.x));

            console.log('sessionsData:', sessionsData);
            console.log('newUsersData:', newUsersData);
            console.log('totalMessagesData:', totalMessagesData);

         

            // Draw chart with new data
            drawChart(sessionsData, newUsersData, totalMessagesData,fromDate,toDate);
        })
        .catch(error => console.error('Error:', error));
}

// Function to draw the chart with the provided data
function drawChart(sessionsData, newUsersData, totalMessagesData, fromDate,toDate) {
    var ctx = document.getElementById('myChart').getContext('2d');
       // Check if myChart exists, destroy it if it does
      
    // Create the chart
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                { label: 'Sessions', data: sessionsData, borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1, fill: false },
                { label: 'New Users', data: newUsersData, borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1, fill: false },
                { label: 'Total Messages', data: totalMessagesData, borderColor: 'rgba(255, 206, 86, 1)', borderWidth: 1, fill: false }
            ]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        parser: 'YYYY-MM-DD',
                        tooltipFormat: 'll',
                        unit: 'day',
                        displayFormats: { day: 'MMM D' },
                        min: fromDate,
                        max: toDate
                    },
                    scaleLabel: { display: true, labelString: 'Date' }
                }],
                yAxes: [{ scaleLabel: { display: true, labelString: 'Value' } }]
            },
            elements: {
                line: {
                  tension: 0.4 // Adjust the tension here (0 means straight lines, higher values create curves)
                }
              }

        }
    });
}
